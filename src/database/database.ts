
import Database from "better-sqlite3";
import path from "node:path";
import { mkdirSync } from "node:fs";
import dotenv from "dotenv";

dotenv.config();

const databasePath =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "catcare.db");

mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);

db.pragma("foreign_keys = ON");

// Create tables with record_date for new databases.
db.exec(`
    CREATE TABLE IF NOT EXISTS feeding_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_name TEXT NOT NULL,
        quantity_grams REAL NOT NULL CHECK (quantity_grams > 0),
        meal_time TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        record_date TEXT
    );

    CREATE TABLE IF NOT EXISTS water_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offered_ml REAL NOT NULL CHECK (offered_ml >= 0),
        consumed_ml REAL CHECK (consumed_ml >= 0),
        measured INTEGER NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        record_date TEXT
    );

    CREATE TABLE IF NOT EXISTS cat_profile (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        age REAL NOT NULL CHECK (age >= 0),
        weight_kg REAL NOT NULL CHECK (weight_kg > 0),
        favorite_food TEXT NOT NULL,
        activity TEXT NOT NULL
    );
`);

// Check whether a column exists.
const hasColumn = (table: string, column: string): boolean => {
    const columns = db.pragma(`table_info(${table})`) as {
        name: string;
    }[];

    return columns.some(item => item.name === column);
};

// Safely migrate existing feeding records.
if (!hasColumn("feeding_records", "record_date")) {
    db.exec(`
        ALTER TABLE feeding_records
        ADD COLUMN record_date TEXT
    `);
}

// Safely migrate existing water records.
if (!hasColumn("water_records", "record_date")) {
    db.exec(`
        ALTER TABLE water_records
        ADD COLUMN record_date TEXT
    `);
}

// Preserve existing records and derive their initial dates
// from their previously stored timestamps.
db.exec(`
    UPDATE feeding_records
    SET record_date = substr(created_at, 1, 10)
    WHERE record_date IS NULL OR record_date = '';

    UPDATE water_records
    SET record_date = substr(created_at, 1, 10)
    WHERE record_date IS NULL OR record_date = '';
`);

// Indexes improve date-filtering performance.
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_feeding_record_date
    ON feeding_records(record_date);

    CREATE INDEX IF NOT EXISTS idx_water_record_date
    ON water_records(record_date);
`);

// Insert the default cat profile only if it does not exist.
const existingCat = db
    .prepare("SELECT id FROM cat_profile WHERE id = ?")
    .get(1);

if (!existingCat) {
    db.prepare(`
        INSERT INTO cat_profile (
            id,
            name,
            age,
            weight_kg,
            favorite_food,
            activity
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        1,
        "Mini",
        3,
        7,
        "Reflex Chicken & Rice",
        "Loves to play with me & toys, catches birds from the window, eats grass, sleeps with me and eats happily"
    );
}

console.log("CatCare SQLite database connected successfully");
console.log(`Database location: ${databasePath}`);
console.log("Feeding and water date migration completed.");

export default db;
