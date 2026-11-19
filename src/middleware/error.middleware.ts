
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// --------------------------------------------------
// Handle requests to routes that do not exist
// --------------------------------------------------

export const notFoundHandler = (
    _req: Request,
    res: Response
): void => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
};

// --------------------------------------------------
// Centralized error-handling middleware
// --------------------------------------------------

export const errorHandler = (
    err: Error & { type?: string },
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {

    // Log the complete error for server-side debugging.
    console.error("API Error:", err);

    // Handle malformed JSON requests.
    if (err.type === "entity.parse.failed") {
        res.status(400).json({
            success: false,
            message: "Invalid JSON request body."
        });
        return;
    }

    // Handle Zod validation errors.
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation failed.",
            errors: err.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
        return;
    }

    // Handle unexpected server errors.
    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};
