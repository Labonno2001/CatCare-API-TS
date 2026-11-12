
import db from "../database/database";

import {
    FeedingRecord,
    FeedingDatabaseRow,
    CreateFeedingInput,
    PatchFeedingInput
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

    if (!row) {
        return null;
    }

    return formatFeeding(row);
};


// Full update: Replace all editable feeding fields
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

    if (result.changes === 0) {
        return null;
    }

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


// Partial update: Update only the fields provided
export const patchFeedingRecord = (
    id: number,
    input: PatchFeedingInput
): FeedingRecord | null => {

    const fields: string[] = [];
    const values: (string | number)[] = [];


    // Update food name if provided
    if (input.foodName !== undefined) {
        fields.push("food_name = ?");
        values.push(input.foodName.trim());
    }


    // Update quantity if provided
    if (input.quantityGrams !== undefined) {
        fields.push("quantity_grams = ?");
        values.push(input.quantityGrams);
    }


    // Update meal time if provided
    if (input.mealTime !== undefined) {
        fields.push("meal_time = ?");
        values.push(input.mealTime);
    }


    // Update notes if provided
    if (input.notes !== undefined) {
        fields.push("notes = ?");
        values.push(input.notes);
    }


    // Update record date if provided
    if (input.recordDate !== undefined) {
        fields.push("record_date = ?");
        values.push(input.recordDate);
    }


    // Prevent an empty database update
    if (fields.length === 0) {
        return null;
    }


    // Add the record ID for the WHERE condition
    values.push(id);


    // Execute the dynamic SQL update
    const result = db.prepare(`
        UPDATE feeding_records
        SET ${fields.join(", ")}
        WHERE id = ?
    `).run(...values);


    // Check whether a record was updated
    if (result.changes === 0) {
        return null;
    }


    // Retrieve the updated feeding record
    const row = db.prepare(
        "SELECT * FROM feeding_records WHERE id = ?"
    ).get(id) as FeedingDatabaseRow;


    // Return the updated record
    return formatFeeding(row);
};
