
import db from "../database/database";
import { CatProfile } from "../types/cat.types";

export interface UpdateCatProfileInput {
    name?: string;
    age?: number;
    weightKg?: number;
    favoriteFood?: string;
    activity?: string;
}

interface CatDatabaseRow {
    id: number;
    name: string;
    age: number;
    weight_kg: number;
    favorite_food: string;
    activity: string;
}

// Get the cat profile
export const getCatProfile = (): CatProfile | null => {
    const row = db
        .prepare("SELECT * FROM cat_profile WHERE id = ?")
        .get(1) as CatDatabaseRow | undefined;

    if (!row) return null;

    return {
        id: row.id,
        name: row.name,
        age: row.age,
        weightKg: row.weight_kg,
        favoriteFood: row.favorite_food,
        activity: row.activity
    };
};

// Update selected cat profile fields
export const updateCatProfile = (
    input: UpdateCatProfileInput
): CatProfile | null => {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (input.name !== undefined) {
        updates.push("name = ?");
        values.push(input.name);
    }

    if (input.age !== undefined) {
        updates.push("age = ?");
        values.push(input.age);
    }

    if (input.weightKg !== undefined) {
        updates.push("weight_kg = ?");
        values.push(input.weightKg);
    }

    if (input.favoriteFood !== undefined) {
        updates.push("favorite_food = ?");
        values.push(input.favoriteFood);
    }

    if (input.activity !== undefined) {
        updates.push("activity = ?");
        values.push(input.activity);
    }

    if (updates.length === 0) {
        return getCatProfile();
    }

    values.push(1);

    db.prepare(`
        UPDATE cat_profile
        SET ${updates.join(", ")}
        WHERE id = ?
    `).run(...values);

    return getCatProfile();
};
