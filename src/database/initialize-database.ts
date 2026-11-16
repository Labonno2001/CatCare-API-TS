
import { AppDataSource } from "./data-source";

export const initializeDatabase = async (): Promise<void> => {
    try {
        // 1. Initialize the TypeORM connection.
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log("Database connection established.");

        // 2. Enable SQLite foreign key constraints.
        await AppDataSource.query("PRAGMA foreign_keys = ON");

        // 3. Run pending TypeORM migrations.
        const executedMigrations = await AppDataSource.runMigrations();

        if (executedMigrations.length > 0) {
            console.log("Successfully executed migrations:");

            executedMigrations.forEach((migration) => {
                console.log(`- ${migration.name}`);
            });
        } else {
            console.log("No pending migrations.");
        }

        // 4. Confirm database initialization.
        console.log("TypeORM database initialization completed.");

    } catch (error) {
        console.error("Database initialization failed:", error);

        throw error;
    }
};
