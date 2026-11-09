
import express, { Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";

import db from "./database/database";

import catRoutes from "./routes/cat.routes";
import feedingRoutes from "./routes/feeding.routes";
import waterRoutes from "./routes/water.routes";
import wellnessRoutes from "./routes/wellness.routes";

import { errorHandler } from "./middleware/error.middleware";

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

// Serve frontend files from the public folder
const publicPath = path.join(process.cwd(), "public");

app.use(express.static(publicPath));

// Root route - serves index.html
app.get("/", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
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
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

// Centralized error handler - must be last
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
    console.log(`CatCare API running on port ${PORT}`);
});
