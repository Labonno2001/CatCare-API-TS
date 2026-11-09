import db from "../database/database";
import { CatProfile } from "../types/cat.types";

export const getCatProfile = (): CatProfile | null => {
    const row = db
        .prepare("SELECT * FROM cat_profile WHERE id = ?")
        .get(1) as {
            id: number;
            name: string;
            age: number;
            weight_kg: number;
            favorite_food: string;
            activity: string;
        } | undefined;

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