
import { AppDataSource } from "../database/data-source";
import { FeedingRecord as FeedingRecordEntity } from "../entities/FeedingRecord";

import {
    FeedingRecord,
    CreateFeedingInput,
    PatchFeedingInput
} from "../types/feeding.types";

const feedingRepository =
    AppDataSource.getRepository(FeedingRecordEntity);


// Convert a TypeORM entity into the existing API response format.
const formatFeeding = (
    row: FeedingRecordEntity
): FeedingRecord => {
    return {
        id: row.id,
        foodName: row.foodName,
        quantityGrams: row.quantityGrams,
        mealTime: row.mealTime,
        notes: row.notes,
        recordDate: row.recordDate ?? row.createdAt.slice(0, 10),
        createdAt: row.createdAt
    };
};


// Get all feeding records, optionally filtered by date.
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


// Create a feeding record.
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

    const savedRecord = await feedingRepository.save(newRecord);

    return formatFeeding(savedRecord);
};


// Get feeding summary, optionally filtered by date.
export const getFeedingSummary = async (
    date?: string
): Promise<{
    totalRecords: number;
    totalGrams: number;
}> => {

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

    const summary = await query.getRawOne<{
        totalRecords: string | number;
        totalGrams: string | number;
    }>();

    return {
        totalRecords: Number(summary?.totalRecords ?? 0),
        totalGrams: Number(summary?.totalGrams ?? 0)
    };
};


// Get one feeding record by ID.
export const getFeedingRecordById = async (
    id: number
): Promise<FeedingRecord | null> => {

    const row = await feedingRepository.findOneBy({ id });

    if (!row) {
        return null;
    }

    return formatFeeding(row);
};


// Full update: Replace all editable feeding fields.
export const updateFeedingRecord = async (
    id: number,
    input: CreateFeedingInput
): Promise<FeedingRecord | null> => {

    const record = await feedingRepository.findOneBy({ id });

    if (!record) {
        return null;
    }

    record.foodName = input.foodName.trim();
    record.quantityGrams = input.quantityGrams;
    record.mealTime = input.mealTime;
    record.notes = input.notes ?? "";
    record.recordDate = input.recordDate;

    const updatedRecord = await feedingRepository.save(record);

    return formatFeeding(updatedRecord);
};


// Delete a feeding record.
export const deleteFeedingRecord = async (
    id: number
): Promise<boolean> => {

    const record = await feedingRepository.findOneBy({ id });

    if (!record) {
        return false;
    }

    await feedingRepository.remove(record);

    return true;
};


// Partial update: Update only the fields provided.
export const patchFeedingRecord = async (
    id: number,
    input: PatchFeedingInput
): Promise<FeedingRecord | null> => {

    const record = await feedingRepository.findOneBy({ id });

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

    const updatedRecord = await feedingRepository.save(record);

    return formatFeeding(updatedRecord);
};
