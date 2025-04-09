import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import FAB from '../../components/FAB';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Gemini Import
import { getLocales } from 'expo-localization';
import { context } from '../../db/language'; // 언어 전환 context 임포트
import { GEMINI_API_KEY } from '@env'; // Use GEMINI_API_KEY

export default function DrugInfoFetch({ navigation }) {
  const def = [{ itemName: context.SELF_ADD }];
  const [data, setData] = useState(def);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notify, setNotify] = useState(null);
  const [imageBase64, setImageBase64] = useState({});

  // --- Gemini Multimodal Function ---
  const getDrugNameFromImage = async (base64) => {
    setLoading(true); // Start loading indicator
    setError(null);
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      // Use a multimodal model like gemini-1.5-flash-latest
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

      const { languageCode } = getLocales()[0];
      const targetLanguage = languageCode === 'ko' ? 'Korean' : 'English';

      const prompt = `Analyze the provided image of a medicine package or pill. Identify the most prominent drug name visible. Respond with ONLY the drug name in ${targetLanguage}. Do not include any other text, explanation, or formatting.`;

      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg', // Assuming JPEG from camera, adjust if needed
          data: base64,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response;
      const drugName = response.text().trim();

      if (!drugName) {
        throw new Error('Could not extract drug name from image.');
      }
      console.log(`Gemini identified drug name: ${drugName}`);
      return drugName;

    } catch (err) {
      console.error('Error calling Gemini API:', err);
      setError(`Gemini API Error: ${err.message}`);
      Alert.alert('오류', '이미지에서 약품 이름을 추출하는 중 오류가 발생했습니다.');
      return null; // Indicate failure
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };
  // --- End Gemini Function ---

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(context.ALARM_TITLE, context.ALARM_CONTENT_5);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      base64: true, // Explicitly request base64 data
    });
    if (!result.canceled && result.assets) { // Check if base64 exists
      return result.assets[0].base64;
    }
    return '';
  };
  // 이미지 다운로드 및 base64 변환
  const downloadImageAsBase64 = async (name, imageUrl) => {
    if (!imageUrl) {
      console.error('Invalid image URL:', imageUrl);
      return;
    }
    try {
      const fileUri = FileSystem.documentDirectory + `${name}.jpg`;
      const downloadResumable = FileSystem.createDownloadResumable(
        imageUrl,
        fileUri
      );
      const { uri } = await downloadResumable.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // 이미지 URL을 base64로 변환하여 상태 업데이트
      setImageBase64((prev) => ({
        ...prev,
        [name]: `data:image/jpeg;base64,${base64}`,
      }));
    } catch (error) {
      console.error('Failed to download and encode image:', error);
    }
  };

  const transformOpenFdaData = (data) => {
    // 고정 헤더 정보
    const header = {
      resultCode: '00',
      resultMsg: 'NORMAL SERVICE.',
    };

    // meta 정보로부터 페이지 정보 추출
    const { skip, limit, total } = data.meta.results;
    const pageNo = skip / limit + 1;
    const totalCount = total;
    const numOfRows = limit;

    // 유틸 함수: 배열 필드를 하나의 문자열로 변환
    const joinField = (field) => (Array.isArray(field) ? field.join(' ') : '');

    // results 배열 내 각 항목을 변환
    const items = data.results.map((item) => {
      // openfda 객체가 있을 경우 각 배열에서 첫번째 값 추출
      const manufacturer =
        item.openfda && item.openfda.manufacturer_name
          ? item.openfda.manufacturer_name[0]
          : '';
      const brandName =
        item.openfda && item.openfda.brand_name
          ? item.openfda.brand_name[0]
          : '';
      const productNDC =
        item.openfda && item.openfda.product_ndc
          ? item.openfda.product_ndc[0]
          : '';

      // effective_time (YYYYMMDD)를 YYYY-MM-DD 형식으로 변환
      let openDe = item.effective_time;
      if (openDe && openDe.length === 8) {
        openDe =
          openDe.slice(0, 4) +
          '-' +
          openDe.slice(4, 6) +
          '-' +
          openDe.slice(6, 8);
      }

      return {
        entpName: manufacturer, // 제조사명
        itemName: brandName, // 브랜드명
        itemSeq: item.id, // 고유 id
        efcyQesitm: joinField(item.indications_and_usage), // 사용적응(효능)
        useMethodQesitm: joinField(item.dosage_and_administration), // 사용방법
        atpnWarnQesitm: joinField(item.warnings), // 주의사항(경고문)
        atpnQesitm: joinField(item.do_not_use), // 금기사항
        // 추가 의약품 관련 주의사항: 의사 상담 관련 문구를 합침
        intrcQesitm: [
          joinField(item.ask_doctor),
          joinField(item.ask_doctor_or_pharmacist),
        ]
          .filter(Boolean)
          .join(' '),
        seQesitm: joinField(item.stop_use), // 복용 중지 관련 안내
        depositMethodQesitm: joinField(item.storage_and_handling), // 보관방법
        openDe: openDe, // 승인일 (형식 변환 완료)
        updateDe: data.meta.last_updated, // 업데이트 날짜(meta에서 추출)
        itemImage: null, // 이미지가 없으므로 null 할당
        bizrno: productNDC, // 제품 식별번호로 product_ndc 사용
      };
    });

    // 최종 변환 객체 구성
    return {
      header,
      body: {
        pageNo,
        totalCount,
        numOfRows,
        items,
      },
    };
  };

  const fetchDrugInfo = async (itemName) => {
    setLoading(true);
    setError(null);
    setData(null);
    setNotify(null);
    setImageBase64({});
    let url, params;
    const { languageCode } = getLocales()[0];
    console.log(languageCode);
    if (languageCode === 'ko') {
      url =
        'https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList';
      params = {
        serviceKey:
          'NAGUqW3ZS8n2SYKGKh9RbO3yUEsszniAu2WYCH7ppgMwb3oo1AW+OcaAT8o6Rst422XyIblNg4YvWn8wVDTDAA==',
        pageNo: '1',
        numOfRows: '100',
        itemName: itemName,
        type: 'json',
      };
    } else {
      url = 'https://api.fda.gov/drug/label.json';
      // 예시: https://api.fda.gov/drug/label.json?search=openfda.brand_name:"tylenol"
      params = {
        search: `openfda.brand_name:"${itemName}"`,
        limit: '100',
      };
    }

    const queryString = Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&');

    try {
      const response = await fetch(`${url}?${queryString}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const raw = await response.json();
      const json = languageCode === 'ko' ? raw : transformOpenFdaData(raw);
      let items = [];
      if (json.body.items === undefined) {
        setNotify('No items found.');
        setData(def);
        setLoading(false);
      } else if (json.body.items) items = [...json.body.items];
      setData([...def, ...items]);

      // 데이터 가져온 후 이미지 다운로드 시작
      items.forEach((item, index) => {
        if (item.itemImage) {
          downloadImageAsBase64(index + 1, item.itemImage);
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDrugInfo(searchTerm);
  };
  const handleImageSearch = async () => {
    const base64 = await handleTakePhoto();
    if (!base64) {
      // Alert is handled in handleTakePhoto if permission denied
      console.log("No base64 data obtained from camera.");
      return;
    }

    // Call the new Gemini function
    const identifiedDrugName = await getDrugNameFromImage(base64);

    if (identifiedDrugName) {
      // Update search term and fetch info
      setSearchTerm(identifiedDrugName);
      fetchDrugInfo(identifiedDrugName);
    } else {
      // Error handling is done within getDrugNameFromImage (Alert shown there)
      console.log("Failed to get drug name from Gemini.");
      // Optionally clear search term or keep previous one
      // setSearchTerm('');
    }
  };

  useEffect(() => {
    // 추가적인 작업이 필요하면 여기에 작성
  }, [data, imageBase64]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{context.ADD_PILL_TITLE}</Text>
      <TextInput
        style={styles.input}
        placeholder={context.SEARCH_PILL}
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <Button title={context.BTN_SEARCH} onPress={handleSearch} color="#6200ee" />
      <Button title={context.BTN_IMAGE_SEARCH} onPress={handleImageSearch} color="#ee6600" />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text>Loading...</Text>
        </View>
      )}

      {notify && (
        <View style={styles.errorContainer}>
          <Text>{notify}</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {data && (
        <ScrollView style={styles.resultsContainer}>
          {data.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => {
                navigation.navigate('AddPillDetail', { item });
              }}>
              {imageBase64[index] && (
                <Image
                  style={styles.image}
                  source={{ uri: imageBase64[index] }}
                  contentFit="cover"
                />
              )}
              <Text style={styles.cardTitle}>{item.itemName}</Text>
              {item.entpName && (
                <>
                  <Text>No. {item.itemSeq} </Text>
                  <Text>Company: {item.entpName}</Text>
                  <Text>Efficacy: {item.efcyQesitm}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  errorText: {
    color: 'red',
  },
  resultsContainer: {
    marginTop: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
});
