
import "reflect-metadata";
import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { DataSource } from "typeorm";

import { FeedingRecord } from "../entities/FeedingRecord";
import { WaterRecord } from "../entities/WaterRecord";
import { CatProfileEntity } from "../entities/CatProfile";

import {
    CreateInitialCatCareSchema1763170000000
} from "./migrations/CreateInitialCatCareSchema1763170000000";

import {
    AddCatIdToFeedingAndWaterRecords1763180000000
} from "./migrations/AddCatIdToFeedingAndWaterRecords1763180000000";

const databasePath =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "catcare.db");

// Create the database directory if it does not exist.
if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(databasePath)), {
        recursive: true
    });
}

export const AppDataSource = new DataSource({

    type: "better-sqlite3",

    database: databasePath,

    entities: [
        FeedingRecord,
        WaterRecord,
        CatProfileEntity
    ],

    migrations: [
        CreateInitialCatCareSchema1763170000000,
        AddCatIdToFeedingAndWaterRecords1763180000000
    ],

    synchronize: false,
    migrationsRun: false,

    logging: ["error"]
});
