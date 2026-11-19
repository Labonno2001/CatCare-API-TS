
import { RequestHandler } from "express";
import { ZodType } from "zod";

// Reusable middleware for validating request bodies
export const validateBody = (
    schema: ZodType
): RequestHandler => {

    return (req, res, next) => {

        const result = schema.safeParse(req.body);

        if (!result.success) {

            res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });

            return;
        }

        req.body = result.data;

        next();
    };
};


// Reusable middleware for validating URL parameters
export const validateParams = (
    schema: ZodType
): RequestHandler => {

    return (req, res, next) => {

        const result = schema.safeParse(req.params);

        if (!result.success) {

            res.status(400).json({
                success: false,
                message: "Invalid URL parameters.",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });

            return;
        }

        next();
    };
};

// Reusable middleware for validating query parameters
export const validateQuery = (
    schema: ZodType
): RequestHandler => {

    return (req, res, next) => {

        const result = schema.safeParse(req.query);

        if (!result.success) {
            res.status(400).json({
                success: false,
                message: "Invalid query parameters.",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });

            return;
        }

        res.locals.validatedQuery = result.data;

        next();
    };
};