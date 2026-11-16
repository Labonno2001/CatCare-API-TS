
import { AppDataSource } from "../database/data-source";
import { FeedingRecord as FeedingRecordEntity } from "../entities/FeedingRecord";

import {
    FeedingRecord,
    CreateFeedingInput,
    PatchFeedingInput
} from "../types/feeding.types";

const feedingRepository =
    AppDataSource.getRepository(FeedingRecordEntity);

export interface FeedingQueryOptions {
    startDate?: string;
    endDate?: string;
    foodName?: string;
    mealTime?: string;
    sortBy?: "recordDate" | "quantityGrams" | "foodName";
    order?: "ASC" | "DESC";
    page?: number;
    limit?: number;
}

const formatFeeding = (row: FeedingRecordEntity): FeedingRecord => ({
    id: row.id,
    foodName: row.foodName,
    quantityGrams: row.quantityGrams,
    mealTime: row.mealTime,
    notes: row.notes,
    recordDate: row.recordDate ?? row.createdAt.slice(0, 10),
    createdAt: row.createdAt
});

// GET all feeding records.
export const getAllFeedingRecords = async (
    date?: string
): Promise<FeedingRecord[]> => {
    const rows = await feedingRepository.find({
        where: date ? { recordDate: date } : {},
        order: date
            ? { id: "ASC" }
            : { recordDate: "DESC", id: "ASC" }
    });

    return rows.map(formatFeeding);
};

// Advanced filtering, date range, sorting and pagination.
export const getFeedingRecordsAdvanced = async (
    options: FeedingQueryOptions
) => {
    const {
        startDate,
        endDate,
        foodName,
        mealTime,
        sortBy = "recordDate",
        order = "DESC",
        page = 1,
        limit = 10
    } = options;

    const query = feedingRepository
        .createQueryBuilder("feeding");

    // Filter by starting date.
    if (startDate) {
        query.andWhere("feeding.recordDate >= :startDate", {
            startDate
        });
    }

    // Filter by ending date.
    if (endDate) {
        query.andWhere("feeding.recordDate <= :endDate", {
            endDate
        });
    }

    // Search by food name.
    if (foodName) {
        query.andWhere("LOWER(feeding.foodName) LIKE LOWER(:foodName)", {
            foodName: `%${foodName}%`
        });
    }

    // Filter by meal time.
    if (mealTime) {
        query.andWhere("feeding.mealTime = :mealTime", {
            mealTime
        });
    }

    // Allowed sorting fields.
    const allowedSortFields = {
        recordDate: "feeding.recordDate",
        quantityGrams: "feeding.quantityGrams",
        foodName: "feeding.foodName"
    };

    // Sorting and pagination.
    query
        .orderBy(allowedSortFields[sortBy], order)
        .addOrderBy("feeding.id", "ASC")
        .skip((page - 1) * limit)
        .take(limit);

    const [records, total] = await query.getManyAndCount();

    // Standardized response structure.
    return {
        data: records.map(formatFeeding),
        pagination: {
            totalRecords: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit
        }
    };
};

// Group feeding records by food name.
export const getFeedingGroupedByFood = async (
    startDate?: string,
    endDate?: string
) => {
    const query = feedingRepository
        .createQueryBuilder("feeding")
        .select("feeding.foodName", "foodName")
        .addSelect("COUNT(*)", "totalRecords")
        .addSelect("SUM(feeding.quantityGrams)", "totalGrams")
        .groupBy("feeding.foodName")
        .orderBy("totalGrams", "DESC");

    if (startDate) {
        query.andWhere("feeding.recordDate >= :startDate", {
            startDate
        });
    }

    if (endDate) {
        query.andWhere("feeding.recordDate <= :endDate", {
            endDate
        });
    }

    const rows = await query.getRawMany();

    return rows.map(row => ({
        foodName: row.foodName,
        totalRecords: Number(row.totalRecords),
        totalGrams: Number(row.totalGrams)
    }));
};

// POST a feeding record.
export const createFeedingRecord = async (
    input: CreateFeedingInput
): Promise<FeedingRecord> => {
    const newRecord = feedingRepository.create({
        foodName: input.foodName.trim(),
        quantityGrams: input.quantityGrams,
        mealTime: input.mealTime,
        notes: input.notes ?? "",
        createdAt: new Date().toISOString(),
        recordDate: input.recordDate
    });

    return formatFeeding(await feedingRepository.save(newRecord));
};

// GET feeding summary.
export const getFeedingSummary = async (date?: string) => {
    const query = feedingRepository
        .createQueryBuilder("feeding")
        .select("COUNT(*)", "totalRecords")
        .addSelect(
            "COALESCE(SUM(feeding.quantityGrams), 0)",
            "totalGrams"
        );

    if (date) {
        query.where("feeding.recordDate = :date", { date });
    }

    const summary = await query.getRawOne();

    return {
        totalRecords: Number(summary?.totalRecords ?? 0),
        totalGrams: Number(summary?.totalGrams ?? 0)
    };
};

// GET one feeding record by ID.
export const getFeedingRecordById = async (
    id: number
): Promise<FeedingRecord | null> => {
    const row = await feedingRepository.findOneBy({ id });

    return row ? formatFeeding(row) : null;
};

// PUT: Replace the complete feeding record.
export const updateFeedingRecord = async (
    id: number,
    input: CreateFeedingInput
): Promise<FeedingRecord | null> => {
    const result = await feedingRepository.update(id, {
        foodName: input.foodName.trim(),
        quantityGrams: input.quantityGrams,
        mealTime: input.mealTime,
        notes: input.notes ?? "",
        recordDate: input.recordDate
    });

    if (!result.affected) return null;

    const updated = await feedingRepository.findOneBy({ id });

    return updated ? formatFeeding(updated) : null;
};

// DELETE a feeding record.
export const deleteFeedingRecord = async (
    id: number
): Promise<boolean> => {
    const result = await feedingRepository.delete(id);

    return (result.affected ?? 0) > 0;
};

// PATCH: Update selected feeding fields.
export const patchFeedingRecord = async (
    id: number,
    input: PatchFeedingInput
): Promise<FeedingRecord | null> => {
    const record = await feedingRepository.findOneBy({ id });

    if (!record) return null;

    if (input.foodName !== undefined) {
        record.foodName = input.foodName.trim();
    }

    if (input.quantityGrams !== undefined) {
        record.quantityGrams = input.quantityGrams;
    }

    if (input.mealTime !== undefined) {
        record.mealTime = input.mealTime;
    }

    if (input.notes !== undefined) {
        record.notes = input.notes;
    }

    if (input.recordDate !== undefined) {
        record.recordDate = input.recordDate;
    }

    return formatFeeding(await feedingRepository.save(record));
};
