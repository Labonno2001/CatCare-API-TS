
import { z } from "zod";
import { isValidDate } from "../utils/validation";

// --------------------------------------------------
// Reusable decimal number validation
// --------------------------------------------------

const decimalNumberSchema = (
    fieldName: string,
    requiredMessage: string,
    maxValue: number
) =>
    z.union([
        z.number(),
        z.string()
            .trim()
            .min(1, requiredMessage)
            .regex(
                /^\d+(\.\d+)?$/,
                `${fieldName} must be a valid decimal number.`
            )
    ])
        .transform(Number)
        .pipe(
            z.number()
                .finite(`${fieldName} must be a finite number.`)
                .nonnegative(`${fieldName} cannot be negative.`)
                .max(
                    maxValue,
                    `${fieldName} cannot exceed ${maxValue} ml.`
                )
        );

// --------------------------------------------------
// Reusable water fields
// --------------------------------------------------

const waterFields = {
    measured: z.boolean(),

    consumedMl: decimalNumberSchema(
        "Consumed water",
        "Consumed water is required.",
        1000
    )
        .nullable()
        .optional(),

    notes: z.string()
        .trim()
        .max(500, "Notes cannot exceed 500 characters.")
        .optional(),

    recordDate: z.string().refine(
        isValidDate,
        "Record date must be a valid YYYY-MM-DD date."
    )
};

// --------------------------------------------------
// POST: Create a complete water record
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
            message:
                "Consumed water is required when measured is true, and must be omitted or null when measured is false.",
            path: ["consumedMl"]
        }
    );

// --------------------------------------------------
// PUT: Replace a complete water record
// --------------------------------------------------

export const waterUpdateSchema = waterCreateSchema;

// --------------------------------------------------
// PATCH: Update selected water fields
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
            message:
                "Consumed water cannot be recorded when measurement is disabled.",
            path: ["consumedMl"]
        }
    );

// --------------------------------------------------
// Daily offered water target
// --------------------------------------------------

export const waterDailyTargetSchema = z.object({
    offeredMl: decimalNumberSchema(
        "Offered water",
        "Offered water is required.",
        1000
    ),

    recordDate: z.string().refine(
        isValidDate,
        "Record date must be a valid YYYY-MM-DD date."
    )
}).strict();
