
import { AppDataSource } from "../database/data-source";

import { WaterRecord as WaterRecordEntity } from "../entities/WaterRecord";
import { CatProfileEntity } from "../entities/CatProfile";

import {
    WaterRecord,
    CreateWaterInput,
    PatchWaterInput
} from "../types/water.types";


const waterRepository =
    AppDataSource.getRepository(WaterRecordEntity);

const catRepository =
    AppDataSource.getRepository(CatProfileEntity);


// Query options for filtering, sorting and pagination.
export interface WaterQueryOptions {
    startDate?: string;
    endDate?: string;
    measured?: boolean;
    sortBy?: "recordDate" | "offeredMl" | "consumedMl" | "createdAt";
    order?: "ASC" | "DESC";
    page?: number;
    limit?: number;
}


// Convert TypeORM entity into API response format.
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


// Find the default cat.
const getDefaultCat = async (): Promise<CatProfileEntity> => {

    const cat = await catRepository.findOneBy({
        id: 1
    });

    if (!cat) {
        throw new Error(
            "Default cat profile (Mini, ID 1) not found."
        );
    }

    return cat;
};


// GET ALL WATER RECORDS
export const getAllWaterRecords = async (
    date?: string
): Promise<WaterRecord[]> => {

    const rows = await waterRepository.find({

        where: date
            ? { recordDate: date }
            : {},

        order: date
            ? { id: "ASC" }
            : { recordDate: "DESC", id: "ASC" }
    });

    return rows.map(formatWater);
};


// CREATE WATER RECORD
export const createWaterRecord = async (
    input: CreateWaterInput
): Promise<WaterRecord> => {

    // Find Mini before creating the record.
    const cat = await getDefaultCat();

    // Create a new water record.
    const newRecord = waterRepository.create({

        offeredMl: input.offeredMl,

        consumedMl: input.measured
            ? input.consumedMl ?? null
            : null,

        measured: input.measured ? 1 : 0,

        notes: input.notes ?? "",

        createdAt: new Date().toISOString(),

        recordDate: input.recordDate,

        // Assign the required cat relationship.
        cat: cat
    });

    // Save the record in SQLite.
    const savedRecord =
        await waterRepository.save(newRecord);

    return formatWater(savedRecord);
};


// GET WATER SUMMARY
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
        query.where(
            "water.recordDate = :date",
            { date }
        );
    }

    const summary = await query.getRawOne<{
        totalRecords: string | number;
        totalOfferedMl: string | number;
        measuredConsumptionRecords: string | number;
        totalMeasuredConsumedMl: string | number;
    }>();

    return {

        totalRecords: Number(
            summary?.totalRecords ?? 0
        ),

        totalOfferedMl: Number(
            summary?.totalOfferedMl ?? 0
        ),

        measuredConsumptionRecords: Number(
            summary?.measuredConsumptionRecords ?? 0
        ),

        totalMeasuredConsumedMl: Number(
            summary?.totalMeasuredConsumedMl ?? 0
        )
    };
};


// GET ONE WATER RECORD BY ID
export const getWaterRecordById = async (
    id: number
): Promise<WaterRecord | null> => {

    const row = await waterRepository.findOneBy({
        id
    });

    if (!row) {
        return null;
    }

    return formatWater(row);
};


// FULL UPDATE USING PUT
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

    const updatedRecord =
        await waterRepository.findOneBy({ id });

    return updatedRecord
        ? formatWater(updatedRecord)
        : null;
};


// DELETE WATER RECORD
export const deleteWaterRecord = async (
    id: number
): Promise<boolean> => {

    const result = await waterRepository.delete(id);

    return (result.affected ?? 0) > 0;
};


// PARTIAL UPDATE USING PATCH
export const patchWaterRecord = async (
    id: number,
    input: PatchWaterInput
): Promise<WaterRecord | null> => {

    const record = await waterRepository.findOneBy({
        id
    });

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

    const updatedRecord =
        await waterRepository.save(record);

    return formatWater(updatedRecord);
};


// ADVANCED FILTERING, SORTING AND PAGINATION
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

    // Date range filtering.
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

    // Filter measured or unmeasured records.
    if (measured !== undefined) {
        query.andWhere(
            "water.measured = :measured",
            { measured: measured ? 1 : 0 }
        );
    }

    // Allow only approved sorting columns.
    const sortColumns = {
        recordDate: "water.recordDate",
        offeredMl: "water.offeredMl",
        consumedMl: "water.consumedMl",
        createdAt: "water.createdAt"
    };

    query
        .orderBy(sortColumns[sortBy], order)
        .addOrderBy("water.id", "ASC");

    // Pagination.
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


// GROUP WATER RECORDS BY MEASUREMENT STATUS
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
