import db from "../database/database";

import {
    FeedingRecord,
    FeedingDatabaseRow,
    CreateFeedingInput
} from "../types/feeding.types";

// Convert a database row into the API response format
const formatFeeding = (
    row: FeedingDatabaseRow
): FeedingRecord => {
    return {
        id: row.id,
        foodName: row.food_name,
        quantityGrams: row.quantity_grams,
        mealTime: row.meal_time,
        notes: row.notes,
        recordDate: row.record_date ?? row.created_at.slice(0, 10),
        createdAt: row.created_at
    };
};

// Get all feeding records, or filter by date
export const getAllFeedingRecords = (
    date?: string
): FeedingRecord[] => {
    const rows = date
        ? db.prepare(`
            SELECT * FROM feeding_records
            WHERE record_date = ?
            ORDER BY id ASC
        `).all(date) as FeedingDatabaseRow[]
        : db.prepare(`
            SELECT * FROM feeding_records
            ORDER BY record_date DESC, id ASC
        `).all() as FeedingDatabaseRow[];

    return rows.map(formatFeeding);
};

// Create a feeding record
export const createFeedingRecord = (
    input: CreateFeedingInput
): FeedingRecord => {
    const result = db.prepare(`
        INSERT INTO feeding_records (
            food_name,
            quantity_grams,
            meal_time,
            notes,
            created_at,
            record_date
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        input.foodName.trim(),
        input.quantityGrams,
        input.mealTime,
        input.notes ?? "",
        new Date().toISOString(),
        input.recordDate
    );

    const row = db.prepare(
        "SELECT * FROM feeding_records WHERE id = ?"
    ).get(result.lastInsertRowid) as FeedingDatabaseRow;

    return formatFeeding(row);
};

// Get feeding summary, optionally for one date
export const getFeedingSummary = (
    date?: string
): {
    totalRecords: number;
    totalGrams: number;
} => {
    const summary = date
        ? db.prepare(`
            SELECT
                COUNT(*) AS totalRecords,
                COALESCE(SUM(quantity_grams), 0) AS totalGrams
            FROM feeding_records
            WHERE record_date = ?
        `).get(date)
        : db.prepare(`
            SELECT
                COUNT(*) AS totalRecords,
                COALESCE(SUM(quantity_grams), 0) AS totalGrams
            FROM feeding_records
        `).get();

    return summary as {
        totalRecords: number;
        totalGrams: number;
    };
};

// Get one feeding record by ID
export const getFeedingRecordById = (
    id: number
): FeedingRecord | null => {
    const row = db.prepare(
        "SELECT * FROM feeding_records WHERE id = ?"
    ).get(id) as FeedingDatabaseRow | undefined;

    if (!row) return null;

    return formatFeeding(row);
};

// Update a feeding record, including its date
export const updateFeedingRecord = (
    id: number,
    input: CreateFeedingInput
): FeedingRecord | null => {
    const result = db.prepare(`
        UPDATE feeding_records
        SET food_name = ?,
            quantity_grams = ?,
            meal_time = ?,
            notes = ?,
            record_date = ?
        WHERE id = ?
    `).run(
        input.foodName.trim(),
        input.quantityGrams,
        input.mealTime,
        input.notes ?? "",
        input.recordDate,
        id
    );

    if (result.changes === 0) return null;

    const row = db.prepare(
        "SELECT * FROM feeding_records WHERE id = ?"
    ).get(id) as FeedingDatabaseRow;

    return formatFeeding(row);
};

// Delete a feeding record
export const deleteFeedingRecord = (
    id: number
): boolean => {
    const result = db.prepare(
        "DELETE FROM feeding_records WHERE id = ?"
    ).run(id);

    return result.changes > 0;
};