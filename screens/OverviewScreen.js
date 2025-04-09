import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Image,
  Modal,
  Platform, // Platform 추가
  // ScrollView, // ScrollView 임포트 제거
} from 'react-native';
import BottomAppBar from '../components/BottomAppBar';
import ChatBot from '../components/ChatBot';
import FAB from '../components/FAB';
import {
  getAllStocks,
  consumeDose,
  markDoseConsumed,
  getConsumedDoses,
} from '../db/database';
import { cancelScheduledNotificationForDose } from '../db/notifier';
import { context } from '../db/language';
import * as Notifications from 'expo-notifications'; // Notifications 임포트 추가
const deviceHeight = Dimensions.get('window').height;
const oneThirdHeight = deviceHeight;

const dayNames = [
  context.PLAN_TERM_WEEK_SUN,
  context.PLAN_TERM_WEEK_MON,
  context.PLAN_TERM_WEEK_TUE,
  context.PLAN_TERM_WEEK_WED,
  context.PLAN_TERM_WEEK_THU,
  context.PLAN_TERM_WEEK_FRI,
  context.PLAN_TERM_WEEK_SAT,
];

export default function OverviewScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleItems, setScheduleItems] = useState([]);
  // consumedKeys: ["stockId-doseTime", ...] DB에 기록된 소비 항목 (선택한 날짜 기준)
  const [consumedKeys, setConsumedKeys] = useState([]);
  const [chatBotVisible, setChatBotVisible] = useState(false);

  // 사진 팝업 관련 상태 추가
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState(null);

  // 선택한 날짜에 해당하는 "YYYY-MM-DD" 문자열 반환
  const formatDate = (date) => {
    return date.toISOString().slice(0, 10);
  };

  // 선택한 날짜의 섭취 완료 기록 불러오기
  const loadConsumed = async () => {
    const dateStr = formatDate(selectedDate);
    try {
      const rows = await getConsumedDoses(dateStr);
      const keys = rows.map((row) => `${row.stockId}-${row.doseTime}`);
      setConsumedKeys(keys);
    } catch (error) {
      console.error('Error loading consumed doses:', error);
    }
  };

  const generateWeekDates = () => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  const weekDates = generateWeekDates();

  const fetchScheduleItems = async () => {
    try {
      const stocks = await getAllStocks();
      const items = [];
      stocks.forEach((stock) => {
        if (!stock.schedule) return;
        // 우선, 수량 및 유통기한 확인
        const now = new Date();
        const selected = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        if (stock.quantity <= 0) return; // 수량 소진된 약은 일정 표시 안함
        if (stock.expiration_date) {
          const expDate = new Date(stock.expiration_date);
          if (selected >= expDate) return;
        }

        const scheduleObj = JSON.parse(stock.schedule);
        if (scheduleObj.startDate) {
          const scheduleStart = new Date(
            new Date(scheduleObj.startDate).getFullYear(),
            new Date(scheduleObj.startDate).getMonth(),
            new Date(scheduleObj.startDate).getDate()
          );
          if (selected < scheduleStart) return;
        }

        const frequency = scheduleObj.frequency;
        let applicable = false;
        if (frequency === context.PLAN_TERM_DAY) {
          applicable = true;
        } else if (frequency === context.PLAN_TERM_WEEK) {
          const selectedDayName = dayNames[selected.getDay()];
          if (
            scheduleObj.selectedDays &&
            scheduleObj.selectedDays.includes(selectedDayName)
          ) {
            applicable = true;
          }
        } else if (frequency === context.PLAN_TERM_TWEEK) {
          const selectedDayName = dayNames[selected.getDay()];
          if (
            scheduleObj.selectedDays &&
            scheduleObj.selectedDays.includes(selectedDayName)
          ) {
            const diffWeeks = Math.floor(
              (selected - new Date(
                new Date(scheduleObj.startDate).getFullYear(),
                new Date(scheduleObj.startDate).getMonth(),
                new Date(scheduleObj.startDate).getDate()
              )) / (7 * 24 * 60 * 60 * 1000)
            );
            if (diffWeeks % 2 === 0) applicable = true;
          }
        } else if (frequency === context.PLAN_TERM_INT) {
          const interval = scheduleObj.intervalDays || 1;
          let scheduleStart = selected;
          if (scheduleObj.startDate) {
            scheduleStart = new Date(
              new Date(scheduleObj.startDate).getFullYear(),
              new Date(scheduleObj.startDate).getMonth(),
              new Date(scheduleObj.startDate).getDate()
            );
          }
          const diffDays = Math.floor(
            (selected - scheduleStart) / (24 * 60 * 60 * 1000)
          );
          if (diffDays % interval === 0) applicable = true;
        }
        if (applicable && scheduleObj.doseTimes && scheduleObj.doseAmounts) {
          scheduleObj.doseTimes.forEach((time, idx) => {
            items.push({
              stockId: stock.stockId,
              medicineName: stock.medicineName,
              quantity: stock.quantity,
              expiration_date: stock.expiration_date,
              doseTime: time,
              doseAmount: scheduleObj.doseAmounts[idx] || 0,
              photoUri: stock.photoUri,
              // notice 값 추가
              notice: stock.notice,
            });
            console.log(stock.photoUri);
          });
        }
      });
      items.sort((a, b) => {
        const [ah, am] = a.doseTime.split(':').map(Number);
        const [bh, bm] = b.doseTime.split(':').map(Number);
        return ah - bh || am - bm;
      });
      setScheduleItems(items);
      await loadConsumed();
    } catch (error) {
      console.error('Error fetching schedule items: ', error);
    }
  };

  useEffect(() => {
    fetchScheduleItems();
  }, [selectedDate]);

  // 알림 권한 요청 로직 추가
  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      let token;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert(context.ALARM_TITLE, context.ALARM_PERMISSION_DENIED); // 권한 거부 시 알림
        return;
      }
      // 필요한 경우 여기서 토큰을 얻을 수 있습니다:
      // token = (await Notifications.getExpoPushTokenAsync()).data;
      // console.log(token);
    };

    registerForPushNotificationsAsync();
  }, []); // 빈 배열을 전달하여 마운트 시 한 번만 실행되도록 설정

  // 사용자가 약 UI를 클릭했을 때 호출됨
  const handlePhotoPress = (photoUri) => {
    if (photoUri) {
      setSelectedPhotoUri(photoUri);
      setPhotoModalVisible(true);
    } else {
      Alert.alert(context.ALARM_TITLE, context.ALARM_CONTENT_4);
    }
  };

  // 섭취 버튼 처리
  const handleConsume = async (item) => {
    try {
      await consumeDose(item.stockId, item.doseAmount);
      await cancelScheduledNotificationForDose(item.stockId, item.doseTime);
      await markDoseConsumed(
        item.stockId,
        item.doseTime,
        formatDate(selectedDate)
      );
      await loadConsumed();
      fetchScheduleItems();
    } catch (error) {
      console.error('Error consuming dose:', error);
    }
  };

  const renderDateItem = (date) => {
    const isSelected = date.toDateString() === selectedDate.toDateString();
    return (
      <TouchableOpacity
        onPress={() => setSelectedDate(date)}
        style={[styles.dateItem, isSelected && styles.selectedDateItem]}>
        <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>
          {date.getDate()}
        </Text>
        <Text style={[styles.dayText, isSelected && styles.selectedDateText]}>
          {dayNames[date.getDay()]}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderScheduleItem = ({ item }) => {
    const key = `${item.stockId}-${item.doseTime}`;
    const consumed = consumedKeys.includes(key);
    return (
      <TouchableOpacity onPress={() => handlePhotoPress(item.photoUri)}>
        <View style={styles.scheduleCard}>
          <Text style={styles.medicineName}>{item.medicineName}</Text>
          <Text style={styles.details}>
            {context.ELEMENT_AMT}
            {item.quantity} / {context.ELEMENT_EXP}
            {item.expiration_date || '-'}
          </Text>
          <Text style={styles.dosing}>
            {context.ELEMENT_TIME}
            {item.doseTime} / {context.ELEMENT_CNT}
            {item.doseAmount}
          </Text>

          {/*TODO: notice 값 미뤄진 알림에 제대로 표시*/}
          {/* notice 표시: 값이 있으면 출력 */}
          {item.notice ? (
            <Text style={styles.noticeText}>메모: {item.notice}</Text>
          ) : null}
          {consumed ? (
            <Text style={styles.consumedLabel}>
              {context.BTN_CONSUME_FIN}
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.consumeButton}
              onPress={() => handleConsume(item)}>
              <Text style={styles.consumeButtonText}>
                {context.BTN_CONSUME}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* ScrollView를 View로 변경 */}
      <View style={styles.scheduleContainer}>
        <View style={styles.dateBar}>
          {weekDates.map((date, index) => (
            <View key={index}>{renderDateItem(date)}</View>
          ))}
        </View>
        {scheduleItems.length > 0 ? (
          <FlatList
            data={scheduleItems}
            keyExtractor={(item, index) => `${item.stockId}-${index}`}
            renderItem={renderScheduleItem}
            style={styles.scheduleList}
          />
        ) : (
          <Text style={styles.noScheduleText}>{context.OVERVIEW_EMPTY}</Text>
        )}
      {/* View 닫기 */}
      </View>

      {/* FAB and ChatBot moved outside the main content flow */}
      <ChatBot
        visible={chatBotVisible}
        onClose={() => setChatBotVisible(false)}
      />
      <View style={styles.bottomBar}>
        <BottomAppBar navigation={navigation} />
      </View>

      {/* FAB positioned absolutely */}
      <FAB onPress={() => setChatBotVisible(true)} icon="chat" style={styles.fab} />

      {/* 사진 모달 */}
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
  scheduleContainer: {
    flex: 1, // FlatList가 확장될 수 있도록 flex: 1 추가
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  dateBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dateItem: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDateItem: {
    backgroundColor: '#007BFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  dateText: { fontSize: 16, color: '#000' },
  dayText: { fontSize: 12, color: '#000' },
  selectedDateText: { color: '#fff', fontWeight: 'bold' },
  // scheduleList: { flex: 1 }, // Remove flex: 1 from FlatList style
  scheduleList: { /* Styles for FlatList if needed, but not flex: 1 */ },
  scheduleCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 0.5,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  details: { fontSize: 14, color: '#555' },
  dosing: { fontSize: 14, color: '#555', marginTop: 2 },
  // notice 텍스트 스타일 추가
  noticeText: {
    fontSize: 14,
    color: '#444',
    fontStyle: 'italic',
    marginTop: 4,
  },
  consumedLabel: {
    fontSize: 12,
    color: 'green',
    marginTop: 4,
    textAlign: 'right',
  },
  consumeButton: {
    marginTop: 4,
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  consumeButtonText: { color: '#fff', fontSize: 14 },
  noScheduleText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
    fontSize: 15,
  },
  // bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0 }, // position: 'absolute' 제거
  bottomBar: { /* 스타일이 필요하면 여기에 추가 */ },
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
  fab: { // Style for absolutely positioned FAB
    position: 'absolute',
    right: 16,
    bottom: 70, // Adjust margin as needed (considering BottomAppBar height)
  },
});
