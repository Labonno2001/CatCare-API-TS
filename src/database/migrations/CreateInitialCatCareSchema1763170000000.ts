import {
    MigrationInterface,
    QueryRunner
} from "typeorm";

/**
 * Creates the original CatCare schema for a brand-new database.
 *
 * This migration is also safe to introduce to an older existing database:
 * CREATE TABLE IF NOT EXISTS preserves tables that already exist.
 *
 * The next migration adds cat_id and the foreign-key relationships.
 */
export class CreateInitialCatCareSchema1763170000000
    implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // Create the original cat profile table if it does not exist.
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS cat_profile (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                age REAL NOT NULL CHECK (age >= 0),
                weight_kg REAL NOT NULL CHECK (weight_kg > 0),
                favorite_food TEXT NOT NULL,
                activity TEXT NOT NULL
            )
        `);

        // Create the original feeding table if it does not exist.
        // cat_id is added by the following relationship migration.
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS feeding_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                food_name TEXT NOT NULL,
                quantity_grams REAL NOT NULL
                    CHECK (quantity_grams > 0),
                meal_time TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                record_date TEXT
            )
        `);

        // Create the original water table if it does not exist.
        // cat_id is added by the following relationship migration.
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS water_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                offered_ml REAL NOT NULL
                    CHECK (offered_ml >= 0),
                consumed_ml REAL
                    CHECK (consumed_ml >= 0),
                measured INTEGER NOT NULL DEFAULT 0,
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                record_date TEXT
            )
        `);

        // Older versions may have tables without record_date.
        // Add the column only when it is missing.
        const feedingColumns = await queryRunner.query(
            "PRAGMA table_info(feeding_records)"
        ) as Array<{ name: string }>;

        if (!feedingColumns.some(column => column.name === "record_date")) {
            await queryRunner.query(`
                ALTER TABLE feeding_records
                ADD COLUMN record_date TEXT
            `);
        }

        const waterColumns = await queryRunner.query(
            "PRAGMA table_info(water_records)"
        ) as Array<{ name: string }>;

        if (!waterColumns.some(column => column.name === "record_date")) {
            await queryRunner.query(`
                ALTER TABLE water_records
                ADD COLUMN record_date TEXT
            `);
        }

        // Fill only missing dates. Existing record_date values are preserved.
        await queryRunner.query(`
            UPDATE feeding_records
            SET record_date = substr(created_at, 1, 10)
            WHERE record_date IS NULL OR record_date = ''
        `);

        await queryRunner.query(`
            UPDATE water_records
            SET record_date = substr(created_at, 1, 10)
            WHERE record_date IS NULL OR record_date = ''
        `);

        // Create the date indexes if they are not already present.
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_feeding_record_date
            ON feeding_records(record_date)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_water_record_date
            ON water_records(record_date)
        `);

        // Add Mini only when cat ID 1 does not already exist.
        // Existing cat data is never overwritten.
        await queryRunner.query(`
            INSERT INTO cat_profile (
                id,
                name,
                age,
                weight_kg,
                favorite_food,
                activity
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
    }

    /**
     * This baseline migration may be applied to a database whose tables
     * existed before TypeORM migration tracking was introduced.
     *
     * Dropping these tables here could destroy pre-existing user data.
     * Therefore this adoption/baseline migration is intentionally
     * irreversible. Later feature migrations should provide their own
     * safe down() implementations.
     */
    public async down(_queryRunner: QueryRunner): Promise<void> {
        throw new Error(
          "The initial CatCare schema migration is intentionally irreversible " +
"to protect tables and data that may have existed before migration tracking."
        );
    }
}
