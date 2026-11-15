
import { AppDataSource } from "../database/data-source";
import { WaterRecord as WaterRecordEntity } from "../entities/WaterRecord";

import {
    WaterRecord,
    CreateWaterInput,
    PatchWaterInput
} from "../types/water.types";

const waterRepository =
    AppDataSource.getRepository(WaterRecordEntity);


// Convert a TypeORM entity into the API response format.
const formatWater = (
    row: WaterRecordEntity
): WaterRecord => {
    return {
        id: row.id,
        offeredMl: row.offeredMl,
        consumedMl: row.consumedMl,
        measured: Boolean(row.measured),
        notes: row.notes,
        recordDate: row.recordDate ?? row.createdAt.slice(0, 10),
        createdAt: row.createdAt
    };
};


// Get all water records, optionally filtered by date.
export const getAllWaterRecords = async (
    date?: string
): Promise<WaterRecord[]> => {

    const rows = await waterRepository.find({
        where: date ? { recordDate: date } : {},
        order: date
            ? { id: "ASC" }
            : { recordDate: "DESC", id: "ASC" }
    });

    return rows.map(formatWater);
};


// Create a water record.
export const createWaterRecord = async (
    input: CreateWaterInput
): Promise<WaterRecord> => {

    const newRecord = waterRepository.create({
        offeredMl: input.offeredMl,
        consumedMl: input.measured
            ? input.consumedMl ?? null
            : null,
        measured: input.measured ? 1 : 0,
        notes: input.notes ?? "",
        createdAt: new Date().toISOString(),
        recordDate: input.recordDate
    });

    const savedRecord = await waterRepository.save(newRecord);

    return formatWater(savedRecord);
};


// Get water summary, optionally filtered by date.
export const getWaterSummary = async (
    date?: string
): Promise<{
    totalRecords: number;
    totalOfferedMl: number;
    measuredConsumptionRecords: number;
    totalMeasuredConsumedMl: number;
}> => {

    const query = waterRepository
        .createQueryBuilder("water")
        .select("COUNT(*)", "totalRecords")
        .addSelect(
            "COALESCE(SUM(water.offeredMl), 0)",
            "totalOfferedMl"
        )
        .addSelect(
            "COALESCE(SUM(CASE WHEN water.measured = 1 THEN 1 ELSE 0 END), 0)",
            "measuredConsumptionRecords"
        )
        .addSelect(
            "COALESCE(SUM(CASE WHEN water.measured = 1 THEN water.consumedMl ELSE 0 END), 0)",
            "totalMeasuredConsumedMl"
        );

    if (date) {
        query.where("water.recordDate = :date", { date });
    }

    const summary = await query.getRawOne<{
        totalRecords: string | number;
        totalOfferedMl: string | number;
        measuredConsumptionRecords: string | number;
        totalMeasuredConsumedMl: string | number;
    }>();

    return {
        totalRecords: Number(summary?.totalRecords ?? 0),
        totalOfferedMl: Number(summary?.totalOfferedMl ?? 0),
        measuredConsumptionRecords: Number(summary?.measuredConsumptionRecords ?? 0),
        totalMeasuredConsumedMl: Number(summary?.totalMeasuredConsumedMl ?? 0)
    };
};


// Get one water record by ID.
export const getWaterRecordById = async (
    id: number
): Promise<WaterRecord | null> => {

    const row = await waterRepository.findOneBy({ id });

    if (!row) {
        return null;
    }

    return formatWater(row);
};


// Full update: Replace all editable water fields.
export const updateWaterRecord = async (
    id: number,
    input: CreateWaterInput
): Promise<WaterRecord | null> => {

    const record = await waterRepository.findOneBy({ id });

    if (!record) {
        return null;
    }

    record.offeredMl = input.offeredMl;
    record.consumedMl = input.measured
        ? input.consumedMl ?? null
        : null;
    record.measured = input.measured ? 1 : 0;
    record.notes = input.notes ?? "";
    record.recordDate = input.recordDate;

    const updatedRecord = await waterRepository.save(record);

    return formatWater(updatedRecord);
};


// Delete a water record.
export const deleteWaterRecord = async (
    id: number
): Promise<boolean> => {

    const record = await waterRepository.findOneBy({ id });

    if (!record) {
        return false;
    }

    await waterRepository.remove(record);

    return true;
};


// Partial update: Update only the fields provided.
export const patchWaterRecord = async (
    id: number,
    input: PatchWaterInput
): Promise<WaterRecord | null> => {

    const record = await waterRepository.findOneBy({ id });

    if (!record) {
        return null;
    }

    if (input.offeredMl !== undefined) {
        record.offeredMl = input.offeredMl;
    }

    if (input.consumedMl !== undefined) {
        record.consumedMl = input.consumedMl;
    }

    if (input.measured !== undefined) {
        record.measured = input.measured ? 1 : 0;

        if (input.measured === false) {
            record.consumedMl = null;
        }
    }

    if (input.notes !== undefined) {
        record.notes = input.notes;
    }

    if (input.recordDate !== undefined) {
        record.recordDate = input.recordDate;
    }

    const updatedRecord = await waterRepository.save(record);

    return formatWater(updatedRecord);
};
