
import { z } from "zod";
import { isValidDate } from "../utils/validation";

// Reusable date validation
const dateSchema = z.string().refine(
    isValidDate,
    "Date must be a valid YYYY-MM-DD date."
);

// Reusable positive integer query validation
const positiveIntegerSchema = z.string()
    .regex(/^[1-9]\d*$/, "Must be a positive integer.")
    .refine(
        value => Number.isSafeInteger(Number(value)),
        "Number is outside the supported integer range."
    );

// GET /api/feeding?date=
export const feedingDateQuerySchema = z.object({
    date: dateSchema.optional()
});

// GET /api/feeding/summary?date=
export const feedingSummaryQuerySchema = z.object({
    date: dateSchema.optional()
});

// GET /api/feeding/grouped?startDate=&endDate=
export const feedingGroupedQuerySchema = z.object({
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional()
}).refine(
    data =>
        !data.startDate ||
        !data.endDate ||
        data.startDate <= data.endDate,
    {
        message: "startDate cannot be later than endDate.",
        path: ["endDate"]
    }
);

// GET /api/feeding/advanced
export const feedingAdvancedQuerySchema = z.object({
    startDate: dateSchema.optional(),

    endDate: dateSchema.optional(),

    foodName: z.string()
        .trim()
        .min(1, "Food name cannot be empty.")
        .max(100, "Food name cannot exceed 100 characters.")
        .optional(),

    mealTime: z.string()
        .trim()
        .min(1, "Meal time cannot be empty.")
        .max(50, "Meal time cannot exceed 50 characters.")
        .optional(),

    sortBy: z.enum([
        "recordDate",
        "quantityGrams",
        "foodName"
    ]).optional(),

    order: z.enum([
        "ASC",
        "DESC"
    ]).optional(),

    page: positiveIntegerSchema.optional(),

    limit: positiveIntegerSchema
        .refine(
            value => Number(value) <= 100,
            "Limit cannot exceed 100."
        )
        .optional()
}).refine(
    data =>
        !data.startDate ||
        !data.endDate ||
        data.startDate <= data.endDate,
    {
        message: "startDate cannot be later than endDate.",
        path: ["endDate"]
    }
);
