
import { AppDataSource } from "../database/data-source";

import { FeedingRecord as FeedingRecordEntity } from "../entities/FeedingRecord";
import { CatProfileEntity } from "../entities/CatProfile";

import {
    FeedingRecord,
    CreateFeedingInput,
    PatchFeedingInput
} from "../types/feeding.types";

const feedingRepository =
    AppDataSource.getRepository(FeedingRecordEntity);

const catRepository =
    AppDataSource.getRepository(CatProfileEntity);


// Query options for filtering, sorting and pagination.
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


// Convert TypeORM entity into API response format.
const formatFeeding = (
    row: FeedingRecordEntity
): FeedingRecord => ({
    id: row.id,
    foodName: row.foodName,
    quantityGrams: row.quantityGrams,
    mealTime: row.mealTime,
    notes: row.notes,
    recordDate: row.recordDate ?? row.createdAt.slice(0, 10),
    createdAt: row.createdAt
});


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


// GET ALL FEEDING RECORDS
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


// ADVANCED FILTERING, SORTING AND PAGINATION
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

    if (startDate) {
        query.andWhere(
            "feeding.recordDate >= :startDate",
            { startDate }
        );
    }

    if (endDate) {
        query.andWhere(
            "feeding.recordDate <= :endDate",
            { endDate }
        );
    }

    if (foodName) {
        query.andWhere(
            "LOWER(feeding.foodName) LIKE LOWER(:foodName)",
            { foodName: `%${foodName}%` }
        );
    }

    if (mealTime) {
        query.andWhere(
            "feeding.mealTime = :mealTime",
            { mealTime }
        );
    }

    const allowedSortFields = {
        recordDate: "feeding.recordDate",
        quantityGrams: "feeding.quantityGrams",
        foodName: "feeding.foodName"
    };

    query
        .orderBy(allowedSortFields[sortBy], order)
        .addOrderBy("feeding.id", "ASC")
        .skip((page - 1) * limit)
        .take(limit);

    const [records, total] =
        await query.getManyAndCount();

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


// GROUP FEEDING RECORDS BY FOOD NAME
export const getFeedingGroupedByFood = async (
    startDate?: string,
    endDate?: string
) => {

    const query = feedingRepository
        .createQueryBuilder("feeding")
        .select("feeding.foodName", "foodName")
        .addSelect("COUNT(*)", "totalRecords")
        .addSelect(
            "SUM(feeding.quantityGrams)",
            "totalGrams"
        )
        .groupBy("feeding.foodName")
        .orderBy("totalGrams", "DESC");

    if (startDate) {
        query.andWhere(
            "feeding.recordDate >= :startDate",
            { startDate }
        );
    }

    if (endDate) {
        query.andWhere(
            "feeding.recordDate <= :endDate",
            { endDate }
        );
    }

    const rows = await query.getRawMany();

    return rows.map(row => ({
        foodName: row.foodName,
        totalRecords: Number(row.totalRecords),
        totalGrams: Number(row.totalGrams)
    }));
};


// CREATE FEEDING RECORD
export const createFeedingRecord = async (
    input: CreateFeedingInput
): Promise<FeedingRecord> => {

    // Find Mini before creating the record.
    const cat = await getDefaultCat();

    // Create a new feeding record.
    const newRecord = feedingRepository.create({

        foodName: input.foodName.trim(),

        quantityGrams: input.quantityGrams,

        mealTime: input.mealTime,

        notes: input.notes ?? "",

        createdAt: new Date().toISOString(),

        recordDate: input.recordDate,

        // Assign the required cat relationship.
        cat: cat
    });

    // Save the record in SQLite.
    const savedRecord =
        await feedingRepository.save(newRecord);

    return formatFeeding(savedRecord);
};


// GET FEEDING SUMMARY
export const getFeedingSummary = async (
    date?: string
) => {

    const query = feedingRepository
        .createQueryBuilder("feeding")
        .select("COUNT(*)", "totalRecords")
        .addSelect(
            "COALESCE(SUM(feeding.quantityGrams), 0)",
            "totalGrams"
        );

    if (date) {
        query.where(
            "feeding.recordDate = :date",
            { date }
        );
    }

    const summary = await query.getRawOne();

    return {
        totalRecords: Number(
            summary?.totalRecords ?? 0
        ),

        totalGrams: Number(
            summary?.totalGrams ?? 0
        )
    };
};


// GET ONE FEEDING RECORD BY ID
export const getFeedingRecordById = async (
    id: number
): Promise<FeedingRecord | null> => {

    const row = await feedingRepository.findOneBy({
        id
    });

    return row ? formatFeeding(row) : null;
};


// FULL UPDATE USING PUT
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

    if (!result.affected) {
        return null;
    }

    const updated = await feedingRepository.findOneBy({
        id
    });

    return updated ? formatFeeding(updated) : null;
};


// DELETE FEEDING RECORD
export const deleteFeedingRecord = async (
    id: number
): Promise<boolean> => {

    const result = await feedingRepository.delete(id);

    return (result.affected ?? 0) > 0;
};


// PARTIAL UPDATE USING PATCH
export const patchFeedingRecord = async (
    id: number,
    input: PatchFeedingInput
): Promise<FeedingRecord | null> => {

    const record = await feedingRepository.findOneBy({
        id
    });

    if (!record) {
        return null;
    }

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

    const savedRecord =
        await feedingRepository.save(record);

    return formatFeeding(savedRecord);
};
