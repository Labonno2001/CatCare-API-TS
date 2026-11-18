
import { z } from "zod";
import { isValidDate } from "../utils/validation";

// Reusable date validation
const dateSchema = z.string().refine(
    isValidDate,
    "Date must be a valid YYYY-MM-DD date."
);

// Reusable non-negative number validation
const nonNegativeNumberSchema = z.string()
    .trim()
    .min(1, "A number is required.")
    .refine(
        value => Number.isFinite(Number(value)) && Number(value) >= 0,
        "Must be a finite non-negative number."
    );

// Reusable positive integer validation
const positiveIntegerSchema = z.string()
    .regex(/^[1-9]\d*$/, "Must be a positive integer.")
    .refine(
        value => Number.isSafeInteger(Number(value)),
        "Number is outside the supported integer range."
    );

// GET /api/water?date=
export const waterDateQuerySchema = z.object({
    date: dateSchema.optional()
});

// GET /api/water/daily-target?date=
export const waterDailyTargetQuerySchema = z.object({
    date: dateSchema
});

// GET /api/water/summary?date=
export const waterSummaryQuerySchema = z.object({
    date: dateSchema
});

// GET /api/water/advanced
export const waterAdvancedQuerySchema = z.object({
    startDate: dateSchema.optional(),

    endDate: dateSchema.optional(),

    measured: z.enum(["true", "false"]).optional(),

    minConsumedMl: nonNegativeNumberSchema.optional(),

    maxConsumedMl: nonNegativeNumberSchema.optional(),

    sortBy: z.enum([
        "recordDate",
        "consumedMl",
        "createdAt"
    ]).optional(),

    order: z.enum([
        "ASC",
        "DESC"
    ]).optional(),

    page: positiveIntegerSchema.optional(),

    limit: positiveIntegerSchema
        .refine(
            value => Number(value) <= 100,
            "limit must be between 1 and 100."
        )
        .optional()
})
.refine(
    data =>
        !data.startDate ||
        !data.endDate ||
        data.startDate <= data.endDate,
    {
        message: "startDate cannot be later than endDate.",
        path: ["endDate"]
    }
)
.refine(
    data =>
        data.minConsumedMl === undefined ||
        data.maxConsumedMl === undefined ||
        Number(data.minConsumedMl) <= Number(data.maxConsumedMl),
    {
        message: "minConsumedMl cannot be greater than maxConsumedMl.",
        path: ["maxConsumedMl"]
    }
);

// GET /api/water/grouped?startDate=&endDate=
export const waterGroupedQuerySchema = z.object({
    startDate: dateSchema.optional(),

    endDate: dateSchema.optional()
})
.refine(
    data =>
        !data.startDate ||
        !data.endDate ||
        data.startDate <= data.endDate,
    {
        message: "startDate cannot be later than endDate.",
        path: ["endDate"]
    }
);
