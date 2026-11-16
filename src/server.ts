
import express, { Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";

import { AppDataSource } from "./database/data-source";

import catRoutes from "./routes/cat.routes";
import feedingRoutes from "./routes/feeding.routes";
import waterRoutes from "./routes/water.routes";
import wellnessRoutes from "./routes/wellness.routes";

import { errorHandler } from "./middleware/error.middleware";

// Load environment variables.
dotenv.config();

// Create Express application.
const app = express();

// Middleware.
app.use(cors());
app.use(express.json());

// API routes.
app.use("/api/cat", catRoutes);
app.use("/api/feeding", feedingRoutes);
app.use("/api/water", waterRoutes);
app.use("/api/wellness", wellnessRoutes);

// Serve frontend files.
const publicPath = path.join(process.cwd(), "public");

app.use(express.static(publicPath));

app.get("/", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

// Health check.
app.get("/api/health", (_req, res: Response) => {
    res.status(200).json({
        success: true,
        message: "CatCare API is running",
        database: AppDataSource.isInitialized,
        timestamp: new Date()
    });
});

// Handle unknown routes.
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

// Global error handler.
app.use(errorHandler);

// Server configuration.
const PORT = process.env.PORT || 3000;

// Start server.
const startServer = async (): Promise<void> => {
    try {
        // 1. Initialize TypeORM connection.
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log("TypeORM connected successfully!");

        // 2. Enable SQLite foreign key constraints.
        await AppDataSource.query("PRAGMA foreign_keys = ON");

        console.log("SQLite foreign key constraints enabled.");

        // 3. Execute pending database migrations.
        const executedMigrations = await AppDataSource.runMigrations();

        if (executedMigrations.length > 0) {
            console.log("Successfully executed migrations:");

            executedMigrations.forEach((migration) => {
                console.log(`- ${migration.name}`);
            });
        } else {
            console.log("No pending migrations.");
        }

        console.log("Database migrations completed successfully!");

        // 4. Display registered entities.
        console.log(
            "Registered entities:",
            AppDataSource.entityMetadatas
                .map((entity) => entity.name)
                .join(", ")
        );

        // 5. Start Express server.
        app.listen(PORT, () => {
            console.log(`CatCare API running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start CatCare API:", error);

        // Close database connection if initialization succeeded.
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }

        process.exit(1);
    }
};

// Start application.
void startServer();
