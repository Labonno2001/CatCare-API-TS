export interface FeedingRecord {
    id: number;
    foodName: string;
    quantityGrams: number;
    mealTime: string;
    notes: string;
    createdAt: string;
}

export interface FeedingDatabaseRow {
    id: number;
    food_name: string;
    quantity_grams: number;
    meal_time: string;
    notes: string;
    created_at: string;
}

export interface CreateFeedingInput {
    foodName: string;
    quantityGrams: number;
    mealTime: string;
    notes?: string;
}