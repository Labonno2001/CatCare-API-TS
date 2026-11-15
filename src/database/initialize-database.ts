
import { AppDataSource } from "./data-source";

export const initializeDatabase = async (): Promise<void> => {
    // Enable foreign key constraints.
    await AppDataSource.query("PRAGMA foreign_keys = ON");

    // Create tables if they do not already exist.
    await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS feeding_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            food_name TEXT NOT NULL,
            quantity_grams REAL NOT NULL CHECK (quantity_grams > 0),
            meal_time TEXT NOT NULL,
            notes TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            record_date TEXT
        )
    `);

    await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS water_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            offered_ml REAL NOT NULL CHECK (offered_ml >= 0),
            consumed_ml REAL CHECK (consumed_ml >= 0),
            measured INTEGER NOT NULL DEFAULT 0,
            notes TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            record_date TEXT
        )
    `);

    await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS cat_profile (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            age REAL NOT NULL CHECK (age >= 0),
            weight_kg REAL NOT NULL CHECK (weight_kg > 0),
            favorite_food TEXT NOT NULL,
            activity TEXT NOT NULL
        )
    `);

    // Check existing columns.
    const feedingColumns = await AppDataSource.query(
        "PRAGMA table_info(feeding_records)"
    );

    const waterColumns = await AppDataSource.query(
        "PRAGMA table_info(water_records)"
    );

    // Add record_date only if it does not exist.
    if (!feedingColumns.some((column: { name: string }) => column.name === "record_date")) {
        await AppDataSource.query(`
            ALTER TABLE feeding_records ADD COLUMN record_date TEXT
        `);
    }

    if (!waterColumns.some((column: { name: string }) => column.name === "record_date")) {
        await AppDataSource.query(`
            ALTER TABLE water_records ADD COLUMN record_date TEXT
        `);
    }

    // Preserve existing records and derive their dates.
    await AppDataSource.query(`
        UPDATE feeding_records
        SET record_date = substr(created_at, 1, 10)
        WHERE record_date IS NULL OR record_date = ''
    `);

    await AppDataSource.query(`
        UPDATE water_records
        SET record_date = substr(created_at, 1, 10)
        WHERE record_date IS NULL OR record_date = ''
    `);

    // Create indexes.
    await AppDataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_feeding_record_date
        ON feeding_records(record_date)
    `);

    await AppDataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_water_record_date
        ON water_records(record_date)
    `);

    // Insert default cat only if it does not exist.
    await AppDataSource.query(`
        INSERT INTO cat_profile (
            id, name, age, weight_kg, favorite_food, activity
        )
        SELECT ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM cat_profile WHERE id = ?
        )
    `, [
        1,
        "Mini",
        3,
        7,
        "Reflex Chicken & Rice",
        "Loves to play with me & toys, catches birds from the window, eats grass, sleeps with me and eats happily",
        1
    ]);

    console.log("TypeORM database initialization completed.");
};
