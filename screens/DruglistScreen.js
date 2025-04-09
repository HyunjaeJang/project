import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Button,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomAppBar from '../components/BottomAppBar';
import FAB from '../components/FAB';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  getAllStocks,
  updateStock,
  deleteStock,
  initDatabase,
  updateFavorite,
} from '../db/database';
import { context } from '../db/language'; // 언어 전환 context 임포트

const sortOptions = [
  { key: 'favorite', label: context.SORT_METHOD_1 },
  { key: 'name', label: context.SORT_METHOD_2 },
  { key: 'quantity', label: context.SORT_METHOD_3 },
  { key: 'expiration', label: context.SORT_METHOD_4 },
];

export default function DrugListScreen({ navigation }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortCriteria, setSortCriteria] = useState('favorite');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  // Schedule Modal 관련 상태
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editingStockId, setEditingStockId] = useState(null);
  const [doseCount, setDoseCount] = useState(1);
  const [doseTimes, setDoseTimes] = useState([]);
  const [doseAmounts, setDoseAmounts] = useState([]);
  const [mealRelation, setMealRelation] = useState('');
  const [frequency, setFrequency] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentEditingTimeIndex, setCurrentEditingTimeIndex] = useState(null);
  const [nDayInterval, setNDayInterval] = useState('');
  // 추가: 사진 팝업 관련 상태
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState(null);

  const getSortLabel = (key) => {
    const option = sortOptions.find((o) => o.key === key);
    return option ? option.label : '';
  };

  const fetchStocks = async () => {
    await initDatabase();
    try {
      if (!scheduleModalVisible) {
        const data = await getAllStocks();
        const now = new Date();
        const validData = data.filter((item) => {
          const expDate = item.expiration_date
            ? new Date(item.expiration_date)
            : null;
          return item.quantity > 0 && (!expDate || expDate >= now);
        });
        setStocks(validData);
      }
    } catch (error) {
      console.error('재고 정보를 불러오는 중 에러 발생:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!scheduleModalVisible) fetchStocks();
    const intervalId = setInterval(fetchStocks, 1000);
    return () => clearInterval(intervalId);
  }, [scheduleModalVisible]);

  const openScheduleModal = (scheduleString, stockId) => {
    let scheduleObj = {};
    try {
      scheduleObj = scheduleString ? JSON.parse(scheduleString) : {};
    } catch (error) {
      console.error('schedule 파싱 에러:', error);
    }
    const initialDoseCount = scheduleObj.doseTimes
      ? scheduleObj.doseTimes.length
      : 1;
    setDoseCount(initialDoseCount);
    setDoseTimes(
      scheduleObj.doseTimes
        ? [...scheduleObj.doseTimes]
        : new Array(initialDoseCount).fill('')
    );
    setDoseAmounts(
      scheduleObj.doseAmounts
        ? [...scheduleObj.doseAmounts]
        : new Array(initialDoseCount).fill(1)
    );
    setMealRelation(scheduleObj.mealRelation || '');
    setFrequency(scheduleObj.frequency || '');
    setSelectedDays(scheduleObj.selectedDays || []);
    if (scheduleObj.intervalDays) {
      setNDayInterval(scheduleObj.intervalDays.toString());
    } else {
      setNDayInterval('');
    }
    setEditingStockId(stockId);
    setScheduleModalVisible(true);
  };

  const handleIncreaseDose = () => {
    const newCount = doseCount + 1;
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

  const handleSaveSchedule = async () => {
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
    const newScheduleStr = JSON.stringify(scheduleObj);
    const stockToUpdate = stocks.find(
      (item) => item.stockId === editingStockId
    );
    if (stockToUpdate) {
      try {
        await updateStock(
          editingStockId,
          stockToUpdate.quantity,
          stockToUpdate.expiration_date,
          newScheduleStr
        );
        setStocks(
          stocks.map((item) =>
            item.stockId === editingStockId
              ? { ...item, schedule: newScheduleStr }
              : item
          )
        );
      } catch (error) {
        console.error('DB 업데이트 중 에러 발생:', error);
      }
    }
    setScheduleModalVisible(false);
    fetchStocks();
  };

  const toggleFavorite = async (stockId, currentFavorite) => {
    try {
      const newFav = currentFavorite ? 0 : 1;
      await updateFavorite(stockId, newFav);
      setStocks(
        stocks.map((item) =>
          item.stockId === stockId ? { ...item, favorite: newFav } : item
        )
      );
    } catch (error) {
      console.error('즐겨찾기 업데이트 에러:', error);
    }
  };

  const handlePhotoPress = (photoUri) => {
    if (photoUri) {
      setSelectedPhotoUri(photoUri);
      setPhotoModalVisible(true);
    } else {
      Alert.alert(context.ALARM_TITLE, context.ALARM_CONTENT_4);
    }
  };

  const renderItem = ({ item }) => {
    let scheduleDisplay = '';
    try {
      const scheduleObj = item.schedule ? JSON.parse(item.schedule) : {};
      if (scheduleObj.doseTimes && scheduleObj.doseAmounts) {
        scheduleDisplay = scheduleObj.doseTimes
          .map(
            (time, idx) =>
              `${time} (${scheduleObj.doseAmounts[idx] ? scheduleObj.doseAmounts[idx] : 0
              }${context.NOTIFER_UNIT})`
          )
          .join(', ');
      } else {
        scheduleDisplay = context.DETAIL_PLAN_IN;
      }
    } catch (error) {
      scheduleDisplay = context.DETAIL_PLAN_IN;
    }
    /*TODO: 수량 소진이나 유통기한 만료 특정 기간 전 알람 기능*/
    return (
      <TouchableOpacity onPress={() => handlePhotoPress(item.photoUri)}>
        <View style={styles.item}>
          <Text style={styles.title}>{item.medicineName}</Text>
          <Text>
            {context.ELEMENT_AMT}
            {item.quantity}
          </Text>
          <Text>
            {context.ELEMENT_EXP}
            {item.expiration_date}
          </Text>
          {item.notice ? (
            <Text style={styles.noticeText}>메모: {item.notice}</Text>
          ) : null}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => openScheduleModal(item.schedule, item.stockId)}>
              <Text style={styles.scheduleButtonText}>{scheduleDisplay}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(item.stockId, item.favorite)}>
              <Text style={styles.favoriteButtonText}>
                {item.favorite ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert(
                  context.BTN_DELETE,
                  context.BTN_DELETE_IN,
                  [
                    { text: context.DETAIL_BACK, style: 'cancel' },
                    {
                      text: context.BTN_DELETE,
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteStock(item.stockId);
                          setStocks(
                            stocks.filter((i) => i.stockId !== item.stockId)
                          );
                        } catch (error) {
                          console.error('삭제 중 오류 발생:', error);
                        }
                      },
                    },
                  ],
                  { cancelable: true }
                );
              }}>
              <Text style={styles.scheduleButtonText}>
                {context.BTN_DELETE}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getSortedStocks = () => {
    let sorted = [...stocks];
    if (sortCriteria === 'favorite') {
      sorted.sort((a, b) => {
        if (b.favorite - a.favorite !== 0) return b.favorite - a.favorite;
        return a.medicineName.localeCompare(b.medicineName);
      });
    } else if (sortCriteria === 'name') {
      sorted.sort((a, b) => a.medicineName.localeCompare(b.medicineName));
    } else if (sortCriteria === 'quantity') {
      sorted.sort((a, b) => a.quantity - b.quantity);
    } else if (sortCriteria === 'expiration') {
      sorted.sort((a, b) => {
        const dateA = a.expiration_date
          ? new Date(a.expiration_date)
          : new Date(8640000000000000);
        const dateB = b.expiration_date
          ? new Date(b.expiration_date)
          : new Date(8640000000000000);
        return dateA - dateB;
      });
    }
    return sorted;
  };

  const sortedStocks = getSortedStocks();

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        {!loading && (
          <View style={styles.sortMenuContainer}>
            <TouchableOpacity
              style={styles.sortIconContainer}
              onPress={() => setSortMenuVisible(!sortMenuVisible)}>
              <FontAwesome5 name="sort" size={20} color="#000" />
              <Text style={styles.sortLabel}>{getSortLabel(sortCriteria)}</Text>
            </TouchableOpacity>
            {sortMenuVisible && (
              <View style={styles.sortOptionsVertical}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={styles.sortOption}
                    onPress={() => {
                      setSortCriteria(option.key);
                      setSortMenuVisible(false);
                    }}>
                    <Text style={styles.sortOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FlatList
            data={sortedStocks}
            keyExtractor={(item) => item.stockId.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.flatList}
          />
        )}
      </View>
      <FAB onPress={() => navigation.navigate('AddPills')} />
      <BottomAppBar navigation={navigation} />

      <Modal
        visible={scheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{context.DETAIL_PLAN_IN}</Text>
            <View style={styles.row}>
              <Button title="–" onPress={handleDecreaseDose} />
              <Text style={styles.doseCountText}>
                {doseCount}
                {context.DETAIL_PLAN_NUM}
              </Text>
              <Button title="+" onPress={handleIncreaseDose} />
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
            <Button title={context.DETAIL_SAVE} onPress={handleSaveSchedule} />
            <Button
              title={context.DETAIL_BACK}
              onPress={() => setScheduleModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'relative',
  },
  flatList: { paddingBottom: 100 },
  item: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  noticeText: {
    fontSize: 14,
    color: '#444',
    fontStyle: 'italic',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  scheduleButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteButton: {
    backgroundColor: '#AF4C50',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  scheduleButtonText: { color: '#fff', fontWeight: 'bold' },
  favoriteButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  favoriteButtonText: { color: '#fff', fontWeight: 'bold' },
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
  dayButtonText: { color: '#fff', fontSize: 12, textAlign: 'center' },
  sortMenuContainer: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  sortIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sortLabel: { marginLeft: 4, color: '#000', fontWeight: 'bold' },
  sortOptionsVertical: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 4,
  },
  sortOption: { paddingVertical: 4, paddingHorizontal: 8 },
  sortOptionText: { color: '#000' },
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
