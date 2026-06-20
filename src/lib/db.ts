import * as SQLite from 'expo-sqlite';
import { DrinkRecord } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDB(): Promise<void> {
  db = await SQLite.openDatabaseAsync('drinks.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS drinks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jan_code TEXT NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT,
      maker TEXT,
      rating INTEGER,
      memo TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function getDB(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('DB not initialized. Call initDB() first.');
  return db;
}

export async function saveDrink(drink: Omit<DrinkRecord, 'id'>): Promise<number> {
  const result = await getDB().runAsync(
    `INSERT INTO drinks (jan_code, name, image_url, maker, rating, memo, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      drink.jan_code,
      drink.name,
      drink.image_url,
      drink.maker,
      drink.rating,
      drink.memo,
      drink.created_at,
    ]
  );
  return result.lastInsertRowId;
}

export async function getDrinks(): Promise<DrinkRecord[]> {
  return await getDB().getAllAsync<DrinkRecord>(
    'SELECT * FROM drinks ORDER BY created_at DESC'
  );
}

export async function getDrinkById(id: number): Promise<DrinkRecord | null> {
  return await getDB().getFirstAsync<DrinkRecord>(
    'SELECT * FROM drinks WHERE id = ?',
    [id]
  );
}

export async function deleteDrink(id: number): Promise<void> {
  await getDB().runAsync('DELETE FROM drinks WHERE id = ?', [id]);
}
