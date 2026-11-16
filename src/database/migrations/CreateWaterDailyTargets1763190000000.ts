
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWaterDailyTargets1763190000000
    implements MigrationInterface {

    name = "CreateWaterDailyTargets1763190000000";

    public async up(queryRunner: QueryRunner): Promise<void> {

        // 1. Create the daily water target table.
        await queryRunner.query(`
            CREATE TABLE "water_daily_targets" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT,
                "cat_id" INTEGER NOT NULL,
                "offered_ml" REAL NOT NULL CHECK ("offered_ml" >= 0),
                "record_date" TEXT NOT NULL,
                "created_at" TEXT NOT NULL,
                "updated_at" TEXT NOT NULL,
                CONSTRAINT "FK_water_daily_targets_cat"
                    FOREIGN KEY ("cat_id")
                    REFERENCES "cat_profile" ("id")
                    ON DELETE CASCADE
            )
        `);

        // 2. Ensure only one target exists per cat per date.
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_water_daily_target_cat_date"
            ON "water_daily_targets" ("cat_id", "record_date")
        `);

        // 3. Copy historical daily offered amounts.
        // If multiple records exist for one date, use the latest record ID.
        await queryRunner.query(`
            INSERT INTO "water_daily_targets" (
                "cat_id",
                "offered_ml",
                "record_date",
                "created_at",
                "updated_at"
            )
            SELECT
                w."cat_id",
                w."offered_ml",
                w."record_date",
                datetime('now'),
                datetime('now')
            FROM "water_records" w
            WHERE w."id" = (
                SELECT MAX(w2."id")
                FROM "water_records" w2
                WHERE
                    w2."cat_id" = w."cat_id"
                    AND w2."record_date" = w."record_date"
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // Remove the daily targets table during rollback.
        await queryRunner.query(`
            DROP TABLE IF EXISTS "water_daily_targets"
        `);
    }
}
