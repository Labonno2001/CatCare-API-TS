
import { AppDataSource } from "../database/data-source";

import { WaterRecord as WaterRecordEntity } from "../entities/WaterRecord";
import { WaterDailyTarget as WaterDailyTargetEntity } from "../entities/WaterDailyTarget";
import { CatProfileEntity } from "../entities/CatProfile";

import type {
    WaterRecord,
    CreateWaterInput,
    PatchWaterInput,
    WaterDailyTarget,
    CreateWaterDailyTargetInput,
    WaterDailySummary
} from "../types/water.types";

// --------------------------------------------------
// Custom PATCH validation error
// --------------------------------------------------

export class WaterPatchValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "WaterPatchValidationError";
    }
}

// --------------------------------------------------
// Repositories
// --------------------------------------------------

const waterRepository = AppDataSource.getRepository(WaterRecordEntity);
const dailyTargetRepository = AppDataSource.getRepository(WaterDailyTargetEntity);
const catRepository = AppDataSource.getRepository(CatProfileEntity);

// --------------------------------------------------
// Advanced query options
// --------------------------------------------------

export interface WaterQueryOptions {
    startDate?: string;
    endDate?: string;
    measured?: boolean;
    minConsumedMl?: number;
    maxConsumedMl?: number;
    sortBy?: "recordDate" | "consumedMl" | "createdAt";
    order?: "ASC" | "DESC";
    page?: number;
    limit?: number;
}

// --------------------------------------------------
// Format water record
// --------------------------------------------------

const formatWater = (record: WaterRecordEntity): WaterRecord => ({
    id: record.id,
    consumedMl: record.consumedMl,
    measured: record.measured === 1,
    notes: record.notes,
    recordDate: record.recordDate ?? "",
    createdAt: record.createdAt
});

// --------------------------------------------------
// Format daily target
// --------------------------------------------------

const formatDailyTarget = (
    target: WaterDailyTargetEntity
): WaterDailyTarget => ({
    id: target.id,
    catId: target.cat.id,
    offeredMl: target.offeredMl,
    recordDate: target.recordDate,
    createdAt: target.createdAt,
    updatedAt: target.updatedAt
});

// --------------------------------------------------
// Get default cat
// --------------------------------------------------

const getDefaultCat = async (): Promise<CatProfileEntity> => {
    const cat = await catRepository.findOneBy({ id: 1 });

    if (!cat) {
        throw new Error("Default cat not found");
    }

    return cat;
};

// --------------------------------------------------
// GET all water records
// --------------------------------------------------

export const getAllWaterRecords = async (): Promise<WaterRecord[]> => {
    const cat = await getDefaultCat();

    const records = await waterRepository.find({
        where: {
            cat: { id: cat.id }
        },
        order: {
            id: "DESC"
        }
    });

    return records.map(formatWater);
};

// --------------------------------------------------
// CREATE water consumption record
// --------------------------------------------------

export const createWaterRecord = async (
    input: CreateWaterInput
): Promise<WaterRecord> => {
    const cat = await getDefaultCat();

    const newRecord = waterRepository.create({
        // Temporary compatibility with the old NOT NULL database column.
        // Offered water is stored separately in water_daily_targets.
        // This value does NOT change the daily offered water target.
        offeredMl: 0,

        consumedMl: input.measured ? input.consumedMl ?? null : null,
        measured: input.measured ? 1 : 0,
        notes: input.notes ?? "",
        recordDate: input.recordDate,
        createdAt: new Date().toISOString(),
        cat
    });

    const savedRecord = await waterRepository.save(newRecord);

    return formatWater(savedRecord);
};

// --------------------------------------------------
// GET daily offered water target
// --------------------------------------------------

export const getWaterDailyTarget = async (
    recordDate: string
): Promise<WaterDailyTarget | null> => {
    const cat = await getDefaultCat();

    const target = await dailyTargetRepository.findOne({
        where: {
            cat: { id: cat.id },
            recordDate
        },
        relations: {
            cat: true
        }
    });

    return target ? formatDailyTarget(target) : null;
};

// --------------------------------------------------
// CREATE or UPDATE daily offered water target
// --------------------------------------------------

export const saveWaterDailyTarget = async (
    input: CreateWaterDailyTargetInput
): Promise<WaterDailyTarget> => {
    const cat = await getDefaultCat();

    if (!Number.isFinite(input.offeredMl) || input.offeredMl < 0) {
        throw new Error("Offered water must be a non-negative number");
    }

    const existingTarget = await dailyTargetRepository.findOne({
        where: {
            cat: { id: cat.id },
            recordDate: input.recordDate
        },
        relations: {
            cat: true
        }
    });

    const now = new Date().toISOString();

    // Update the existing target for this date.
    if (existingTarget) {
        existingTarget.offeredMl = input.offeredMl;
        existingTarget.updatedAt = now;

        const updatedTarget = await dailyTargetRepository.save(existingTarget);

        return formatDailyTarget(updatedTarget);
    }

    // Create a new daily target.
    const newTarget = dailyTargetRepository.create({
        cat,
        recordDate: input.recordDate,
        offeredMl: input.offeredMl,
        createdAt: now,
        updatedAt: now
    });

    const savedTarget = await dailyTargetRepository.save(newTarget);

    return formatDailyTarget(savedTarget);
};

// --------------------------------------------------
// GET water summary for a specific date
// --------------------------------------------------

export const getWaterSummary = async (
    recordDate: string
): Promise<WaterDailySummary> => {
    const cat = await getDefaultCat();

    const waterResult = await waterRepository
        .createQueryBuilder("water")
        .innerJoin("water.cat", "cat")
        .where("cat.id = :catId", { catId: cat.id })
        .andWhere("water.recordDate = :recordDate", { recordDate })
        .select("COUNT(water.id)", "totalRecords")
        .addSelect(
            `COALESCE(
                SUM(CASE WHEN water.measured = 1 THEN 1 ELSE 0 END),
                0
            )`,
            "measuredRecords"
        )
        .addSelect(
            `COALESCE(
                SUM(
                    CASE
                        WHEN water.measured = 1
                        THEN COALESCE(water.consumedMl, 0)
                        ELSE 0
                    END
                ),
                0
            )`,
            "totalConsumedMl"
        )
        .getRawOne();

    const target = await dailyTargetRepository.findOne({
        where: {
            cat: { id: cat.id },
            recordDate
        }
    });

    const offeredMl = Number(target?.offeredMl ?? 0);
    const totalConsumedMl = Number(waterResult?.totalConsumedMl ?? 0);

    return {
        recordDate,
        offeredMl,
        totalConsumedMl,
        remainingMl: offeredMl - totalConsumedMl,
        totalRecords: Number(waterResult?.totalRecords ?? 0),
        measuredRecords: Number(waterResult?.measuredRecords ?? 0)
    };
};

// --------------------------------------------------
// GET one water record by ID
// --------------------------------------------------

export const getWaterRecordById = async (
    id: number
): Promise<WaterRecord | null> => {
    const cat = await getDefaultCat();

    const record = await waterRepository.findOne({
        where: {
            id,
            cat: { id: cat.id }
        }
    });

    return record ? formatWater(record) : null;
};

// --------------------------------------------------
// UPDATE water record (PUT)
// --------------------------------------------------

export const updateWaterRecord = async (
    id: number,
    input: CreateWaterInput
): Promise<WaterRecord | null> => {
    const cat = await getDefaultCat();

    const record = await waterRepository.findOne({
        where: {
            id,
            cat: { id: cat.id }
        }
    });

    if (!record) {
        return null;
    }

    // PUT changes only the individual consumption record.
    // It never modifies the daily offered water target.
    record.consumedMl = input.measured ? input.consumedMl ?? null : null;
    record.measured = input.measured ? 1 : 0;
    record.notes = input.notes ?? "";
    record.recordDate = input.recordDate;

    const updatedRecord = await waterRepository.save(record);

    return formatWater(updatedRecord);
};

// --------------------------------------------------
// PATCH water record
// --------------------------------------------------

export const patchWaterRecord = async (
    id: number,
    input: PatchWaterInput
): Promise<WaterRecord | null> => {
    const cat = await getDefaultCat();

    const record = await waterRepository.findOne({
        where: {
            id,
            cat: { id: cat.id }
        }
    });

    if (!record) {
        return null;
    }

    // Determine the final measurement status.
    const resultingMeasured =
        input.measured ?? (record.measured === 1);

    // Determine the final consumed water value.
    const resultingConsumed =
        !resultingMeasured
            ? null
            : input.consumedMl !== undefined
                ? input.consumedMl
                : record.consumedMl;

    // Validate the final state.
    if (
        resultingMeasured &&
        (resultingConsumed === null || resultingConsumed === undefined)
    ) {
        throw new WaterPatchValidationError(
            "Consumed water is required when measurement is enabled."
        );
    }

    if (
        !resultingMeasured &&
        input.consumedMl !== undefined &&
        input.consumedMl !== null
    ) {
        throw new WaterPatchValidationError(
            "Consumed water cannot be recorded when measurement is disabled."
        );
    }

    // Apply the final values.
    record.measured = resultingMeasured ? 1 : 0;
    record.consumedMl = resultingConsumed;

    if (input.notes !== undefined) {
        record.notes = input.notes;
    }

    if (input.recordDate !== undefined) {
        record.recordDate = input.recordDate;
    }

    // PATCH never modifies the daily offered water target.
    const updatedRecord = await waterRepository.save(record);

    return formatWater(updatedRecord);
};

// --------------------------------------------------
// DELETE water record
// --------------------------------------------------

export const deleteWaterRecord = async (
    id: number
): Promise<boolean> => {
    const cat = await getDefaultCat();

    const record = await waterRepository.findOne({
        where: {
            id,
            cat: { id: cat.id }
        }
    });

    if (!record) {
        return false;
    }

    // Deleting a consumption record does NOT delete
    // or modify the daily offered water target.
    await waterRepository.remove(record);

    return true;
};

// --------------------------------------------------
// ADVANCED filtering, sorting and pagination
// --------------------------------------------------

export const getAdvancedWaterRecords = async (
    options: WaterQueryOptions = {}
) => {
    const cat = await getDefaultCat();

    const page = Math.max(1, Math.floor(options.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 10)));

    const allowedSortFields = {
        recordDate: "water.recordDate",
        consumedMl: "water.consumedMl",
        createdAt: "water.createdAt"
    };

    const sortBy = options.sortBy ?? "createdAt";
    const order = options.order === "ASC" ? "ASC" : "DESC";

    const query = waterRepository
        .createQueryBuilder("water")
        .innerJoin("water.cat", "cat")
        .where("cat.id = :catId", { catId: cat.id });

    if (options.startDate) {
        query.andWhere("water.recordDate >= :startDate", {
            startDate: options.startDate
        });
    }

    if (options.endDate) {
        query.andWhere("water.recordDate <= :endDate", {
            endDate: options.endDate
        });
    }

    if (options.measured !== undefined) {
        query.andWhere("water.measured = :measured", {
            measured: options.measured ? 1 : 0
        });
    }

    if (options.minConsumedMl !== undefined) {
        query.andWhere("water.consumedMl >= :minConsumedMl", {
            minConsumedMl: options.minConsumedMl
        });
    }

    if (options.maxConsumedMl !== undefined) {
        query.andWhere("water.consumedMl <= :maxConsumedMl", {
            maxConsumedMl: options.maxConsumedMl
        });
    }

    const total = await query.getCount();

    const records = await query
        .orderBy(allowedSortFields[sortBy], order)
        .addOrderBy("water.id", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

    return {
        records: records.map(formatWater),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

// --------------------------------------------------
// GROUP water records by measured status
// --------------------------------------------------

export const getWaterGrouped = async (
    startDate?: string,
    endDate?: string
) => {
    const cat = await getDefaultCat();

    const query = waterRepository
        .createQueryBuilder("water")
        .innerJoin("water.cat", "cat")
        .where("cat.id = :catId", { catId: cat.id });

    if (startDate) {
        query.andWhere("water.recordDate >= :startDate", {
            startDate
        });
    }

    if (endDate) {
        query.andWhere("water.recordDate <= :endDate", {
            endDate
        });
    }

    const results = await query
        .select("water.measured", "measured")
        .addSelect("COUNT(water.id)", "totalRecords")
        .addSelect(
            `COALESCE(
                SUM(
                    CASE
                        WHEN water.measured = 1
                        THEN COALESCE(water.consumedMl, 0)
                        ELSE 0
                    END
                ),
                0
            )`,
            "totalConsumedMl"
        )
        .groupBy("water.measured")
        .orderBy("water.measured", "DESC")
        .getRawMany();

    return results.map(row => ({
        measured: Number(row.measured) === 1,
        totalRecords: Number(row.totalRecords),
        totalConsumedMl: Number(row.totalConsumedMl)
    }));
};
