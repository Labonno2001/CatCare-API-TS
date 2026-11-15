
import {
    MigrationInterface,
    QueryRunner
} from "typeorm";

export class AddCatIdToFeedingAndWaterRecords1763180000000
    implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // Ensure the default cat exists.
        const cats = await queryRunner.query(
            "SELECT id FROM cat_profile WHERE id = 1"
        );

        if (cats.length === 0) {
            throw new Error(
                "Cannot migrate: Cat profile with ID 1 does not exist."
            );
        }

        // Rebuild feeding_records with cat_id.
        await queryRunner.query(`
            CREATE TABLE feeding_records_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                food_name TEXT NOT NULL,
                quantity_grams REAL NOT NULL
                    CHECK (quantity_grams > 0),
                meal_time TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                record_date TEXT,
                cat_id INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (cat_id)
                    REFERENCES cat_profile(id)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE
            )
        `);

        // Copy all existing feeding records.
        // Every existing record will belong to Mini (ID 1).
        await queryRunner.query(`
            INSERT INTO feeding_records_new (
                id,
                food_name,
                quantity_grams,
                meal_time,
                notes,
                created_at,
                record_date,
                cat_id
            )
            SELECT
                id,
                food_name,
                quantity_grams,
                meal_time,
                notes,
                created_at,
                record_date,
                1
            FROM feeding_records
        `);

        await queryRunner.query(`
            DROP TABLE feeding_records
        `);

        await queryRunner.query(`
            ALTER TABLE feeding_records_new
            RENAME TO feeding_records
        `);

        // Rebuild water_records with cat_id.
        await queryRunner.query(`
            CREATE TABLE water_records_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                offered_ml REAL NOT NULL
                    CHECK (offered_ml >= 0),
                consumed_ml REAL
                    CHECK (consumed_ml >= 0),
                measured INTEGER NOT NULL DEFAULT 0,
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                record_date TEXT,
                cat_id INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (cat_id)
                    REFERENCES cat_profile(id)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE
            )
        `);

        // Copy all existing water records.
        await queryRunner.query(`
            INSERT INTO water_records_new (
                id,
                offered_ml,
                consumed_ml,
                measured,
                notes,
                created_at,
                record_date,
                cat_id
            )
            SELECT
                id,
                offered_ml,
                consumed_ml,
                measured,
                notes,
                created_at,
                record_date,
                1
            FROM water_records
        `);

        await queryRunner.query(`
            DROP TABLE water_records
        `);

        await queryRunner.query(`
            ALTER TABLE water_records_new
            RENAME TO water_records
        `);

        // Restore existing date indexes.
        await queryRunner.query(`
            CREATE INDEX idx_feeding_record_date
            ON feeding_records(record_date)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_water_record_date
            ON water_records(record_date)
        `);

        // Add indexes for foreign-key lookups.
        await queryRunner.query(`
            CREATE INDEX idx_feeding_cat_id
            ON feeding_records(cat_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_water_cat_id
            ON water_records(cat_id)
        `);
    }


    public async down(queryRunner: QueryRunner): Promise<void> {

        // Remove cat_id from feeding_records.
        await queryRunner.query(`
            CREATE TABLE feeding_records_old (
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

        await queryRunner.query(`
            INSERT INTO feeding_records_old (
                id,
                food_name,
                quantity_grams,
                meal_time,
                notes,
                created_at,
                record_date
            )
            SELECT
                id,
                food_name,
                quantity_grams,
                meal_time,
                notes,
                created_at,
                record_date
            FROM feeding_records
        `);

        await queryRunner.query(`
            DROP TABLE feeding_records
        `);

        await queryRunner.query(`
            ALTER TABLE feeding_records_old
            RENAME TO feeding_records
        `);


        // Remove cat_id from water_records.
        await queryRunner.query(`
            CREATE TABLE water_records_old (
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

        await queryRunner.query(`
            INSERT INTO water_records_old (
                id,
                offered_ml,
                consumed_ml,
                measured,
                notes,
                created_at,
                record_date
            )
            SELECT
                id,
                offered_ml,
                consumed_ml,
                measured,
                notes,
                created_at,
                record_date
            FROM water_records
        `);

        await queryRunner.query(`
            DROP TABLE water_records
        `);

        await queryRunner.query(`
            ALTER TABLE water_records_old
            RENAME TO water_records
        `);

        // Restore date indexes.
        await queryRunner.query(`
            CREATE INDEX idx_feeding_record_date
            ON feeding_records(record_date)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_water_record_date
            ON water_records(record_date)
        `);
    }
}
