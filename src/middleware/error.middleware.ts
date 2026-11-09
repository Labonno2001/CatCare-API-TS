
import { Request, Response, NextFunction } from "express";

// Handle requests to routes that do not exist
export const notFoundHandler = (
    _req: Request,
    res: Response
): void => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
};

// Centralized error-handling middleware
export const errorHandler = (
    err: Error & { type?: string },
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error("API Error:", err.message);

    // Handle malformed JSON requests
    if (err.type === "entity.parse.failed") {
        res.status(400).json({
            success: false,
            message: "Invalid JSON request body."
        });
        return;
    }

    // Handle unexpected server errors
    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};
