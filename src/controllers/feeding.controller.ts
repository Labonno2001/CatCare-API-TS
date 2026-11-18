
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

import { isValidDate } from "../utils/validation";


// Validate positive integer query parameters.
const isPositiveInteger = (value: unknown): boolean => {
    return (
        typeof value === "string" &&
        /^\d+$/.test(value) &&
        Number.isSafeInteger(Number(value)) &&
        Number(value) > 0
    );
};


// GET all feeding records.
export const getAllFeedingRecordsController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const date = req.query.date;

    if (
        date !== undefined &&
        (
            typeof date !== "string" ||
            !isValidDate(date)
        )
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid date. Use YYYY-MM-DD."
        });
        return;
    }

    const records = await getAllFeedingRecords(
        date as string | undefined
    );

    res.status(200).json({
        success: true,
        count: records.length,
        records
    });
};


// GET advanced feeding records.
export const getAdvancedFeedingRecordsController = async (
    req: Request,
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
    } = req.query;

    if (
        (startDate !== undefined &&
            (typeof startDate !== "string" || !isValidDate(startDate))) ||
        (endDate !== undefined &&
            (typeof endDate !== "string" || !isValidDate(endDate)))
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid date. Use YYYY-MM-DD."
        });
        return;
    }

    if (
        typeof startDate === "string" &&
        typeof endDate === "string" &&
        startDate > endDate
    ) {
        res.status(400).json({
            success: false,
            message: "startDate cannot be later than endDate."
        });
        return;
    }

    if (
        foodName !== undefined &&
        (typeof foodName !== "string" || !foodName.trim())
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid foodName."
        });
        return;
    }

    if (
        mealTime !== undefined &&
        (typeof mealTime !== "string" || !mealTime.trim())
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid mealTime."
        });
        return;
    }

    if (
        sortBy !== undefined &&
        !["recordDate", "quantityGrams", "foodName"].includes(sortBy as string)
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid sortBy field."
        });
        return;
    }

    if (
        order !== undefined &&
        !["ASC", "DESC"].includes(order as string)
    ) {
        res.status(400).json({
            success: false,
            message: "order must be ASC or DESC."
        });
        return;
    }

    if (
        (page !== undefined && !isPositiveInteger(page)) ||
        (limit !== undefined && !isPositiveInteger(limit))
    ) {
        res.status(400).json({
            success: false,
            message: "page and limit must be positive integers."
        });
        return;
    }

    const result = await getFeedingRecordsAdvanced({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        foodName: foodName as string | undefined,
        mealTime: mealTime as string | undefined,
        sortBy: sortBy as "recordDate" | "quantityGrams" | "foodName" | undefined,
        order: order as "ASC" | "DESC" | undefined,
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
    req: Request,
    res: Response
): Promise<void> => {

    const { startDate, endDate } = req.query;

    if (
        (startDate !== undefined &&
            (typeof startDate !== "string" || !isValidDate(startDate))) ||
        (endDate !== undefined &&
            (typeof endDate !== "string" || !isValidDate(endDate)))
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid date. Use YYYY-MM-DD."
        });
        return;
    }

    if (
        typeof startDate === "string" &&
        typeof endDate === "string" &&
        startDate > endDate
    ) {
        res.status(400).json({
            success: false,
            message: "startDate cannot be later than endDate."
        });
        return;
    }

    const groups = await getFeedingGroupedByFood(
        startDate as string | undefined,
        endDate as string | undefined
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
    req: Request,
    res: Response
): Promise<void> => {

    const date = req.query.date;

    if (
        date !== undefined &&
        (
            typeof date !== "string" ||
            !isValidDate(date)
        )
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid date. Use YYYY-MM-DD."
        });
        return;
    }

    const summary = await getFeedingSummary(
        date as string | undefined
    );

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
