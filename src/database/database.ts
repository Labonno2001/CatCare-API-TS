
import Database from "better-sqlite3";
import path from "node:path";

const databasePath = path.join(
    process.cwd(),
    "data",
    "catcare.db"
);

const db = new Database(databasePath);

db.pragma("foreign_keys = ON");

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
