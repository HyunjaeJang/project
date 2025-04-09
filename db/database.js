import * as SQLite from 'expo-sqlite';
import { initNotifications, scheduleNotificationsForStock, cancelNotificationsForStock } from './notifier';
let db;
//TODO: ui 클릭 시 등록해놓은 이미지 팝업
export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('new1.db');
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS medicine_basic (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      photoUri TEXT
    );
    CREATE TABLE IF NOT EXISTS medicine_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      expiration_date TEXT,
      schedule TEXT,
      favorite INTEGER DEFAULT 0,
      notice TEXT,
      photoUri TEXT,
      FOREIGN KEY(medicine_id) REFERENCES medicine_basic(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS dose_consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stockId INTEGER NOT NULL,
      doseTime TEXT NOT NULL,
      date TEXT NOT NULL,
      UNIQUE(stockId, doseTime, date)
    );
  `);

  const tableInfo = await db.getAllAsync(`PRAGMA table_info(medicine_stock)`);
  
  // favorite 컬럼 체크 (기존 코드)
  const hasFavorite = tableInfo.some((col) => col.name === 'favorite');
  if (!hasFavorite) {
    await db.execAsync(`ALTER TABLE medicine_stock ADD COLUMN favorite INTEGER DEFAULT 0`);
  }
  
  // notice 컬럼 체크: notice 컬럼이 없으면 추가합니다.
  const hasNotice = tableInfo.some((col) => col.name === 'notice');
  if (!hasNotice) {
    await db.execAsync(`ALTER TABLE medicine_stock ADD COLUMN notice TEXT`);
  }
}

export async function addMedicine(id_, name, description, type, photoUri = null) {
  const result = await db.runAsync(
    'INSERT INTO medicine_basic (id, name, description, type, photoUri) VALUES (?, ?, ?, ?, ?)',
    id_, name, description, type, photoUri
  );
  return result.lastInsertRowId;
}

export async function getAllMedicines() {
  const medicines = await db.getAllAsync('SELECT * FROM medicine_basic');
  return medicines;
}

export async function updateMedicine(id, newName, newDescription) {
  const result = await db.runAsync(
    'UPDATE medicine_basic SET name = ?, description = ? WHERE id = ?',
    newName, newDescription, id
  );
  return result.changes;
}

export async function deleteMedicine(id) {
  const result = await db.runAsync(
    'DELETE FROM medicine_basic WHERE id = ?',
    id
  );
  return result.changes;
}

export async function addStock(medicineId, quantity, expirationDate, schedule, notice, uri) {
  // await initNotifications(); // Removed: initNotifications 호출 제거

  // startDate가 설정되어 있지 않으면 현재 날짜(YYYY-MM-DD)를 추가합니다.
  let scheduleObj = {};
  if (schedule) {
    try {
      scheduleObj = JSON.parse(schedule);
    } catch (e) {
      console.error('Schedule parsing error:', e);
    }
  }
  if (!scheduleObj.startDate) {
    scheduleObj.startDate = new Date().toISOString().slice(0, 10);
  }
  // 최종적으로 schedule 문자열로 변환
  const newSchedule = JSON.stringify(scheduleObj);
  console.log(`test: ${uri}`);
  const result = await db.runAsync(
    'INSERT INTO medicine_stock (medicine_id, quantity, expiration_date, schedule, favorite, notice, photoUri) VALUES (?, ?, ?, ?, ?, ?, ?)',
    medicineId, quantity, expirationDate, newSchedule, 0, notice, uri
  );
  const lastId = result.lastInsertRowId;
  const stocks = await db.getAllAsync(
    `SELECT 
        medicine_stock.id           AS stockId,
        medicine_stock.medicine_id  AS medicineId,
        medicine_basic.name         AS medicineName,
        medicine_basic.description  AS memo,
        medicine_stock.quantity,
        medicine_stock.expiration_date,
        medicine_stock.schedule,
        medicine_stock.favorite,
        medicine_basic.photoUri     AS photoUri,
        medicine_stock.notice       AS notice
     FROM medicine_stock
     JOIN medicine_basic ON medicine_stock.medicine_id = medicine_basic.id
     WHERE medicine_stock.id = ?`,
    lastId
  );
  if (stocks && stocks.length > 0) {
    stocks.forEach(async (stock) => {
      await scheduleNotificationsForStock(stock);
    });
  }
  return lastId;
}

export async function getAllStocks() {
  const stocks = await db.getAllAsync(`
    SELECT 
      medicine_stock.id           AS stockId,
      medicine_stock.medicine_id  AS medicineId,
      medicine_basic.name         AS medicineName,
      medicine_basic.description  AS memo,
      medicine_stock.quantity,
      medicine_stock.expiration_date,
      medicine_stock.schedule,
      medicine_stock.favorite,
      medicine_stock.photoUri     AS photoUri,
      medicine_stock.notice       AS notice
    FROM medicine_stock
    JOIN medicine_basic ON medicine_stock.medicine_id = medicine_basic.id
  `);
  return stocks;
}

export async function updateStock(stockId, newQuantity, newExpirationDate, newSchedule) {
  // await initNotifications(); // Removed: initNotifications 호출 제거
  const result = await db.runAsync(
    'UPDATE medicine_stock SET quantity = ?, expiration_date = ?, schedule = ? WHERE id = ?',
    newQuantity, newExpirationDate, newSchedule, stockId
  );
  const stocks = await db.getAllAsync(
    `SELECT 
        medicine_stock.id           AS stockId,
        medicine_stock.medicine_id  AS medicineId,
        medicine_basic.name         AS medicineName,
        medicine_basic.description  AS memo,
        medicine_stock.quantity,
        medicine_stock.expiration_date,
        medicine_stock.schedule,
        medicine_stock.favorite,
        medicine_stock.photoUri     AS photoUri,
        medicine_stock.notice       AS notice
     FROM medicine_stock
     JOIN medicine_basic ON medicine_stock.medicine_id = medicine_basic.id
     WHERE medicine_stock.id = ?`,
    stockId
  );
  if (stocks && stocks.length > 0) {
    stocks.forEach(async (stock) => {
      await scheduleNotificationsForStock(stock);
    });
  }
  return result.changes;
} 

export async function deleteStock(stockId) {
  const result = await db.runAsync(
    'DELETE FROM medicine_stock WHERE id = ?',
    [stockId]
  );
  // 삭제가 성공하면 해당 stock에 예약된 모든 알림도 취소
  if (result.changes > 0) {
    await cancelNotificationsForStock(stockId);
  }
  return result.changes;
}

export async function updateFavorite(stockId, newFavorite) {
  const result = await db.runAsync(
    'UPDATE medicine_stock SET favorite = ? WHERE id = ?',
    newFavorite, stockId
  );
  return result.changes;
}

export async function consumeDose(stockId, doseAmount) {
  const result = await db.runAsync(
    `UPDATE medicine_stock 
     SET quantity = CASE WHEN quantity >= ? THEN quantity - ? ELSE 0 END 
     WHERE id = ?`,
    doseAmount, doseAmount, stockId
  );
  return result.changes;
}

export async function markDoseConsumed(stockId, doseTime, date) {
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO dose_consumption (stockId, doseTime, date) VALUES (?, ?, ?)`,
    stockId, doseTime, date
  );
  return result.changes;
}

export async function getConsumedDoses(date) {
  const rows = await db.getAllAsync(
    `SELECT stockId, doseTime FROM dose_consumption WHERE date = ?`,
    date
  );
  return rows;
}

// 특정 ID의 재고 정보 가져오기
export async function getStockById(stockId) {
  const stock = await db.getFirstAsync(
    `SELECT 
        medicine_stock.id           AS stockId,
        medicine_stock.medicine_id  AS medicineId,
        medicine_basic.name         AS medicineName,
        medicine_basic.description  AS memo,
        medicine_stock.quantity,
        medicine_stock.expiration_date,
        medicine_stock.schedule,
        medicine_stock.favorite,
        medicine_basic.photoUri     AS photoUri,
        medicine_stock.notice       AS notice
     FROM medicine_stock
     JOIN medicine_basic ON medicine_stock.medicine_id = medicine_basic.id
     WHERE medicine_stock.id = ?`,
    stockId
  );
  return stock;
}

// 특정 날짜, 특정 약, 특정 시간에 복용 기록이 있는지 확인
export async function getConsumedDoseToday(stockId, doseTime, date) {
  const row = await db.getFirstAsync(
    `SELECT id FROM dose_consumption WHERE stockId = ? AND doseTime = ? AND date = ?`,
    stockId, doseTime, date
  );
  return row; // row가 있으면 복용 기록이 있는 것, 없으면 null
}
