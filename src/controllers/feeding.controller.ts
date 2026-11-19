
import { Request, Response } from "express";

import {
    getAllFeedingRecords,
    createFeedingRecord,
    getFeedingSummary,
    getFeedingRecordById,
    updateFeedingRecord,
    patchFeedingRecord,
    deleteFeedingRecord,
    getFeedingRecordsAdvanced,
    getFeedingGroupedByFood
} from "../services/feeding.service";

import { PatchFeedingInput } from "../types/feeding.types";


// GET all feeding records.
export const getAllFeedingRecordsController = async (
    _req: Request,
    res: Response
): Promise<void> => {

    const { date } = res.locals.validatedQuery;

    const records = await getAllFeedingRecords(date);

    res.status(200).json({
        success: true,
        count: records.length,
        records
    });
};


// GET advanced feeding records.
export const getAdvancedFeedingRecordsController = async (
    _req: Request,
    res: Response
): Promise<void> => {

    const {
        startDate,
        endDate,
        foodName,
        mealTime,
        sortBy,
        order,
        page,
        limit
    } = res.locals.validatedQuery;

    const result = await getFeedingRecordsAdvanced({
        startDate,
        endDate,
        foodName,
        mealTime,
        sortBy,
        order,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
    });

    res.status(200).json({
        success: true,
        ...result
    });
};


// GET feeding records grouped by food.
export const getFeedingGroupedByFoodController = async (
    _req: Request,
    res: Response
): Promise<void> => {

    const { startDate, endDate } = res.locals.validatedQuery;

    const groups = await getFeedingGroupedByFood(
        startDate,
        endDate
    );

    res.status(200).json({
        success: true,
        groups
    });
};


// POST a feeding record.
export const createFeedingRecordController = async (
    req: Request,
    res: Response
): Promise<void> => {

    // Request body has already been validated by Zod middleware.
    const {
        foodName,
        quantityGrams,
        mealTime,
        notes = "",
        recordDate
    } = req.body;

    const record = await createFeedingRecord({
        foodName,
        quantityGrams: Number(quantityGrams),
        mealTime,
        notes,
        recordDate
    });

    res.status(201).json({
        success: true,
        message: "Feeding record saved!",
        record
    });
};


// GET feeding summary.
export const getFeedingSummaryController = async (
    _req: Request,
    res: Response
): Promise<void> => {

    const { date } = res.locals.validatedQuery;

    const summary = await getFeedingSummary(date);

    res.status(200).json({
        success: true,
        ...summary
    });
};


// GET one feeding record by ID.
export const getFeedingRecordByIdController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const record = await getFeedingRecordById(
        Number(req.params.id)
    );

    if (!record) {
        res.status(404).json({
            success: false,
            message: "Feeding record not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        record
    });
};


// PUT: Replace all editable feeding fields.
export const updateFeedingRecordController = async (
    req: Request,
    res: Response
): Promise<void> => {

    // Request body has already been validated by Zod middleware.
    const {
        foodName,
        quantityGrams,
        mealTime,
        notes = "",
        recordDate
    } = req.body;

    const record = await updateFeedingRecord(
        Number(req.params.id),
        {
            foodName,
            quantityGrams: Number(quantityGrams),
            mealTime,
            notes,
            recordDate
        }
    );

    if (!record) {
        res.status(404).json({
            success: false,
            message: "Feeding record not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: "Feeding record updated!",
        record
    });
};


// PATCH: Update selected feeding fields.
export const patchFeedingRecordController = async (
    req: Request,
    res: Response
): Promise<void> => {

    // Request body has already been validated by Zod middleware.
    const body = req.body as Record<string, unknown>;
    const input: PatchFeedingInput = {};

    if (body.foodName !== undefined) input.foodName = body.foodName as string;
    if (body.quantityGrams !== undefined) input.quantityGrams = Number(body.quantityGrams);
    if (body.mealTime !== undefined) input.mealTime = body.mealTime as string;
    if (body.notes !== undefined) input.notes = body.notes as string;
    if (body.recordDate !== undefined) input.recordDate = body.recordDate as string;

    const record = await patchFeedingRecord(
        Number(req.params.id),
        input
    );

    if (!record) {
        res.status(404).json({
            success: false,
            message: "Feeding record not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: "Feeding record updated!",
        record
    });
};


// DELETE a feeding record.
export const deleteFeedingRecordController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const deleted = await deleteFeedingRecord(
        Number(req.params.id)
    );

    if (!deleted) {
        res.status(404).json({
            success: false,
            message: "Feeding record not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: "Feeding record deleted!"
    });
};
