import "reflect-metadata";
import "dotenv/config";

import path from "node:path";
import { DataSource } from "typeorm";

import { FeedingRecord } from "../entities/FeedingRecord";
import { WaterRecord } from "../entities/WaterRecord";
import { CatProfileEntity } from "../entities/CatProfile";

const databasePath =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "catcare.db");

export const AppDataSource = new DataSource({
    type: "better-sqlite3",

    database: databasePath,

    entities: [
        FeedingRecord,
        WaterRecord,
        CatProfileEntity
    ],

    synchronize: false,
    migrationsRun: false,

    logging: ["error"],

    fileMustExist: true
});