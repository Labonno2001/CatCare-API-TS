
import { Request, Response, NextFunction } from "express";

// Centralized error-handling middleware
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {

    console.error("API Error:", err.message);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};
