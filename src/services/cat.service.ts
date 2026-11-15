
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


// Convert TypeORM entity into API response format.
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


// Get the cat profile.
export const getCatProfile = async (): Promise<CatProfile | null> => {

    const cat = await catRepository.findOneBy({ id: 1 });

    return cat ? formatCatProfile(cat) : null;
};


// Update selected cat profile fields using TypeORM update().
export const updateCatProfile = async (
    input: UpdateCatProfileInput
): Promise<CatProfile | null> => {

    const updateData: Partial<CatProfileEntity> = {};

    if (input.name !== undefined) {
        updateData.name = input.name.trim();
    }

    if (input.age !== undefined) {
        updateData.age = input.age;
    }

    if (input.weightKg !== undefined) {
        updateData.weightKg = input.weightKg;
    }

    if (input.favoriteFood !== undefined) {
        updateData.favoriteFood = input.favoriteFood.trim();
    }

    if (input.activity !== undefined) {
        updateData.activity = input.activity.trim();
    }

    const result = await catRepository.update(
        { id: 1 },
        updateData
    );

    if (!result.affected) {
        return null;
    }

    const updatedCat = await catRepository.findOneBy({ id: 1 });

    return updatedCat ? formatCatProfile(updatedCat) : null;
};
