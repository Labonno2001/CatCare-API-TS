
import { z } from "zod";

import { isValidDate } from "../utils/validation";

// Common validation rules for feeding fields
const feedingFields = {

    foodName: z.string()
        .trim()
        .min(1, "Food name is required."),

    quantityGrams: z.union([
        z.number(),
        z.string().trim().min(1, "Quantity is required.")
    ])
        .transform(Number)
        .pipe(
            z.number().positive(
                "Quantity must be greater than zero."
            )
        ),

    mealTime: z.string()
        .trim()
        .min(1, "Meal time is required."),

    notes: z.string().optional(),

    recordDate: z.string()
        .refine(
            isValidDate,
            "Record date must be a valid YYYY-MM-DD date."
        )
};

// POST: Create a complete feeding record
export const feedingCreateSchema = z
    .object(feedingFields)
    .strict();

// PUT: Replace a complete feeding record
export const feedingUpdateSchema = z
    .object(feedingFields)
    .strict();

// PATCH: Update selected feeding fields
export const feedingPatchSchema = z
    .object(feedingFields)
    .partial()
    .strict()
    .refine(
        (data) =>
            Object.values(data).some(
                (value) => value !== undefined
            ),
        "At least one feeding field must be provided."
    );
