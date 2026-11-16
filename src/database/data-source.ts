
import "reflect-metadata";
import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { DataSource } from "typeorm";

// Entities
import { FeedingRecord } from "../entities/FeedingRecord";
import { WaterRecord } from "../entities/WaterRecord";
import { CatProfileEntity } from "../entities/CatProfile";
import { WaterDailyTarget } from "../entities/WaterDailyTarget";

// Migrations
import { CreateInitialCatCareSchema1763170000000 } from "./migrations/CreateInitialCatCareSchema1763170000000";

import { AddCatIdToFeedingAndWaterRecords1763180000000 } from "./migrations/AddCatIdToFeedingAndWaterRecords1763180000000";

import { CreateWaterDailyTargets1763190000000 } from "./migrations/CreateWaterDailyTargets1763190000000";

// Database location
const databasePath =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "catcare.db");

// Automatically create the database directory if it doesn't exist.
if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(databasePath)), {
        recursive: true
    });
}

// TypeORM Data Source
export const AppDataSource = new DataSource({
    type: "better-sqlite3",

    database: databasePath,

    entities: [
        FeedingRecord,
        WaterRecord,
        CatProfileEntity,
        WaterDailyTarget
    ],

    migrations: [
        CreateInitialCatCareSchema1763170000000,
        AddCatIdToFeedingAndWaterRecords1763180000000,
        CreateWaterDailyTargets1763190000000
    ],

    synchronize: false,

    migrationsRun: false,

    logging: ["error"]
});
