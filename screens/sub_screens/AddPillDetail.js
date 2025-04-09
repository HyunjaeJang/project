import React, { useEffect, useState, useCallback, useRef } from 'react'; // useRef 임포트
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { context } from '../../db/language'; // 언어 전환 context 임포트
import { getLocales } from 'expo-localization';
import {
  initDatabase,
  addMedicine,
  getAllMedicines,
  addStock,
} from '../../db/database';
import {
  initNotifications,
  scheduleNotificationsForStock,
} from '../../db/notifier';

const packagingPatterns = [
  {
    patternName: 'Volume',
    regex:
      /(\d+(?:\.\d+)?)(mL|ml|밀리리터|밀리미터|g|그램|정|캡슐|포|환|병|백|앰플|시린지|바이알|캔|PTP)\s*(?:\/|x|X|×|\*)\s*(\d+)?\s*(병|백|앰플|캡슐|정|포|환|시린지|바이알|캔|PTP|상자|피티피)?/g,
  },
  {
    patternName: 'Custom',
    regex:
      /(내수용|수출용)\s*:\s*(\d+(?:\.\d+)?)(mL|ml|밀리리터|밀리미터|g|그램|정|캡슐|포|환|병|백|앰플|시린지|바이알|캔|PTP)\s*(?:\/|x|X|×|\*)\s*(\d+)?\s*(병|백|앰플|캡슐|정|포|환|시린지|바이알|캔|PTP)?/g,
  },
];

const unitMap = {
  mL: 'ml',
  밀리리터: 'ml',
  그램: 'g',
  캡슐: 'capsule',
  포: 'packet',
  환: 'pill',
  병: 'bottle',
  백: 'bag',
  앰플: 'ampoule',
  시린지: 'syringe',
  바이알: 'vial',
  캔: 'can',
  정: 'tablet',
  PTP: 'ptp',
};

export default function AddPillDetail({ route, navigation }) {
  const { item } = route.params;
  // "수동으로 추가하기"를 SELF_ADD 키로 비교하여 수동 추가 여부 결정
  const isManual = item.itemName === context.SELF_ADD;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedPackUnits, setParsedPackUnits] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [schedule, setSchedule] = useState('{}');
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [doseCount, setDoseCount] = useState(1);
  const [doseTimes, setDoseTimes] = useState([]);
  const [doseAmounts, setDoseAmounts] = useState([]);
  const [mealRelation, setMealRelation] = useState('');
  const [frequency, setFrequency] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentEditingTimeIndex, setCurrentEditingTimeIndex] = useState(null);
  const [nDayInterval, setNDayInterval] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  // 새로운 notice 상태 추가
  const [notice, setNotice] = useState('');
  const latestPhotoUriRef = useRef(''); // 사진 URI를 저장할 ref 생성

  const transformOpenFdaData = (data) => {
    const header = {
      resultCode: '00',
      resultMsg: 'NORMAL SERVICE.',
    };

    const { skip, limit, total } = data.meta.results;
    const pageNo = skip / limit + 1;
    const totalCount = total;
    const numOfRows = limit;

    const joinField = (field) => (Array.isArray(field) ? field.join(' ') : '');

    const items = data.results.map((item) => {
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
        ENTP_NAME: manufacturer,
        ITEM_NAME: brandName,
        ITEM_SEQ: item.id,
        efcyQesitm: joinField(item.indications_and_usage),
        useMethodQesitm: joinField(item.dosage_and_administration),
        atpnWarnQesitm: joinField(item.warnings),
        atpnQesitm: joinField(item.do_not_use),
        intrcQesitm: [
          joinField(item.ask_doctor),
          joinField(item.ask_doctor_or_pharmacist),
        ]
          .filter(Boolean)
          .join(' '),
        PACK_UNIT: '',
        seQesitm: joinField(item.stop_use),
        depositMethodQesitm: joinField(item.storage_and_handling),
        openDe: openDe,
        updateDe: data.meta.last_updated,
        itemImage: null,
        bizrno: productNDC,
      };
    });

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

  const handleIncreaseDose = () => {
    const newCount = doseCount + 1;
    if(newCount > 5) return;
    setDoseCount(newCount);
    if (doseTimes.length < newCount) {
      setDoseTimes([...doseTimes, '']);
      setDoseAmounts([...doseAmounts, 1]);
    }
  };

  const handleDecreaseDose = () => {
    if (doseCount > 1) {
      const newCount = doseCount - 1;
      setDoseCount(newCount);
      setDoseTimes(doseTimes.slice(0, newCount));
      setDoseAmounts(doseAmounts.slice(0, newCount));
    }
  };

  const handleDoseTimePress = (index) => {
    setCurrentEditingTimeIndex(index);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
      const newDoseTimes = [...doseTimes];
      newDoseTimes[currentEditingTimeIndex] = formattedTime;
      setDoseTimes(newDoseTimes);
    }
  };

  // renderMealOptions: 옵션을 language 키로 사용
  const renderMealOptions = () => {
    const options = [
      context.PLAN_FOOD_BEF,
      context.PLAN_FOOD_MID,
      context.PLAN_FOOD_AFT,
    ];
    return options.map((option) => (
      <TouchableOpacity
        key={option}
        style={[
          styles.optionButton,
          mealRelation === option && styles.selectedOptionButton,
        ]}
        onPress={() => setMealRelation(option)}>
        <Text style={styles.optionButtonText}>{option}</Text>
      </TouchableOpacity>
    ));
  };

  // renderFrequencyOptions: 언어 키를 사용해 옵션 표시
  const renderFrequencyOptions = () => {
    const options = [
      context.PLAN_TERM_DAY,
      context.PLAN_TERM_WEEK,
      context.PLAN_TERM_TWEEK,
      context.PLAN_TERM_INT,
    ];
    return options.map((option) => (
      <TouchableOpacity
        key={option}
        style={[
          styles.optionButton,
          frequency === option && styles.selectedOptionButton,
        ]}
        onPress={() => setFrequency(option)}>
        <Text style={styles.optionButtonText}>{option}</Text>
      </TouchableOpacity>
    ));
  };

  // renderDayButtons: 요일 버튼을 language 키를 이용하여 출력
  const renderDayButtons = () => {
    const days = [
      context.PLAN_TERM_WEEK_MON,
      context.PLAN_TERM_WEEK_TUE,
      context.PLAN_TERM_WEEK_WED,
      context.PLAN_TERM_WEEK_THU,
      context.PLAN_TERM_WEEK_FRI,
      context.PLAN_TERM_WEEK_SAT,
      context.PLAN_TERM_WEEK_SUN,
    ];
    return days.map((day) => (
      <TouchableOpacity
        key={day}
        style={[
          styles.dayButton,
          selectedDays.includes(day) && styles.selectedDayButton,
        ]}
        onPress={() => {
          if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter((d) => d !== day));
          } else {
            setSelectedDays([...selectedDays, day]);
          }
        }}>
        <Text style={styles.dayButtonText}>{day}</Text>
      </TouchableOpacity>
    ));
  };

  const handleSaveSchedule = () => {
    const scheduleObj = {
      doseTimes,
      doseAmounts,
      mealRelation,
      frequency,
      selectedDays:
        frequency === context.PLAN_TERM_WEEK ||
          frequency === context.PLAN_TERM_TWEEK
          ? selectedDays
          : [],
      intervalDays:
        frequency === context.PLAN_TERM_INT
          ? parseInt(nDayInterval, 10) || 1
          : undefined,
    };
    setSchedule(JSON.stringify(scheduleObj));
    setScheduleModalVisible(false);
  };

  const handleParsedUnitPress = (unitItem) => {
    if (unitItem.quantity) {
      setQuantity(unitItem.quantity);
    }
  };

  const parsePackUnit = (packUnits) => {
    let results = [];
    packUnits.forEach((packUnit) => {
      packagingPatterns.forEach(({ regex, patternName }) => {
        const matches = [...packUnit.matchAll(regex)];
        matches.forEach((match) => {
          if (patternName === 'Volume') {
            results.push({
              quantity: match[1],
              unit: unitMap[match[2]] ?? match[2],
              secondQuantity: match[3] || '',
              secondUnit: match[4] ? unitMap[match[4]] ?? match[4] : '',
              patternType: 'Volume',
            });
          } else {
            results.push({
              usageType: match[1],
              quantity: match[2],
              unit: unitMap[match[3]] ?? match[3],
              secondQuantity: match[4] || '',
              secondUnit: match[5] ? unitMap[match[5]] ?? match[5] : '',
              patternType: 'Custom',
            });
          }
        });
      });
    });
    return results;
  };

  const fetchDrugInfo = useCallback(async (itemSeq) => {
    setLoading(true);
    setError(null);
    setData(null);
    let url, params;
    const { languageCode } = getLocales()[0];
    if (languageCode === 'ko') {
      url =
        'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService06/getDrugPrdtPrmsnDtlInq05';
      params = {
        serviceKey:
          'NAGUqW3ZS8n2SYKGKh9RbO3yUEsszniAu2WYCH7ppgMwb3oo1AW+OcaAT8o6Rst422XyIblNg4YvWn8wVDTDAA==',
        pageNo: '1',
        numOfRows: '1',
        item_seq: itemSeq,
        type: 'json',
      };
    } else {
      url = 'https://api.fda.gov/drug/label.json';
      params = {
        search: `id:"${itemSeq}"`,
        limit: '1',
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
        throw new Error(context.ALARM_CONTENT_3);
      }
      const raw = await response.json();
      const json = languageCode === 'ko' ? raw : transformOpenFdaData(raw);
      if (!json.body.items) {
        throw new Error(context.ALARM_CONTENT_3);
      }

      const itemData = json.body.items[0];
      const packUnits = itemData.PACK_UNIT?.split(',') || [];
      const parsed = parsePackUnit(packUnits);
      setParsedPackUnits(parsed);

      const finalData = {
        ...itemData,
        parsedPackUnit: parsed,
      };
      setData(finalData);

      await checkAndSaveMedicine(finalData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkDatabaseForMedicine = async (itemName) => {
    await initDatabase();
    const allMeds = await getAllMedicines();
    return allMeds.find((med) => med.name === itemName) || null;
  };

  const checkAndSaveMedicine = async (apiData) => {
    await initDatabase();
    await initNotifications();
    const existingMedicine = await checkDatabaseForMedicine(apiData.ITEM_NAME);
    if (existingMedicine) {
      console.log('Medicine already in DB:', existingMedicine);
    } else {
      console.log('Adding new medicine to DB:', apiData.ITEM_NAME);
      await addMedicine(
        apiData.ITEM_SEQ.toString(),
        apiData.ITEM_NAME,
        '', // 약 분류(설명) 제거
        apiData.parsedPackUnit || apiData.PACK_UNIT,
        photoUri || ''
      );
    }
  };

  useEffect(() => {
    if (isManual) {
      setMedicineName('');
      setData({});
    } else {
      fetchDrugInfo(item.itemSeq);
    }
  }, [item, isManual, fetchDrugInfo]);

  useEffect(() => {
    if (!isManual && data) {
      setMedicineName(data.ITEM_NAME || '');
    }
  }, [data, isManual]);

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
      const newUri = result.assets[0].uri;
      setPhotoUri(newUri); // 상태 업데이트
      latestPhotoUriRef.current = newUri; // Ref 업데이트 (동기적)
    }
  };

  const handleSave = async () => {
    try {
      await initDatabase();
      let med;
      let currentSchedule = schedule; // Use local variable for schedule logic

      if (isManual) {
        let customName = medicineName.trim();
        if (customName === '') {
          customName = context.DETAIL_NAME; // Default name
        }
        med = await checkDatabaseForMedicine(customName);
        if (!med) {
          const customId = Date.now().toString();
          // addMedicine 호출 시 ref 값 사용
          await addMedicine(customId, customName, '', '', latestPhotoUriRef.current || '');
          med = await checkDatabaseForMedicine(customName);
          if (!med) {
            // If still not found after adding, something is wrong
            console.error("Failed to find custom medicine after adding:", customName);
            throw new Error(context.ALARM_CONTENT_6); // Use generic save error
          }
        }

        // Default schedule logic only for manual add
        if (!currentSchedule || currentSchedule.trim() === '{}') {
          const now = new Date();
          now.setMinutes(now.getMinutes() + 1);
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const defaultDoseTime = `${hours}:${minutes}`;
          const defaultScheduleObj = {
            doseTimes: [defaultDoseTime],
            doseAmounts: [1],
            mealRelation: '',
            frequency: context.PLAN_TERM_DAY,
            selectedDays: [
              context.PLAN_TERM_WEEK_SUN,
              context.PLAN_TERM_WEEK_MON,
              context.PLAN_TERM_WEEK_TUE,
              context.PLAN_TERM_WEEK_WED,
              context.PLAN_TERM_WEEK_THU,
              context.PLAN_TERM_WEEK_FRI,
              context.PLAN_TERM_WEEK_SAT,
            ],
          };
          currentSchedule = JSON.stringify(defaultScheduleObj);
          // Avoid immediate state update here as it might not reflect in time for addStock
          // setSchedule(currentSchedule);
        }
      } else { // Not manual (API search)
        if (!data) {
          Alert.alert(context.ALARM_TITLE, context.ALARM_CONTENT_2);
          return; // Exit early
        }
        med = await checkDatabaseForMedicine(medicineName);
        if (!med) {
          // If medicine from API search isn't found, it's an issue.
          // checkAndSaveMedicine should have added it. Log and alert.
          console.error("Medicine from API search not found in DB:", medicineName);
          Alert.alert(context.ALARM_TITLE, context.ALARM_CONTENT_3);
          return; // Exit early
        }
        // No default schedule logic needed here
      }

      // --- Common logic ---
      // Ensure med is valid before proceeding
      if (!med || !med.id) {
        console.error("Medicine ID is missing before adding stock.");
        throw new Error(context.ALARM_CONTENT_6); // Use generic save error
      }

      // Add stock using the determined 'med' and 'currentSchedule'
      await addStock(
        med.id,
        parseInt(quantity, 10) || 0,
        expirationDate || '',
        currentSchedule || '{}', // Use the potentially updated local variable
        notice,
        latestPhotoUriRef.current || '' // addStock 호출 시 ref 값 사용
      );

      // Common success actions
      Alert.alert(context.ALARM_TITLE, context.ALARM_CONTENT_1);
      navigation.goBack();

    } catch (err) {
      // Common error handling
      console.error("Error saving pill details:", err); // Log the actual error
      // Show a generic error message to the user, or the specific error if available
      Alert.alert(context.ALARM_TITLE, err.message || context.ALARM_CONTENT_6);
    }
  };

  const renderSchedulePreview = () => {
    if (!schedule || schedule.trim() === '{}') return null;
    let scheduleObj;
    try {
      scheduleObj = JSON.parse(schedule);
    } catch (e) {
      return <Text style={styles.schedulePreview}>{schedule}</Text>;
    }
    if (scheduleObj.doseTimes && scheduleObj.doseAmounts) {
      const times = scheduleObj.doseTimes
        .map((time, idx) => {
          const count = scheduleObj.doseAmounts[idx] || 0;
          return `${context.PLAN_NUM}${idx + 1}: ${time || context.PLAN_TIME} (${count}${context.NOTIFER_UNIT})`;
        })
        .join(', ');
      let preview = `${context.DETAIL_PLAN_IN}: ${times}`;
      if (scheduleObj.mealRelation)
        preview += ` / ${context.PLAN_FOOD_BEF}${scheduleObj.mealRelation}`;
      if (scheduleObj.frequency) {
        let freqText = scheduleObj.frequency;
        if (scheduleObj.frequency === '매일') freqText = context.PLAN_TERM_DAY;
        else if (scheduleObj.frequency === '매주')
          freqText = context.PLAN_TERM_WEEK;
        else if (scheduleObj.frequency === '격주')
          freqText = context.PLAN_TERM_TWEEK;
        else if (scheduleObj.frequency === 'n일마다')
          freqText = context.PLAN_TERM_INT;
        preview += ` / 빈도: ${freqText}`;
      }
      if (scheduleObj.selectedDays && scheduleObj.selectedDays.length > 0) {
        const dayMapping = {
          월: context.PLAN_TERM_WEEK_MON,
          화: context.PLAN_TERM_WEEK_TUE,
          수: context.PLAN_TERM_WEEK_WED,
          목: context.PLAN_TERM_WEEK_THU,
          금: context.PLAN_TERM_WEEK_FRI,
          토: context.PLAN_TERM_WEEK_SAT,
          일: context.PLAN_TERM_WEEK_SUN,
        };
        const days = scheduleObj.selectedDays.map((day) => dayMapping[day] || day);
        preview += ` / 요일: ${days.join(', ')}`;
      }
      if (scheduleObj.intervalDays)
        preview += ` / ${context.PLAN_TERM_INT_INFO}${scheduleObj.intervalDays}`;
      return <Text style={styles.schedulePreview}>{preview}</Text>;
    }
    return <Text style={styles.schedulePreview}>{schedule}</Text>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : error ? (
          <Text style={styles.errorText}>Error: {error}</Text>
        ) : (
          <ScrollView style={styles.scrollContainer}>
            <View style={styles.innerContainer}>
              <Text style={styles.label}>{context.DETAIL_NAME}</Text>
              <TextInput
                style={styles.input}
                value={medicineName}
                onChangeText={setMedicineName}
                placeholder={context.DETAIL_NAME_IN}
              />
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handleTakePhoto}>
                <Text style={styles.photoButtonText}>
                  {context.DETAIL_IMG}
                </Text>
              </TouchableOpacity>
              {photoUri && (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                />
              )}
              {!isManual && (
                <>
                  <Text style={styles.label}>{context.DETAIL_PACK}</Text>
                  {parsedPackUnits.length ? (
                    parsedPackUnits.map((unitItem, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleParsedUnitPress(unitItem)}>
                        <View style={styles.parsedRow}>
                          {unitItem.patternType === 'Volume' ? (
                            <Text>
                              {context.DETAIL_PACK_AMT_1}: {unitItem.quantity}, {context.DETAIL_PACK_UNIT_1}:{' '}
                              {unitItem.unit}, {context.DETAIL_PACK_AMT_2}: {unitItem.secondQuantity}, {context.DETAIL_PACK_UNIT_2}:{' '}
                              {unitItem.secondUnit}
                            </Text>
                          ) : (
                            <Text>
                              [Custom] {unitItem.usageType} - {context.DETAIL_PACK_AMT_1}:{' '}
                              {unitItem.quantity}, {context.DETAIL_PACK_UNIT_1}: {unitItem.unit}, {context.DETAIL_PACK_AMT_2}:{' '}
                              {unitItem.secondQuantity}, {context.DETAIL_PACK_UNIT_2}:{' '}
                              {unitItem.secondUnit}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text>({context.DETAIL_PACK_IN})</Text>
                  )}
                </>
              )}
              <Text style={styles.label}>{context.DETAIL_AMT}</Text>
              <TextInput
                style={styles.input}
                placeholder={context.DETAIL_AMT_IN}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
              {/* 새로 Notice 입력란 추가 */}
              <Text style={styles.label}>{context.DETAIL_NOTICE || 'Notice'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your notice"
                value={notice}
                onChangeText={setNotice}
              />
              <View style={styles.datePickerContainer}>
                <Text style={styles.label}>{context.DETAIL_EXP}</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <View style={styles.parsedRow}>
                    <Text>
                      {expirationDate ? expirationDate : context.DETAIL_EXP_IN}
                    </Text>
                  </View>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={expirationDate ? new Date(expirationDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const year = selectedDate.getFullYear();
                        const month = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
                        const day = ('0' + selectedDate.getDate()).slice(-2);
                        setExpirationDate(`${year}-${month}-${day}`);
                      }
                    }}
                  />
                )}
              </View>
              <Text style={styles.label}>{context.DETAIL_PLAN}</Text>
              <TouchableOpacity
                style={styles.modalOpenButton}
                onPress={() => {
                  if (doseTimes.length === 0) {
                    setDoseTimes(new Array(doseCount).fill(''));
                    setDoseAmounts(new Array(doseCount).fill(1));
                  }
                  setScheduleModalVisible(true);
                }}>
                <Text style={styles.modalOpenButtonText}>
                  {context.DETAIL_PLAN_IN}
                </Text>
              </TouchableOpacity>
              {renderSchedulePreview()}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSave}>
                  <Text style={styles.actionButtonText}>
                    {context.DETAIL_SAVE}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.goBack()}>
                  <Text style={styles.actionButtonText}>
                    {context.DETAIL_BACK}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      <Modal
        visible={scheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{context.DETAIL_PLAN_IN}</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.smallActionButton}
                onPress={handleDecreaseDose}>
                <Text style={styles.smallActionButtonText}>–</Text>
              </TouchableOpacity>
              <Text style={styles.doseCountText}>
                {doseCount}
                {context.DETAIL_PLAN_NUM}
              </Text>
              <TouchableOpacity
                style={styles.smallActionButton}
                onPress={handleIncreaseDose}>
                <Text style={styles.smallActionButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {doseTimes.map((time, index) => (
              <View key={index} style={styles.doseItem}>
                <TouchableOpacity
                  onPress={() => handleDoseTimePress(index)}
                  style={styles.timeButton}>
                  <Text style={styles.timeButtonText}>
                    {`${context.PLAN_NUM}${index + 1}: ${time || context.PLAN_TIME
                      }`}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.pillCountInput}
                  keyboardType="numeric"
                  value={doseAmounts[index]?.toString()}
                  onChangeText={(text) => {
                    const newAmounts = [...doseAmounts];
                    newAmounts[index] = parseInt(text, 10) || 0;
                    setDoseAmounts(newAmounts);
                  }}
                  placeholder="개수 입력"
                />
              </View>
            ))}
            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
            <View style={styles.row}>{renderMealOptions()}</View>
            <View style={styles.row}>{renderFrequencyOptions()}</View>
            {frequency === context.PLAN_TERM_INT && (
              <View style={styles.row}>
                <Text style={styles.label}>{context.PLAN_TERM_INT_INFO}</Text>
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  keyboardType="numeric"
                  value={nDayInterval}
                  onChangeText={setNDayInterval}
                  placeholder={context.PLAN_TERM_INT_IN}
                />
              </View>
            )}
            {(frequency === context.PLAN_TERM_WEEK ||
              frequency === context.PLAN_TERM_TWEEK) && (
                <View style={styles.row}>{renderDayButtons()}</View>
              )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSaveSchedule}>
                <Text style={styles.actionButtonText}>
                  {context.DETAIL_SAVE}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setScheduleModalVisible(false)}>
                <Text style={styles.actionButtonText}>
                  {context.DETAIL_BACK}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  innerContainer: { flex: 1, alignItems: 'center' },
  scrollContainer: { width: '100%' },
  label: {
    alignSelf: 'flex-start',
    marginLeft: '5%',
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    width: '90%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  errorText: { color: 'red', marginBottom: 10 },
  parsedRow: {
    marginVertical: 4,
    padding: 8,
    backgroundColor: '#eaeaea',
    borderRadius: 5,
    width: '90%',
  },
  datePickerContainer: {
    width: '90%',
    marginVertical: 8,
    alignItems: 'center',
  },
  schedulePreview: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#555',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  doseCountText: { fontSize: 18 },
  doseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  timeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 10,
    marginVertical: 4,
    alignItems: 'center',
  },
  timeButtonText: { color: '#fff' },
  pillCountInput: {
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: 50,
    height: 40,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  optionButton: {
    backgroundColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  selectedOptionButton: { backgroundColor: '#007BFF' },
  optionButtonText: { color: '#fff' },
  dayButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#ccc',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayButton: { backgroundColor: '#007BFF' },
  dayButtonText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  modalOpenButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
    width: '90%',
  },
  modalOpenButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  actionButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    marginVertical: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  smallActionButton: {
    backgroundColor: '#007BFF',
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 10,
  },
  smallActionButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  photoButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  photoButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  photoPreview: {
    width: 100,
    height: 100,
    marginVertical: 10,
    borderRadius: 8,
  },
});
