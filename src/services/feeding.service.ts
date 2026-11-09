
import db from "../database/database";

import {
    FeedingRecord,
    FeedingDatabaseRow,
    CreateFeedingInput
} from "../types/feeding.types";

// Convert SQLite row into API response format
const formatFeeding = (
    row: FeedingDatabaseRow
): FeedingRecord => {
    return {
        id: row.id,
        foodName: row.food_name,
        quantityGrams: row.quantity_grams,
        mealTime: row.meal_time,
        notes: row.notes,
        createdAt: row.created_at
    };
};

// 1. Get all feeding records
export const getAllFeedingRecords = (): FeedingRecord[] => {
    const rows = db
        .prepare("SELECT * FROM feeding_records ORDER BY id ASC")
        .all() as FeedingDatabaseRow[];

    return rows.map(formatFeeding);
};

// 2. Create a feeding record
export const createFeedingRecord = (
    input: CreateFeedingInput
): FeedingRecord => {
    const result = db.prepare(`
        INSERT INTO feeding_records
            (food_name, quantity_grams, meal_time, notes, created_at)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        input.foodName.trim(),
        input.quantityGrams,
        input.mealTime,
        input.notes ?? "",
        new Date().toISOString()
    );

    const row = db.prepare(
        "SELECT * FROM feeding_records WHERE id = ?"
    ).get(result.lastInsertRowid) as FeedingDatabaseRow;

    return formatFeeding(row);
};

// 3. Get feeding summary
export const getFeedingSummary = (): {
    totalRecords: number;
    totalGrams: number;
} => {
    const summary = db.prepare(`
        SELECT
            COUNT(*) AS totalRecords,
            COALESCE(SUM(quantity_grams), 0) AS totalGrams
        FROM feeding_records
    `).get() as {
        totalRecords: number;
        totalGrams: number;
    };

    return summary;
};

// 4. Get one feeding record by ID
export const getFeedingRecordById = (
    id: number
): FeedingRecord | null => {
    const row = db
        .prepare("SELECT * FROM feeding_records WHERE id = ?")
        .get(id) as FeedingDatabaseRow | undefined;

    if (!row) return null;

    return formatFeeding(row);
};

// 5. Update a feeding record
export const updateFeedingRecord = (
    id: number,
    input: CreateFeedingInput
): FeedingRecord | null => {
    const result = db.prepare(`
        UPDATE feeding_records
        SET food_name = ?,
            quantity_grams = ?,
            meal_time = ?,
            notes = ?
        WHERE id = ?
    `).run(
        input.foodName.trim(),
        input.quantityGrams,
        input.mealTime,
        input.notes ?? "",
        id
    );

    if (result.changes === 0) return null;

    const row = db.prepare(
        "SELECT * FROM feeding_records WHERE id = ?"
    ).get(id) as FeedingDatabaseRow;

    return formatFeeding(row);
};

// 6. Delete a feeding record
export const deleteFeedingRecord = (
    id: number
): boolean => {
    const result = db.prepare(
        "DELETE FROM feeding_records WHERE id = ?"
    ).run(id);

    return result.changes > 0;
};
