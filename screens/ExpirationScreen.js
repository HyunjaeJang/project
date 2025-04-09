import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  Image,
  Modal,
  Linking, // Linking 임포트 추가
} from 'react-native';
import BottomAppBar from '../components/BottomAppBar';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { getAllStocks, deleteStock } from '../db/database';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { locations } from '../db/location';
import { context } from '../db/language';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const groups = [
  { id: '1', name: context.FORM_HARD_TITLE },
  { id: '2', name: context.FORM_LIQUID_TITLE },
  { id: '3', name: context.FORM_SPECIAL_TITLE },
];

const drugFormsByGroup = {
  1: [
    {
      id: '1',
      name: context.FORM_1,
      icon: <FontAwesome5 name="prescription-bottle" size={24} color="white" />,
      disposalMethodWaste: context.DISPOSAL_METHOD_1_DIS,
      disposalMethodNonWaste: context.DISPOSAL_METHOD_1_NONDIS,
    },
    {
      id: '2',
      name: context.FORM_2,
      icon: <MaterialIcons name="local-pharmacy" size={24} color="white" />,
      disposalMethodWaste: context.DISPOSAL_METHOD_2_DIS,
      disposalMethodNonWaste: context.DISPOSAL_METHOD_2_NONDIS,
    },
    {
      id: '3',
      name: context.FORM_3,
      icon: <FontAwesome5 name="tablets" size={24} color="white" />,
      disposalMethodWaste: context.DISPOSAL_METHOD_3_DIS,
      disposalMethodNonWaste: context.DISPOSAL_METHOD_3_NONDIS,
    },
  ],
  2: [
    {
      id: '4',
      name: context.FORM_4,
      icon: <Ionicons name="water" size={24} color="white" />,
      disposalMethodWaste: context.DISPOSAL_METHOD_4_DIS,
      disposalMethodNonWaste: context.DISPOSAL_METHOD_4_NONDIS,
    },
    {
      id: '5',
      name: context.FORM_5,
      icon: <FontAwesome5 name="medkit" size={24} color="white" />,
      disposalMethodWaste: context.DISPOSAL_METHOD_5_DIS,
      disposalMethodNonWaste: context.DISPOSAL_METHOD_5_NONDIS,
    },
  ],
  3: [
    {
      id: '6',
      name: context.FORM_6,
      icon: <MaterialIcons name="layers" size={24} color="white" />,
      disposalMethodWaste: context.DISPOSAL_METHOD_6_DIS,
      disposalMethodNonWaste: context.DISPOSAL_METHOD_6_NONDIS,
    },
    {
      id: '7',
      name: context.FORM_7,
      icon: <MaterialIcons name="local-hospital" size={24} color="white" />,
      disposalMethodWaste: context.DISPOSAL_METHOD_7_DIS,
      disposalMethodNonWaste: context.DISPOSAL_METHOD_7_NONDIS,
    },
    {
      id: '8',
      name: context.FORM_8,
      icon: <FontAwesome5 name="syringe" size={24} color="white" />,
      disposalMethodWaste: context.DISPOSAL_METHOD_8_DIS,
      disposalMethodNonWaste: context.DISPOSAL_METHOD_8_NONDIS,
    },
  ],
};

export default function ExpirationScreen({ navigation }) {
  const [selectedGroup, setSelectedGroup] = useState(groups[0]);
  const loc = locations;
  const [visibleLocations, setVisibleLocations] = useState([]);
  const [selectedDrugForm, setSelectedDrugForm] = useState(null);
  const [expiredList, setExpiredList] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.5665,
    longitude: 126.978,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef(null);
  const disposalScrollRef = useRef(null);

  // 사진 팝업 관련 상태
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState(null);

  const filterLocations = (region) => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const minLat = latitude - latitudeDelta / 2;
    const maxLat = latitude + latitudeDelta / 2;
    const minLng = longitude - longitudeDelta / 2;
    const maxLng = longitude + longitudeDelta / 2;
    const filtered = locations.filter(
      (loc) =>
        loc.COORD_Y >= minLat &&
        loc.COORD_Y <= maxLat &&
        loc.COORD_X >= minLng &&
        loc.COORD_X <= maxLng
    );
    const sorted = filtered.sort((a, b) => {
      const distA = (a.COORD_Y - latitude) ** 2 + (a.COORD_X - longitude) ** 2;
      const distB = (b.COORD_Y - latitude) ** 2 + (b.COORD_X - longitude) ** 2;
      return distA - distB;
    });
    return sorted.slice(0, 20);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSelectedGroup(groups[0]);
      setSelectedDrugForm(null);
      setCurrentPage(0);
      checkExpiredMedicines();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('위치 접근 권한이 거부되었습니다.');
          // 사용자에게 알림 표시
          Alert.alert(
            context.LOCATION_PERMISSION_DENIED_TITLE, // '위치 권한 거부됨'
            context.LOCATION_PERMISSION_DENIED_MESSAGE, // '지도에 현재 위치와 주변 폐의약품 수거 장소를 표시하려면 위치 권한이 필요합니다. 설정에서 권한을 허용해주세요.'
            [
              { text: context.CANCEL, style: 'cancel' }, // '취소'
              { text: context.GO_TO_SETTINGS, onPress: () => Linking.openSettings() } // '설정으로 이동'
            ]
          );
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        setMapRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } catch (error) {
        console.error("Error getting current location: ", error);
        // 사용자에게 오류 알림 표시 (선택 사항)
        Alert.alert(context.LOCATION_ERROR_TITLE, context.LOCATION_ERROR_MESSAGE);
      }
    })();
  }, []);

  useEffect(() => {
    setVisibleLocations(filterLocations(mapRegion));
  }, [loc, mapRegion]);

  const onRegionChangeComplete = (region) => {
    setVisibleLocations(filterLocations(region));
  };

  const checkExpiredMedicines = async () => {
    try {
      const stocks = await getAllStocks();
      const now = new Date();
      const expired = stocks.filter((item) => {
        const expDate = item.expiration_date
          ? new Date(item.expiration_date)
          : null;
        return item.quantity <= 0 || (expDate && expDate < now);
      });
      setExpiredList(expired);
      setCurrentPage(0);
    } catch (error) {
      console.error('Error fetching stocks: ', error);
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedDrugForm(null);
  };

  const handleSelectDrugForm = (form) => {
    if (disposalScrollRef.current) {
      disposalScrollRef.current.scrollTo({ y: 0, animated: false });
    }
    setSelectedDrugForm(form);
  };

  const handleRemoveExpired = async (stockId) => {
    try {
      await deleteStock(stockId);
      const updatedList = expiredList.filter(
        (item) => item.stockId !== stockId
      );
      setExpiredList(updatedList);
      const totalPages = Math.ceil(updatedList.length / itemsPerPage);
      if (currentPage >= totalPages && totalPages > 0) {
        setCurrentPage(totalPages - 1);
      }
    } catch (error) {
      console.error('Error deleting expired stock: ', error);
    }
  };

  const totalPages = Math.ceil(expiredList.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const pageItems = expiredList.slice(startIndex, startIndex + itemsPerPage);

  const goToCurrentLocation = async () => {
    try {
      let loc = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500);
      }
    } catch (error) {
      console.error('Error getting current location: ', error);
      // 사용자에게 오류 알림 표시 (선택 사항)
      Alert.alert(context.LOCATION_ERROR_TITLE, context.LOCATION_ERROR_MESSAGE);
    }
  };

  // 약 항목 터치 시 사진 팝업 모달을 여는 함수
  const handlePhotoPress = (photoUri) => {
    if (photoUri) {
      setSelectedPhotoUri(photoUri);
      setPhotoModalVisible(true);
    } else {
      Alert.alert('알림', '등록된 사진이 없습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.innerContainer}>
        {/* 그룹 선택 */}
        <View style={styles.groupContainer}>
          {groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[
                styles.groupBox,
                selectedGroup?.id === group.id && styles.selectedGroupBox,
              ]}
              onPress={() => handleSelectGroup(group)}>
              <Text style={styles.groupText}>{group.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* 제형 선택 */}
        {selectedGroup && (
          <View style={styles.drugFormRowContainer}>
            {drugFormsByGroup[selectedGroup.id].map((form) => (
              <TouchableOpacity
                key={form.id}
                style={[
                  styles.drugFormBox,
                  selectedDrugForm?.id === form.id &&
                  styles.selectedDrugFormBox,
                ]}
                onPress={() => handleSelectDrugForm(form)}>
                <View style={styles.iconContainer}>{form.icon}</View>
                <Text style={styles.drugFormText}>{form.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* 폐기 방법 안내 영역 */}
        <View style={styles.disposalMethodContainer}>
          <ScrollView
            ref={disposalScrollRef}
            style={styles.disposalMethodScroll}
            contentContainerStyle={{ alignItems: 'flex-start' }}
            nestedScrollEnabled={true}>
            {selectedDrugForm ? (
              <>
                <Text style={styles.drugFormName}>{selectedDrugForm.name}</Text>
                <Text style={styles.disposalMethodTitle}>
                  {context.DISPOSAL_METHOD_1_DIS.includes(
                    '폐의약품수거함 사용 시'
                  )
                    ? '' // 제목은 별도 키 없이 내용만 보여줄 수도 있음
                    : ''}
                </Text>
                <Text style={styles.disposalMethod}>
                  {selectedDrugForm.disposalMethodWaste}
                </Text>
                <Text style={styles.disposalMethodTitle}>
                  {context.DISPOSAL_METHOD_1_DIS.includes(
                    '폐의약품수거함 사용 시'
                  )
                    ? ''
                    : ''}
                </Text>
                <Text style={styles.disposalMethod}>
                  {selectedDrugForm.disposalMethodNonWaste}
                </Text>
              </>
            ) : (
              <Text style={styles.disposalPrompt}>
                {context.DISPOSAL_METHOD_IN}
              </Text>
            )}
          </ScrollView>
        </View>
        {/* 유통기한 만료/수량 소진 약품 목록 */}
        <View style={styles.expiredListContainer}>
          <Text style={styles.expiredListTitle}>{context.EXP_LIST_TITLE}</Text>
          {expiredList.length > 0 ? (
            <>
              {pageItems.map((item) => (
                <TouchableOpacity
                  key={item.stockId}
                  onPress={() => handlePhotoPress(item.photoUri)}>
                  <View style={styles.expiredItem}>
                    <View style={styles.expiredItemInfo}>
                      <Text style={styles.expiredItemText}>
                        {item.medicineName} ({context.ELEMENT_AMT}
                        {item.quantity})
                      </Text>
                      {item.expiration_date && (
                        <Text style={styles.expiredItemText}>
                          {context.ELEMENT_EXP}
                          {item.expiration_date}
                        </Text>
                      )}
                      {item.notice ? (
                        <Text style={styles.noticeText}>
                          메모: {item.notice}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveExpired(item.stockId)}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={24}
                        color="green"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      currentPage > 0 && setCurrentPage(currentPage - 1)
                    }>
                    <Text style={styles.paginationArrow}>{'<'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.paginationText}>
                    {currentPage + 1} / {totalPages}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      currentPage < totalPages - 1 &&
                      setCurrentPage(currentPage + 1)
                    }>
                    <Text style={styles.paginationArrow}>{'>'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.expiredEmptyText}>{context.EXP_LIST_IN}</Text>
          )}
        </View>

        {/* 지도 영역 */}
        <View style={styles.mapContainer}>
          <Text style={styles.mapTitle}>{context.MAP_TITLE}</Text>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={mapRegion}
            onRegionChangeComplete={onRegionChangeComplete}>
            {visibleLocations.map((lo) => (
              <Marker
                // TEL_NO가 유효하면 사용하고, 그렇지 않으면 좌표를 조합하여 고유 키 생성
                key={lo.TEL_NO ? `${lo.TEL_NO}_${lo.COORD_Y}_${lo.COORD_X}` : `${lo.COORD_Y}_${lo.COORD_X}`}
                coordinate={{ latitude: lo.COORD_Y, longitude: lo.COORD_X }}
                title={lo.VALUE_01}
                description={lo.ADDR_NEW}
                calloutDisabled={true}
              />
            ))}
          </MapView>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={goToCurrentLocation}>
            <Ionicons name="locate-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomAppBar navigation={navigation} />

      {/* 사진 팝업 모달 */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}>
        <View style={styles.photoModalContainer}>
          <View style={styles.photoModalContent}>
            {selectedPhotoUri && (
              <Image
                source={{ uri: selectedPhotoUri }}
                style={styles.photoImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              onPress={() => setPhotoModalVisible(false)}
              style={styles.closeButton}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#f5f5f5',
  },
  innerContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  groupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 0,
  },
  groupBox: {
    flex: 1,
    height: 40,
    backgroundColor: '#8e24aa',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  selectedGroupBox: { backgroundColor: '#6a1b9a' },
  groupText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  drugFormRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#00bfa5',
    marginBottom: 0,
  },
  drugFormBox: {
    flex: 1,
    height: 60,
    backgroundColor: '#00bfa5',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  selectedDrugFormBox: {
    backgroundColor: '#00796b',
    transform: [{ scale: 1.05 }],
    borderColor: '#000000',
    borderWidth: 1,
  },
  iconContainer: { marginBottom: 8 },
  drugFormText: { fontSize: 12, color: 'white', textAlign: 'center' },
  disposalMethodContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    width: '100%',
    height: 200,
  },
  disposalMethodScroll: { flex: 1 },
  drugFormName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
  },
  disposalMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'left',
  },
  disposalMethod: { fontSize: 16, textAlign: 'left' },
  disposalPrompt: { fontSize: 16, color: '#757575', textAlign: 'center' },
  expiredListContainer: {
    marginTop: 20,
    marginBottom: 16,
    width: '100%',
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
  },
  expiredListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#c62828',
    textAlign: 'center',
  },
  expiredItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#ffcdd2',
    borderRadius: 4,
  },
  expiredItemInfo: { flex: 1 },
  expiredItemText: { fontSize: 14, color: '#b71c1c' },
  expiredEmptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 10,
  },
  noticeText: { fontSize: 14, color: '#b71c1c' },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationArrow: { fontSize: 24, marginHorizontal: 20 },
  paginationText: { fontSize: 16 },
  mapContainer: {
    width: '100%',
    minHeight: windowHeight / 3,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
  },
  map: { flex: 1 },
  locationButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    elevation: 3,
  },
  photoModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  photoModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  photoImage: { width: '100%', height: 300 },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: { color: '#fff', fontWeight: 'bold' },
});
