
import { Request, Response } from "express";

import {
    getAllFeedingRecords,
    createFeedingRecord,
    getFeedingSummary,
    getFeedingRecordById,
    updateFeedingRecord,
    patchFeedingRecord,
    deleteFeedingRecord
} from "../services/feeding.service";

import { PatchFeedingInput } from "../types/feeding.types";

import {
    isValidDate,
    isValidId
} from "../utils/validation";


interface FeedingInputBody {
    foodName: string;
    quantityGrams: number | string;
    mealTime: string;
    notes?: string;
    recordDate: string;
}


// Validate a complete feeding record (PUT and POST)
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
            (typeof input.quantityGrams === "string" &&
                input.quantityGrams.trim() !== "")) &&
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


// Validate a partial feeding update (PATCH)
const isValidFeedingPatch = (
    body: unknown
): body is Record<string, unknown> => {

    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        return false;
    }

    const input = body as Record<string, unknown>;
    const keys = Object.keys(input);

    const allowedFields = [
        "foodName",
        "quantityGrams",
        "mealTime",
        "notes",
        "recordDate"
    ];

    if (
        keys.length === 0 ||
        keys.some(key => !allowedFields.includes(key))
    ) {
        return false;
    }

    if (
        input.foodName !== undefined &&
        (
            typeof input.foodName !== "string" ||
            input.foodName.trim().length === 0
        )
    ) {
        return false;
    }

    if (
        input.quantityGrams !== undefined &&
        (
            !(
                typeof input.quantityGrams === "number" ||
                (
                    typeof input.quantityGrams === "string" &&
                    input.quantityGrams.trim() !== ""
                )
            ) ||
            !Number.isFinite(Number(input.quantityGrams)) ||
            Number(input.quantityGrams) <= 0
        )
    ) {
        return false;
    }

    if (
        input.mealTime !== undefined &&
        (
            typeof input.mealTime !== "string" ||
            input.mealTime.trim().length === 0
        )
    ) {
        return false;
    }

    if (
        input.notes !== undefined &&
        typeof input.notes !== "string"
    ) {
        return false;
    }

    if (
        input.recordDate !== undefined &&
        !isValidDate(input.recordDate)
    ) {
        return false;
    }

    return true;
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


// PUT: Replace all editable feeding fields
export const updateFeedingRecordController = (
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

    if (!isValidFeedingInput(req.body)) {
        res.status(400).json({
            success: false,
            message: "PUT requires all valid feeding fields."
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


// PATCH: Update only selected feeding fields
export const patchFeedingRecordController = (
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

    if (!isValidFeedingPatch(req.body)) {
        res.status(400).json({
            success: false,
            message: "Please provide at least one valid feeding field to update."
        });
        return;
    }

    const body = req.body as Record<string, unknown>;

    const input: PatchFeedingInput = {};

    if (body.foodName !== undefined) {
        input.foodName = body.foodName as string;
    }

    if (body.quantityGrams !== undefined) {
        input.quantityGrams = Number(body.quantityGrams);
    }

    if (body.mealTime !== undefined) {
        input.mealTime = body.mealTime as string;
    }

    if (body.notes !== undefined) {
        input.notes = body.notes as string;
    }

    if (body.recordDate !== undefined) {
        input.recordDate = body.recordDate as string;
    }

    const record = patchFeedingRecord(
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
