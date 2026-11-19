
import { z } from "zod";

// Reusable Cat Profile fields
const catProfileFields = {
    name: z.string()
        .trim()
        .min(1, "Cat name cannot be empty.")
        .max(100, "Cat name cannot exceed 100 characters."),

    age: z.number()
        .finite()
        .nonnegative("Age must be a non-negative number.")
        .max(30, "Age cannot exceed 30 years."),

    weightKg: z.number()
    .finite("Weight must be a valid number.")
    .positive("Weight must be greater than 0 kg.")
    .max(30, "Weight cannot exceed 30 kg."),

    favoriteFood: z.string()
        .trim()
        .min(1, "Favorite food cannot be empty.")
        .max(100, "Favorite food cannot exceed 100 characters."),

    activity: z.string()
        .trim()
        .min(1, "Activity cannot be empty.")
        .max(500, "Activity cannot exceed 500 characters.")
};

// PATCH schema: all fields optional
export const catProfileUpdateSchema = z
    .object(catProfileFields)
    .partial()
    .strict()
    .refine(
        data => Object.keys(data).length > 0,
        "At least one cat profile field must be provided."
    );
