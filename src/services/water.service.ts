import db from "../database/database";

import {
    WaterRecord,
    WaterDatabaseRow,
    CreateWaterInput
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
        input.measured ? input.consumedMl : null,
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

    if (!row) return null;

    return formatWater(row);
};

// Update a water record, including its date
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
        input.measured ? input.consumedMl : null,
        input.measured ? 1 : 0,
        input.notes ?? "",
        input.recordDate,
        id
    );

    if (result.changes === 0) return null;

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