import { Request, Response } from "express";

import {
    getAllFeedingRecords,
    createFeedingRecord,
    getFeedingSummary,
    getFeedingRecordById,
    updateFeedingRecord,
    deleteFeedingRecord
} from "../services/feeding.service";

interface FeedingInputBody {
    foodName: string;
    quantityGrams: number | string;
    mealTime: string;
    notes?: string;
    recordDate: string;
}

// Validate YYYY-MM-DD and reject impossible dates
const isValidDate = (date: unknown): date is string => {
    if (typeof date !== "string") return false;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

    const parsed = new Date(`${date}T00:00:00.000Z`);

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date
    );
};

const isValidFeedingInput = (
    body: unknown
): body is FeedingInputBody => {
    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        return false;
    }

    const input = body as Record<string, unknown>;

    const validQuantity =
        (typeof input.quantityGrams === "number" ||
            typeof input.quantityGrams === "string") &&
        Number.isFinite(Number(input.quantityGrams)) &&
        Number(input.quantityGrams) > 0;

    return (
        typeof input.foodName === "string" &&
        input.foodName.trim().length > 0 &&
        validQuantity &&
        typeof input.mealTime === "string" &&
        input.mealTime.trim().length > 0 &&
        (input.notes === undefined ||
            typeof input.notes === "string") &&
        isValidDate(input.recordDate)
    );
};

const isValidId = (id: string | string[]): boolean => {
    if (typeof id !== "string") return false;

    const numericId = Number(id);

    return Number.isInteger(numericId) && numericId > 0;
};

// GET all feeding records, optionally filtered by date
export const getAllFeedingRecordsController = (
    req: Request,
    res: Response
): void => {
    const date = req.query.date;

    if (date !== undefined && !isValidDate(date)) {
        res.status(400).json({
            success: false,
            message: "Invalid date. Use YYYY-MM-DD."
        });
        return;
    }

    const records = getAllFeedingRecords(date as string | undefined);

    res.status(200).json({
        success: true,
        count: records.length,
        records
    });
};

// POST a feeding record
export const createFeedingRecordController = (
    req: Request,
    res: Response
): void => {
    if (!isValidFeedingInput(req.body)) {
        res.status(400).json({
            success: false,
            message: "Please enter valid feeding details, including a valid record date."
        });
        return;
    }

    const {
        foodName,
        quantityGrams,
        mealTime,
        notes = "",
        recordDate
    } = req.body;

    const record = createFeedingRecord({
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

// GET feeding summary, optionally filtered by date
export const getFeedingSummaryController = (
    req: Request,
    res: Response
): void => {
    const date = req.query.date;

    if (date !== undefined && !isValidDate(date)) {
        res.status(400).json({
            success: false,
            message: "Invalid date. Use YYYY-MM-DD."
        });
        return;
    }

    const summary = getFeedingSummary(date as string | undefined);

    res.status(200).json({
        success: true,
        ...summary
    });
};

// GET one feeding record by ID
export const getFeedingRecordByIdController = (
    req: Request,
    res: Response
): void => {
    if (!isValidId(req.params.id)) {
        res.status(400).json({
            success: false,
            message: "Invalid feeding record ID."
        });
        return;
    }

    const record = getFeedingRecordById(Number(req.params.id));

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

// PATCH a feeding record
export const updateFeedingRecordController = (
    req: Request,
    res: Response
): void => {
    if (
        !isValidId(req.params.id) ||
        !isValidFeedingInput(req.body)
    ) {
        res.status(400).json({
            success: false,
            message: "Please enter valid feeding details."
        });
        return;
    }

    const {
        foodName,
        quantityGrams,
        mealTime,
        notes = "",
        recordDate
    } = req.body;

    const record = updateFeedingRecord(Number(req.params.id), {
        foodName,
        quantityGrams: Number(quantityGrams),
        mealTime,
        notes,
        recordDate
    });

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

// DELETE a feeding record
export const deleteFeedingRecordController = (
    req: Request,
    res: Response
): void => {
    if (!isValidId(req.params.id)) {
        res.status(400).json({
            success: false,
            message: "Invalid feeding record ID."
        });
        return;
    }

    const deleted = deleteFeedingRecord(Number(req.params.id));

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