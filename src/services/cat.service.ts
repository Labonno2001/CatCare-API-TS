
import { AppDataSource } from "../database/data-source";
import { CatProfileEntity } from "../entities/CatProfile";
import { CatProfile } from "../types/cat.types";

export interface UpdateCatProfileInput {
    name?: string;
    age?: number;
    weightKg?: number;
    favoriteFood?: string;
    activity?: string;
}

const catRepository =
    AppDataSource.getRepository(CatProfileEntity);


// Convert TypeORM entity into API response format
const formatCatProfile = (
    cat: CatProfileEntity
): CatProfile => {
    return {
        id: cat.id,
        name: cat.name,
        age: cat.age,
        weightKg: cat.weightKg,
        favoriteFood: cat.favoriteFood,
        activity: cat.activity
    };
};


// Get the cat profile
export const getCatProfile = async (): Promise<CatProfile | null> => {

    const cat = await catRepository.findOneBy({
        id: 1
    });

    if (!cat) {
        return null;
    }

    return formatCatProfile(cat);
};


// Update selected cat profile fields
export const updateCatProfile = async (
    input: UpdateCatProfileInput
): Promise<CatProfile | null> => {

    const cat = await catRepository.findOneBy({
        id: 1
    });

    if (!cat) {
        return null;
    }

    if (input.name !== undefined) {
        cat.name = input.name.trim();
    }

    if (input.age !== undefined) {
        cat.age = input.age;
    }

    if (input.weightKg !== undefined) {
        cat.weightKg = input.weightKg;
    }

    if (input.favoriteFood !== undefined) {
        cat.favoriteFood = input.favoriteFood.trim();
    }

    if (input.activity !== undefined) {
        cat.activity = input.activity.trim();
    }

    const updatedCat = await catRepository.save(cat);

    return formatCatProfile(updatedCat);
};
