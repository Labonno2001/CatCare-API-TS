
import db from "../database/database";

import {
    WaterRecord,
    WaterDatabaseRow,
    CreateWaterInput,
    PatchWaterInput
} from "../types/water.types";


// Convert a database row into the API response format
const formatWater = (
    row: WaterDatabaseRow
): WaterRecord => {
    return {
        id: row.id,
        offeredMl: row.offered_ml,
        consumedMl: row.consumed_ml,
        measured: Boolean(row.measured),
        notes: row.notes,
        recordDate: row.record_date ?? row.created_at.slice(0, 10),
        createdAt: row.created_at
    };
};


// Get all water records, or filter by date
export const getAllWaterRecords = (
    date?: string
): WaterRecord[] => {

    const rows = date
        ? db.prepare(`
            SELECT * FROM water_records
            WHERE record_date = ?
            ORDER BY id ASC
        `).all(date) as WaterDatabaseRow[]

        : db.prepare(`
            SELECT * FROM water_records
            ORDER BY record_date DESC, id ASC
        `).all() as WaterDatabaseRow[];

    return rows.map(formatWater);
};


// Create a water record
export const createWaterRecord = (
    input: CreateWaterInput
): WaterRecord => {

    const result = db.prepare(`
        INSERT INTO water_records (
            offered_ml,
            consumed_ml,
            measured,
            notes,
            created_at,
            record_date
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        input.offeredMl,
        input.measured ? input.consumedMl ?? null : null,
        input.measured ? 1 : 0,
        input.notes ?? "",
        new Date().toISOString(),
        input.recordDate
    );

    const row = db.prepare(
        "SELECT * FROM water_records WHERE id = ?"
    ).get(result.lastInsertRowid) as WaterDatabaseRow;

    return formatWater(row);
};


// Get water summary, optionally for one date
export const getWaterSummary = (
    date?: string
): {
    totalRecords: number;
    totalOfferedMl: number;
    measuredConsumptionRecords: number;
    totalMeasuredConsumedMl: number;
} => {

    const summary = date
        ? db.prepare(`
            SELECT
                COUNT(*) AS totalRecords,
                COALESCE(SUM(offered_ml), 0) AS totalOfferedMl,
                COALESCE(
                    SUM(CASE WHEN measured = 1 THEN 1 ELSE 0 END),
                    0
                ) AS measuredConsumptionRecords,
                COALESCE(
                    SUM(
                        CASE
                            WHEN measured = 1 THEN consumed_ml
                            ELSE 0
                        END
                    ),
                    0
                ) AS totalMeasuredConsumedMl
            FROM water_records
            WHERE record_date = ?
        `).get(date)

        : db.prepare(`
            SELECT
                COUNT(*) AS totalRecords,
                COALESCE(SUM(offered_ml), 0) AS totalOfferedMl,
                COALESCE(
                    SUM(CASE WHEN measured = 1 THEN 1 ELSE 0 END),
                    0
                ) AS measuredConsumptionRecords,
                COALESCE(
                    SUM(
                        CASE
                            WHEN measured = 1 THEN consumed_ml
                            ELSE 0
                        END
                    ),
                    0
                ) AS totalMeasuredConsumedMl
            FROM water_records
        `).get();

    return summary as {
        totalRecords: number;
        totalOfferedMl: number;
        measuredConsumptionRecords: number;
        totalMeasuredConsumedMl: number;
    };
};


// Get one water record by ID
export const getWaterRecordById = (
    id: number
): WaterRecord | null => {

    const row = db.prepare(
        "SELECT * FROM water_records WHERE id = ?"
    ).get(id) as WaterDatabaseRow | undefined;

    if (!row) {
        return null;
    }

    return formatWater(row);
};


// Full update: Replace all editable water fields
export const updateWaterRecord = (
    id: number,
    input: CreateWaterInput
): WaterRecord | null => {

    const result = db.prepare(`
        UPDATE water_records
        SET offered_ml = ?,
            consumed_ml = ?,
            measured = ?,
            notes = ?,
            record_date = ?
        WHERE id = ?
    `).run(
        input.offeredMl,
        input.measured ? input.consumedMl ?? null : null,
        input.measured ? 1 : 0,
        input.notes ?? "",
        input.recordDate,
        id
    );

    if (result.changes === 0) {
        return null;
    }

    const row = db.prepare(
        "SELECT * FROM water_records WHERE id = ?"
    ).get(id) as WaterDatabaseRow;

    return formatWater(row);
};


// Delete a water record
export const deleteWaterRecord = (
    id: number
): boolean => {

    const result = db.prepare(
        "DELETE FROM water_records WHERE id = ?"
    ).run(id);

    return result.changes > 0;
};


// Partial update: Update only the fields provided
export const patchWaterRecord = (
    id: number,
    input: PatchWaterInput
): WaterRecord | null => {

    const fields: string[] = [];
    const values: (string | number | null)[] = [];


    // Update offered water if provided
    if (input.offeredMl !== undefined) {
        fields.push("offered_ml = ?");
        values.push(input.offeredMl);
    }


    // Update consumed water if provided
    if (input.consumedMl !== undefined) {
        fields.push("consumed_ml = ?");
        values.push(input.consumedMl);
    }


    // Update whether consumption is measured
    if (input.measured !== undefined) {
        fields.push("measured = ?");
        values.push(input.measured ? 1 : 0);

        // If measurement is disabled, consumed amount becomes NULL
        if (input.measured === false) {
            fields.push("consumed_ml = ?");
            values.push(null);
        }
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
        UPDATE water_records
        SET ${fields.join(", ")}
        WHERE id = ?
    `).run(...values);


    // Check whether a record was updated
    if (result.changes === 0) {
        return null;
    }


    // Retrieve the updated water record
    const row = db.prepare(
        "SELECT * FROM water_records WHERE id = ?"
    ).get(id) as WaterDatabaseRow;


    // Return the updated record
    return formatWater(row);
};
