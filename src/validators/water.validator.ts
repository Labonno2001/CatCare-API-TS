
import { z } from "zod";
import { isValidDate } from "../utils/validation";

// --------------------------------------------------
// Reusable water fields
// --------------------------------------------------

const waterFields = {
    measured: z.boolean(),

    consumedMl: z.union([
        z.number(),
        z.string().trim().min(1, "Consumed water is required.")
    ])
        .transform(Number)
        .pipe(
            z.number()
                .finite()
                .nonnegative("Consumed water cannot be negative.")
                .max(1000, "Consumed water cannot exceed 1000 ml.")
        )
        .nullable()
        .optional(),

    notes: z.string()
        .max(500, "Notes cannot exceed 500 characters.")
        .optional(),

    recordDate: z.string().refine(
        isValidDate,
        "Record date must be a valid YYYY-MM-DD date."
    )
};

// --------------------------------------------------
// POST and PUT validation
// --------------------------------------------------

export const waterCreateSchema = z.object(waterFields)
    .strict()
    .refine(
        (data) =>
            data.measured
                ? data.consumedMl !== undefined &&
                  data.consumedMl !== null
                : data.consumedMl === undefined ||
                  data.consumedMl === null,
        {
            message: "Consumed water is required when measured is true, and must be omitted or null when measured is false.",
            path: ["consumedMl"]
        }
    );

export const waterUpdateSchema = waterCreateSchema;

// --------------------------------------------------
// PATCH validation
// --------------------------------------------------

export const waterPatchSchema = z.object({
    measured: z.boolean().optional(),
    consumedMl: waterFields.consumedMl,
    notes: waterFields.notes,
    recordDate: waterFields.recordDate.optional()
})
    .strict()
    .refine(
        (data) =>
            Object.values(data).some(
                (value) => value !== undefined
            ),
        "At least one water field must be provided."
    )
    .refine(
        (data) =>
            !(
                data.measured === false &&
                data.consumedMl !== undefined &&
                data.consumedMl !== null
            ),
        {
            message: "Consumed water cannot be recorded when measurement is disabled.",
            path: ["consumedMl"]
        }
    );

// --------------------------------------------------
// Daily offered water target
// --------------------------------------------------

export const waterDailyTargetSchema = z.object({
    offeredMl: z.union([
        z.number(),
        z.string().trim().min(1, "Offered water is required.")
    ])
        .transform(Number)
        .pipe(
            z.number()
                .finite()
                .nonnegative("Offered water cannot be negative.")
                .max(1000, "Offered water cannot exceed 1000 ml.")
        ),

    recordDate: z.string().refine(
        isValidDate,
        "Record date must be a valid YYYY-MM-DD date."
    )
}).strict();
