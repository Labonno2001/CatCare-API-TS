
import Database from "better-sqlite3";
import path from "node:path";
import { mkdirSync } from "node:fs";
import dotenv from "dotenv";

// Load environment variables before reading database configuration
dotenv.config();

// Use Render's persistent disk path in production.
// Use the local data folder during development.
const databasePath =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "catcare.db");

// Ensure the database directory exists
mkdirSync(path.dirname(databasePath), { recursive: true });

// Connect to SQLite
const db = new Database(databasePath);

// Enable foreign key constraints
db.pragma("foreign_keys = ON");

// Create database tables if they do not already exist
db.exec(`
    CREATE TABLE IF NOT EXISTS feeding_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_name TEXT NOT NULL,
        quantity_grams REAL NOT NULL CHECK (quantity_grams > 0),
        meal_time TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS water_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offered_ml REAL NOT NULL CHECK (offered_ml >= 0),
        consumed_ml REAL CHECK (consumed_ml >= 0),
        measured INTEGER NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
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

// Insert the default cat profile only if it does not exist
const existingCat = db
    .prepare("SELECT id FROM cat_profile WHERE id = 1")
    .get();

if (!existingCat) {
    db.prepare(`
        INSERT INTO cat_profile (
            id, name, age, weight_kg, favorite_food, activity
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        1,
        "Mini",
        3,
        7,
        "Reflex Chicken & Rice",
        "Loves to play with me & toys, Catches birds from the window, eats grass, sleeps with me and eats happily"
    );
}

console.log("CatCare SQLite database connected successfully");
console.log(`Database location: ${databasePath}`);

export default db;
