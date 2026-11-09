
import { Request, Response } from "express";

import {
    getAllFeedingRecords,
    createFeedingRecord,
    getFeedingSummary,
    getFeedingRecordById,
    updateFeedingRecord,
    deleteFeedingRecord
} from "../services/feeding.service";

// Validate feeding input
const isValidFeedingInput = (body: any): boolean => {
    return (
        typeof body.foodName === "string" &&
        !!body.foodName.trim() &&
        body.quantityGrams !== undefined &&
        Number.isFinite(Number(body.quantityGrams)) &&
        Number(body.quantityGrams) > 0 &&
        typeof body.mealTime === "string" &&
        !!body.mealTime.trim() &&
        (body.notes === undefined || typeof body.notes === "string")
    );
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
    if (!req.body || !isValidFeedingInput(req.body)) {
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
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({
            success: false,
            message: "Invalid feeding record ID."
        });
        return;
    }

    const record = getFeedingRecordById(id);

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
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({
            success: false,
            message: "Please enter valid feeding details."
        });
        return;
    }

    if (!req.body || !isValidFeedingInput(req.body)) {
        res.status(400).json({
            success: false,
            message: "Please enter valid feeding details."
        });
        return;
    }

    const { foodName, quantityGrams, mealTime, notes = "" } = req.body;

    const record = updateFeedingRecord(id, {
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
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({
            success: false,
            message: "Invalid feeding record ID."
        });
        return;
    }

    const deleted = deleteFeedingRecord(id);

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
