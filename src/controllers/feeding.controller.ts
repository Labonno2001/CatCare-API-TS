
import { Request, Response } from "express";

import {
    getAllFeedingRecords,
    createFeedingRecord,
    getFeedingSummary,
    getFeedingRecordById,
    updateFeedingRecord,
    deleteFeedingRecord
} from "../services/feeding.service";

// Define the accepted request body structure
interface FeedingInputBody {
    foodName: string;
    quantityGrams: number | string;
    mealTime: string;
    notes?: string;
}

// Safely check whether an unknown value is a valid feeding request
const isValidFeedingInput = (body: unknown): body is FeedingInputBody => {
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
        (input.notes === undefined || typeof input.notes === "string")
    );
};

const isValidId = (id: string | string[]): boolean => {
    if (typeof id !== "string") {
        return false;
    }

    const numericId = Number(id);

    return Number.isInteger(numericId) && numericId > 0;
};
// 1. GET all feeding records
export const getAllFeedingRecordsController = (
    _req: Request,
    res: Response
): void => {
    const records = getAllFeedingRecords();

    res.status(200).json({
        success: true,
        count: records.length,
        records
    });
};

// 2. POST a feeding record
export const createFeedingRecordController = (
    req: Request,
    res: Response
): void => {
    if (!isValidFeedingInput(req.body)) {
        res.status(400).json({
            success: false,
            message: "Please enter valid feeding details."
        });
        return;
    }

    const { foodName, quantityGrams, mealTime, notes = "" } = req.body;

    const record = createFeedingRecord({
        foodName,
        quantityGrams: Number(quantityGrams),
        mealTime,
        notes
    });

    res.status(201).json({
        success: true,
        message: "Feeding record saved!",
        record
    });
};

// 3. GET feeding summary
export const getFeedingSummaryController = (
    _req: Request,
    res: Response
): void => {
    const summary = getFeedingSummary();

    res.status(200).json({
        success: true,
        ...summary
    });
};

// 4. GET one feeding record by ID
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

// 5. PATCH a feeding record
export const updateFeedingRecordController = (
    req: Request,
    res: Response
): void => {
    if (!isValidId(req.params.id) || !isValidFeedingInput(req.body)) {
        res.status(400).json({
            success: false,
            message: "Please enter valid feeding details."
        });
        return;
    }

    const { foodName, quantityGrams, mealTime, notes = "" } = req.body;

    const record = updateFeedingRecord(Number(req.params.id), {
        foodName,
        quantityGrams: Number(quantityGrams),
        mealTime,
        notes
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

// 6. DELETE a feeding record
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
