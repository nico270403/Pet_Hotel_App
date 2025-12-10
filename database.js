// database.js
import { openDatabaseSync } from 'expo-sqlite';
import { Platform } from 'react-native';

console.log('SQLite module in database.js:', { openDatabaseSync });

const openDatabase = () => {
  // Fallback pentru web
  if (Platform.OS === 'web') {
    console.log('Using mock database for web platform');
    return {
      exec: (queries, readOnly = false) => {
        console.log('Mock exec:', queries);
        return Promise.resolve([]);
      }
    };
  }
  
  try {
    const database = openDatabaseSync('hotel_animale.db');
    console.log('SQLite database opened successfully with new API');
    console.log('Database methods:', Object.keys(database));
    return database;
  } catch (error) {
    console.error('Error opening SQLite database:', error);
    throw error;
  }
};

const db = openDatabase();

export const initDatabase = () => {
  return new Promise(async (resolve, reject) => {
    console.log('Initializing database with new SQLite API...');
    
    try {
      console.log('Available methods on db:', Object.keys(db));
      
      if (db.runSync) {
        console.log('Using runSync method...');
        
        db.runSync(
          `CREATE TABLE IF NOT EXISTS hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            short_description TEXT,
            long_description TEXT,
            address TEXT,
            city TEXT,
            phone TEXT,
            email TEXT,
            website TEXT,
            latitude REAL,
            longitude REAL,
            rating REAL DEFAULT 0,
            price_from REAL DEFAULT 0,
            currency TEXT DEFAULT 'RON',
            created_at TEXT DEFAULT (datetime('now'))
          );`
        );

        db.runSync(
          `CREATE TABLE IF NOT EXISTS hotel_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_id INTEGER,
            uri TEXT,
            is_primary INTEGER DEFAULT 0,
            FOREIGN KEY(hotel_id) REFERENCES hotels(id)
          );`
        );

        db.runSync(
          `CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_id INTEGER,
            pet_name TEXT,
            owner_name TEXT,
            start_date TEXT,
            end_date TEXT,
            services TEXT,
            price REAL,
            currency TEXT DEFAULT 'RON',
            status TEXT DEFAULT 'pending',
            synced INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(hotel_id) REFERENCES hotels(id)
          );`
        );

        db.runSync(`CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);`);
        db.runSync(`CREATE INDEX IF NOT EXISTS idx_bookings_synced ON bookings(synced);`);
        
        console.log('✅ Database initialized successfully with runSync');
        resolve(db);
        return;
      }
      
      if (db.execSync) {
        console.log('Using execSync method...');
        db.execSync(`
          CREATE TABLE IF NOT EXISTS hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            short_description TEXT,
            long_description TEXT,
            address TEXT,
            city TEXT,
            phone TEXT,
            email TEXT,
            website TEXT,
            latitude REAL,
            longitude REAL,
            rating REAL DEFAULT 0,
            price_from REAL DEFAULT 0,
            currency TEXT DEFAULT 'RON',
            created_at TEXT DEFAULT (datetime('now'))
          );
          
          CREATE TABLE IF NOT EXISTS hotel_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_id INTEGER,
            uri TEXT,
            is_primary INTEGER DEFAULT 0,
            FOREIGN KEY(hotel_id) REFERENCES hotels(id)
          );
          
          CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_id INTEGER,
            pet_name TEXT,
            owner_name TEXT,
            start_date TEXT,
            end_date TEXT,
            services TEXT,
            price REAL,
            currency TEXT DEFAULT 'RON',
            status TEXT DEFAULT 'pending',
            synced INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(hotel_id) REFERENCES hotels(id)
          );
          
          CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
          CREATE INDEX IF NOT EXISTS idx_bookings_synced ON bookings(synced);
        `);
        
        console.log('✅ Database initialized successfully with execSync');
        resolve(db);
        return;
      }
      
      throw new Error('No compatible database methods found');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      reject(error);
    }
  });
};

export default db;