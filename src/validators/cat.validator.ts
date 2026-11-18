
import { z } from "zod";

// Reusable Cat Profile fields
const catProfileFields = {
    name: z.string().refine(
        value => value.trim().length > 0,
        "Cat name cannot be empty."
    ),

    age: z.number().finite().nonnegative(
        "Age must be a non-negative number."
    ),

    weightKg: z.number().finite().positive(
        "Weight must be greater than zero."
    ),

    favoriteFood: z.string().refine(
        value => value.trim().length > 0,
        "Favorite food cannot be empty."
    ),

    activity: z.string().refine(
        value => value.trim().length > 0,
        "Activity cannot be empty."
    )
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
