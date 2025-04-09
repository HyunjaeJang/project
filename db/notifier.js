import * as Notifications from 'expo-notifications';
import * as SQLite from 'expo-sqlite';
import { Platform, DeviceEventEmitter } from 'react-native';
import { context } from '../db/language';
let db;
global.scheduledNotifications = global.scheduledNotifications || {};
let notificationListenerSetup = false; // 리스너 설정 여부 플래그

export async function setupNotificationCategories() {
  await Notifications.setNotificationCategoryAsync('medicineReminder', [
    {
      identifier: 'SUBSTANCE',
      buttonTitle: context.BTN_CONSUME,
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: context.BTN_POST,
      options: { opensAppToForeground: false },
    },
  ]);
}
export async function scheduleStockNotification(stock, targetDate, message, doseAmount = 1, doseTime) {
  const schedulingOptions = {
    content: {
      title: context.NOTIFER_TITLE,
      body: message,
      data: { stockId: stock.stockId, doseAmount, doseTime },
      categoryIdentifier: 'medicineReminder',
    },
    trigger: targetDate,
  };

  console.log(schedulingOptions);
  const notificationId = await Notifications.scheduleNotificationAsync(schedulingOptions);
  console.log(await Notifications.getAllScheduledNotificationsAsync());
  const key = `${stock.stockId}-${doseTime}`;
  global.scheduledNotifications[key] = notificationId;
  return notificationId;
}


export async function scheduleNotificationsForStock(stock) {
  // 먼저, 만약 약이 수량이 소진되었거나 유통기한이 지난 경우 알림 예약하지 않음.
  const now = new Date();
  if (stock.quantity <= 0) {
    console.log(`Stock ${stock.stockId} quantity exhausted; not scheduling notifications.`);
    return;
  }
  if (stock.expiration_date) {
    const expDate = new Date(stock.expiration_date);
    if (expDate < now) {
      console.log(`Stock ${stock.stockId} expired; not scheduling notifications.`);
      return;
    }
  }

  let scheduleObj;
  try {
    scheduleObj = JSON.parse(stock.schedule);
  } catch (error) {
    console.error('Schedule parsing error:', error);
    return;
  }

  let additionalInfo = '';
  try {
    const rows = await db.getAllAsync(
      `SELECT description FROM medicine_basic WHERE id = ?`,
      stock.medicineId
    );
    if (rows && rows.length > 0 && rows[0].description) {
      additionalInfo = rows[0].description;
    }
  } catch (error) {
    console.error('Additional info query error:', error);
  }

  // 요일 비교 시 context의 요일 키 사용
  if (scheduleObj.frequency === context.PLAN_TERM_WEEK) {
    const days = scheduleObj.selectedDays;
    const dayNames = [
      context.PLAN_TERM_WEEK_SUN,
      context.PLAN_TERM_WEEK_MON,
      context.PLAN_TERM_WEEK_TUE,
      context.PLAN_TERM_WEEK_WED,
      context.PLAN_TERM_WEEK_THU,
      context.PLAN_TERM_WEEK_FRI,
      context.PLAN_TERM_WEEK_SAT,
    ];
    const todayName = dayNames[now.getDay()];
    if (!days.includes(todayName)) {
      return;
    }
  }

  for (let i = 0; i < scheduleObj.doseTimes.length; i++) {
    const time = scheduleObj.doseTimes[i];
    const doseAmount = Number(scheduleObj.doseAmounts && scheduleObj.doseAmounts[i]) || 1;

    // 이미 예약된 알림이 있는지 확인 (미룸 포함)
    const notificationKey = `${stock.stockId}-${time}`;
    if (global.scheduledNotifications && global.scheduledNotifications[notificationKey]) {
      console.log(`Notification already scheduled for ${notificationKey}, skipping.`);
      continue; // 이미 예약된 알림이 있으면 건너뜀
    }

    const [hourStr, minuteStr] = time.split(':');
    let targetDate = new Date(now);
    targetDate.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);

    if (targetDate <= now) {
      if (scheduleObj.frequency === context.PLAN_TERM_TWEEK) {
        while (targetDate <= now) {
          targetDate.setDate(targetDate.getDate() + 14);
        }
      } else if (scheduleObj.frequency === context.PLAN_TERM_INT) {
        const interval = scheduleObj.intervalDays || 1;
        while (targetDate <= now) {
          targetDate.setDate(targetDate.getDate() + interval);
        }
      } else {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    }

    // 알림 메시지 구성: 복용 개수 단위는 context.NOTIFER_UNIT 사용
    let message = stock.medicineName + context.NOTIFER_TITLE_2;
    if (scheduleObj.mealRelation) {
      message += ` (${scheduleObj.mealRelation})`;
    }
    message += ` (${doseAmount}${context.NOTIFER_UNIT})`;
    if (additionalInfo) {
      message += ` (${additionalInfo})`;
    }
    // stock.notice가 있을 경우 메시지에 추가합니다.
    if (stock.notice) {
      message += ` 메모: ${stock.notice}`;
    }
    
    await scheduleStockNotification(stock, targetDate, message, doseAmount, time);
  }
}

export async function cancelScheduledNotificationForDose(stockId, doseTime) {
  const key = `${stockId}-${doseTime}`;
  if (global.scheduledNotifications && global.scheduledNotifications[key]) {
    const id = global.scheduledNotifications[key];
    await Notifications.cancelScheduledNotificationAsync(id);
    delete global.scheduledNotifications[key];
  }
}

// 신규 추가: 특정 stock에 대한 모든 예약 알림 취소 기능
export async function cancelNotificationsForStock(stockId) {
  for (const key of Object.keys(global.scheduledNotifications)) {
    if (key.startsWith(`${stockId}-`)) {
      const notifId = global.scheduledNotifications[key];
      await Notifications.cancelScheduledNotificationAsync(notifId);
      delete global.scheduledNotifications[key];
    }
  }
}

export function setupNotificationResponseListener() {
  if (notificationListenerSetup) {
    console.log('Notification listener already set up.');
    return null; // 이미 설정되었으면 null 반환 또는 다른 처리
  }
  notificationListenerSetup = true; // 플래그 설정
  console.log('Setting up notification response listener.');
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { actionIdentifier, notification } = response;
    // doseAmount는 알림 데이터에서 가져옵니다. 기본값 1 보장.
    const doseAmount = Number(notification.request.content.data.doseAmount) || 1;
    const { stockId, doseTime } = notification.request.content.data; // 원래 복용 시간
    if (!stockId) return;
    if (actionIdentifier === 'SUBSTANCE') {
      try {
        // consumeDose와 markDoseConsumed는 database.js에서 가져옵니다.
        const { consumeDose, markDoseConsumed } = require('../db/database');
        const changes = await consumeDose(stockId, doseAmount);
        console.log(`재고 ${stockId} 업데이트 완료, 변경된 행 수: ${changes}`);
        const formattedDate = new Date().toISOString().slice(0, 10);
        await markDoseConsumed(stockId, doseTime, formattedDate);
        DeviceEventEmitter.emit('doseConsumed', { stockId, doseTime });
        await markDoseConsumed(stockId, doseTime, formattedDate); // 원래 doseTime으로 기록
        DeviceEventEmitter.emit('doseConsumed', { stockId, doseTime });
        // 복용 완료 시, 해당 약과 원래 복용 시간에 대한 예약된 알림(미룸 포함) 취소
        await cancelScheduledNotificationForDose(stockId, doseTime);
      } catch (error) {
        console.error('재고 업데이트 오류:', error);
      }
    } else if (actionIdentifier === 'SNOOZE') {
      // 미루기 전, DB에서 최신 상태 확인
      const { getStockById, getConsumedDoseToday } = require('../db/database');
      const currentStock = await getStockById(stockId);
      const todayStr = new Date().toISOString().slice(0, 10);
      const alreadyConsumed = await getConsumedDoseToday(stockId, doseTime, todayStr);

      if (!currentStock || currentStock.quantity <= 0) {
        console.log(`Stock ${stockId} is already consumed or deleted. Snooze cancelled.`);
        await Notifications.dismissNotificationAsync(notification.request.identifier);
        return; // 재고 없으면 미루지 않음
      }
      if (alreadyConsumed) {
         console.log(`Dose ${stockId}-${doseTime} already consumed today. Snooze cancelled.`);
         await Notifications.dismissNotificationAsync(notification.request.identifier);
         return; // 이미 복용했으면 미루지 않음
      }

      // 기존 알림 취소 (중복 방지)
      await cancelScheduledNotificationForDose(stockId, doseTime);

      const newTriggerDate = new Date();
      newTriggerDate.setMinutes(newTriggerDate.getMinutes() + 1); // 1분 뒤로 미룸

      try {
        // 미룸 알림 메시지 생성 (stock 정보는 위에서 가져온 currentStock 사용)
        let message = currentStock.medicineName + ' ' + context.NOTIFER_TITLE_3;
        if (currentStock.notice) { // 메모 포함
          message += ` 메모: ${currentStock.notice}`;
        }
        // 미룸 알림 예약 (원래 doseTime과 doseAmount 전달)
        await scheduleStockNotification(currentStock, newTriggerDate, message, doseAmount, doseTime);
        console.log(`Notification for ${stockId}-${doseTime} snoozed.`);
      } catch (error) {
        console.error('Error scheduling snoozed notification:', error);
      }
    }
    // 알림 센터에서 알림 제거
    await Notifications.dismissNotificationAsync(notification.request.identifier);
  });
}

export async function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  // 데이터베이스가 이미 열려있지 않은 경우에만 엽니다.
  if (!db) {
     db = await SQLite.openDatabaseAsync('new1.db');
  }
  await setupNotificationCategories();
  setupNotificationResponseListener(); // 수정된 리스너 설정 함수 호출
}
