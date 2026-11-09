
import db from "../database/database";

import {
    WaterRecord,
    WaterDatabaseRow,
    CreateWaterInput
} from "../types/water.types";

// Convert SQLite row into API response format
const formatWater = (
    row: WaterDatabaseRow
): WaterRecord => {
    return {
        id: row.id,
        offeredMl: row.offered_ml,
        consumedMl: row.consumed_ml,
        measured: Boolean(row.measured),
        notes: row.notes,
        createdAt: row.created_at
    };
};

// 1. Get all water records
export const getAllWaterRecords = (): WaterRecord[] => {
    const rows = db
        .prepare("SELECT * FROM water_records ORDER BY id ASC")
        .all() as WaterDatabaseRow[];

    return rows.map(formatWater);
};

// 2. Create a water record
export const createWaterRecord = (
    input: CreateWaterInput
): WaterRecord => {

    const result = db.prepare(`
        INSERT INTO water_records
            (offered_ml, consumed_ml, measured, notes, created_at)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        input.offeredMl,
        input.measured ? input.consumedMl : null,
        input.measured ? 1 : 0,
        input.notes ?? "",
        new Date().toISOString()
    );

    const row = db.prepare(
        "SELECT * FROM water_records WHERE id = ?"
    ).get(result.lastInsertRowid) as WaterDatabaseRow;

    return formatWater(row);
};

// 3. Get water records summary
export const getWaterSummary = (): {
    totalRecords: number;
    totalOfferedMl: number;
    measuredConsumptionRecords: number;
    totalMeasuredConsumedMl: number;
} => {
    const summary = db.prepare(`
        SELECT
            COUNT(*) AS totalRecords,
            COALESCE(SUM(offered_ml), 0) AS totalOfferedMl,
            COALESCE(SUM(CASE WHEN measured = 1 THEN 1 ELSE 0 END), 0)
                AS measuredConsumptionRecords,
            COALESCE(SUM(
                CASE WHEN measured = 1 THEN consumed_ml ELSE 0 END
            ), 0) AS totalMeasuredConsumedMl
        FROM water_records
    `).get() as {
        totalRecords: number;
        totalOfferedMl: number;
        measuredConsumptionRecords: number;
        totalMeasuredConsumedMl: number;
    };

    return summary;
};

 // 4. Get a water record by ID
export const getWaterRecordById = (
    id: number
): WaterRecord | null => {
    const row = db
        .prepare("SELECT * FROM water_records WHERE id = ?")
        .get(id) as WaterDatabaseRow | undefined;

    if (!row) {
        return null;
    }

    return formatWater(row);
};

 // 5. Update a water record
export const updateWaterRecord = (
    id: number,
    input: CreateWaterInput
): WaterRecord | null => {

    const result = db.prepare(`
        UPDATE water_records
        SET offered_ml = ?,
            consumed_ml = ?,
            measured = ?,
            notes = ?
        WHERE id = ?
    `).run(
        input.offeredMl,
        input.measured ? input.consumedMl : null,
        input.measured ? 1 : 0,
        input.notes ?? "",
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

 // 6. Delete a water record
export const deleteWaterRecord = (id: number): boolean => {
    const result = db.prepare(
        "DELETE FROM water_records WHERE id = ?"
    ).run(id);

    return result.changes > 0;
};
