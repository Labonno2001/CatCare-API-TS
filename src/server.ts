
import express, { Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import db from "./database/database";

import catRoutes from "./routes/cat.routes";
import feedingRoutes from "./routes/feeding.routes";
import waterRoutes from "./routes/water.routes";
import wellnessRoutes from "./routes/wellness.routes";

import {
    notFoundHandler,
    errorHandler
} from "./middleware/error.middleware";

dotenv.config();

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/cat", catRoutes);
app.use("/api/feeding", feedingRoutes);
app.use("/api/water", waterRoutes);
app.use("/api/wellness", wellnessRoutes);

// Root route
app.get("/", (_req, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Welcome to CatCare API - TypeScript Version"
    });
});

// Health check
app.get("/api/health", (_req, res: Response) => {
    res.status(200).json({
        success: true,
        message: "CatCare API is running",
        database: db.open,
        timestamp: new Date()
    });
});

// Handle unknown routes
app.use(notFoundHandler);

// Centralized error handler — must be last
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
    console.log(`CatCare API running on port ${PORT}`);
});
