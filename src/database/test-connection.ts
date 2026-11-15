
import { AppDataSource } from "./data-source";
import { FeedingRecord } from "../entities/FeedingRecord";

async function testConnection(): Promise<void> {
    try {
        await AppDataSource.initialize();

        console.log("TypeORM connected successfully!");

        const feedingRepository =
            AppDataSource.getRepository(FeedingRecord);

        const records = await feedingRepository.find();

        console.log("Feeding records:", records);

    } catch (error) {
        console.error("TypeORM connection failed:", error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

void testConnection();
