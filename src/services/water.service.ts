
import { AppDataSource } from "../database/data-source";
import { WaterRecord as WaterRecordEntity } from "../entities/WaterRecord";

import {
    WaterRecord,
    CreateWaterInput,
    PatchWaterInput
} from "../types/water.types";

const waterRepository =
    AppDataSource.getRepository(WaterRecordEntity);


// Advanced query options
export interface WaterQueryOptions {
    startDate?: string;
    endDate?: string;
    measured?: boolean;
    sortBy?: "recordDate" | "offeredMl" | "consumedMl" | "createdAt";
    order?: "ASC" | "DESC";
    page?: number;
    limit?: number;
}


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


// Full update using TypeORM update().
export const updateWaterRecord = async (
    id: number,
    input: CreateWaterInput
): Promise<WaterRecord | null> => {

    const result = await waterRepository.update(id, {
        offeredMl: input.offeredMl,
        consumedMl: input.measured
            ? input.consumedMl ?? null
            : null,
        measured: input.measured ? 1 : 0,
        notes: input.notes ?? "",
        recordDate: input.recordDate
    });

    if (!result.affected) {
        return null;
    }

    const updatedRecord = await waterRepository.findOneBy({ id });

    return updatedRecord ? formatWater(updatedRecord) : null;
};


// Delete using TypeORM delete().
export const deleteWaterRecord = async (
    id: number
): Promise<boolean> => {

    const result = await waterRepository.delete(id);

    return (result.affected ?? 0) > 0;
};


// Partial update using findOneBy() and save().
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


// ADVANCED QUERY BUILDER
// Filter, sort and paginate water records.
export const getWaterRecordsAdvanced = async (
    options: WaterQueryOptions
): Promise<{
    data: WaterRecord[];
    pagination: {
        totalRecords: number;
        currentPage: number;
        totalPages: number;
        limit: number;
    };
}> => {

    const {
        startDate,
        endDate,
        measured,
        sortBy = "recordDate",
        order = "DESC",
        page = 1,
        limit = 10
    } = options;

    const query = waterRepository
        .createQueryBuilder("water");

    // Date range filtering
    if (startDate) {
        query.andWhere(
            "water.recordDate >= :startDate",
            { startDate }
        );
    }

    if (endDate) {
        query.andWhere(
            "water.recordDate <= :endDate",
            { endDate }
        );
    }

    // Filter measured or unmeasured records
    if (measured !== undefined) {
        query.andWhere(
            "water.measured = :measured",
            { measured: measured ? 1 : 0 }
        );
    }

    // Allow only approved sorting columns
    const sortColumns = {
        recordDate: "water.recordDate",
        offeredMl: "water.offeredMl",
        consumedMl: "water.consumedMl",
        createdAt: "water.createdAt"
    };

    query.orderBy(sortColumns[sortBy], order);
    query.addOrderBy("water.id", "ASC");

    // Pagination
    query.skip((page - 1) * limit);
    query.take(limit);

    const [records, totalRecords] =
        await query.getManyAndCount();

    return {
        data: records.map(formatWater),
        pagination: {
            totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit),
            limit
        }
    };
};


// GROUP BY measured status
export const getWaterGroupedByMeasurement = async (
    startDate?: string,
    endDate?: string
): Promise<{
    measured: boolean;
    totalRecords: number;
    totalOfferedMl: number;
    totalConsumedMl: number;
}[]> => {

    const query = waterRepository
        .createQueryBuilder("water")
        .select("water.measured", "measured")
        .addSelect("COUNT(*)", "totalRecords")
        .addSelect(
            "COALESCE(SUM(water.offeredMl), 0)",
            "totalOfferedMl"
        )
        .addSelect(
            "COALESCE(SUM(water.consumedMl), 0)",
            "totalConsumedMl"
        )
        .groupBy("water.measured")
        .orderBy("water.measured", "DESC");

    if (startDate) {
        query.andWhere(
            "water.recordDate >= :startDate",
            { startDate }
        );
    }

    if (endDate) {
        query.andWhere(
            "water.recordDate <= :endDate",
            { endDate }
        );
    }

    const results = await query.getRawMany<{
        measured: number;
        totalRecords: string | number;
        totalOfferedMl: string | number;
        totalConsumedMl: string | number;
    }>();

    return results.map((row) => ({
        measured: Boolean(row.measured),
        totalRecords: Number(row.totalRecords),
        totalOfferedMl: Number(row.totalOfferedMl),
        totalConsumedMl: Number(row.totalConsumedMl)
    }));
};
