
import { Request, Response } from "express";

import {
    getAllWaterRecords,
    createWaterRecord,
    getWaterSummary,
    getWaterRecordById,
    updateWaterRecord,
    patchWaterRecord,
    deleteWaterRecord
} from "../services/water.service";

import { PatchWaterInput } from "../types/water.types";

import {
    isValidDate,
    isValidId
} from "../utils/validation";


interface WaterInputBody {
    offeredMl: number | string;
    consumedMl?: number | string | null;
    measured: boolean;
    notes?: string;
    recordDate: string;
}


// Validate a non-negative number
const isValidNonNegativeNumber = (
    value: unknown
): boolean => {

    if (
        typeof value !== "number" &&
        typeof value !== "string"
    ) {
        return false;
    }

    if (typeof value === "string" && value.trim() === "") {
        return false;
    }

    return (
        Number.isFinite(Number(value)) &&
        Number(value) >= 0
    );
};


// Validate a complete water record (POST and PUT)
const isValidWaterInput = (
    body: unknown
): body is WaterInputBody => {

    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        return false;
    }

    const input = body as Record<string, unknown>;

    const validNotes =
        input.notes === undefined ||
        typeof input.notes === "string";

    const validConsumption =
        input.measured === true
            ? isValidNonNegativeNumber(input.consumedMl)
            : input.consumedMl === undefined ||
              input.consumedMl === null;

    return (
        isValidNonNegativeNumber(input.offeredMl) &&
        typeof input.measured === "boolean" &&
        validNotes &&
        validConsumption &&
        isValidDate(input.recordDate)
    );
};


// Validate a partial water update (PATCH)
const isValidWaterPatch = (
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
        "offeredMl",
        "consumedMl",
        "measured",
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
        input.offeredMl !== undefined &&
        !isValidNonNegativeNumber(input.offeredMl)
    ) {
        return false;
    }

    if (
        input.consumedMl !== undefined &&
        input.consumedMl !== null &&
        !isValidNonNegativeNumber(input.consumedMl)
    ) {
        return false;
    }

    if (
        input.measured !== undefined &&
        typeof input.measured !== "boolean"
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

    // Do not accept contradictory measurement information
    if (
        input.measured === false &&
        input.consumedMl !== undefined &&
        input.consumedMl !== null
    ) {
        return false;
    }

    return true;
};


// GET all water records, optionally filtered by date
export const getAllWaterRecordsController = (
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

    const records = getAllWaterRecords(date as string | undefined);

    res.status(200).json({
        success: true,
        count: records.length,
        records
    });
};


// POST a water record
export const createWaterRecordController = (
    req: Request,
    res: Response
): void => {

    if (!isValidWaterInput(req.body)) {
        res.status(400).json({
            success: false,
            message: "Please enter valid water details, including a valid record date."
        });
        return;
    }

    const {
        offeredMl,
        consumedMl,
        measured,
        notes = "",
        recordDate
    } = req.body;

    const record = createWaterRecord({
        offeredMl: Number(offeredMl),
        consumedMl: measured ? Number(consumedMl) : null,
        measured,
        notes,
        recordDate
    });

    res.status(201).json({
        success: true,
        message: "Water record saved!",
        record
    });
};


// GET water summary, optionally filtered by date
export const getWaterSummaryController = (
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

    const summary = getWaterSummary(date as string | undefined);

    res.status(200).json({
        success: true,
        ...summary
    });
};


// GET one water record by ID
export const getWaterRecordByIdController = (
    req: Request,
    res: Response
): void => {

    if (!isValidId(req.params.id)) {
        res.status(400).json({
            success: false,
            message: "Invalid water record ID."
        });
        return;
    }

    const record = getWaterRecordById(Number(req.params.id));

    if (!record) {
        res.status(404).json({
            success: false,
            message: "Water record not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        record
    });
};


// PUT: Replace all editable water fields
export const updateWaterRecordController = (
    req: Request,
    res: Response
): void => {

    if (!isValidId(req.params.id)) {
        res.status(400).json({
            success: false,
            message: "Invalid water record ID."
        });
        return;
    }

    if (!isValidWaterInput(req.body)) {
        res.status(400).json({
            success: false,
            message: "PUT requires all valid water fields."
        });
        return;
    }

    const {
        offeredMl,
        consumedMl,
        measured,
        notes = "",
        recordDate
    } = req.body;

    const record = updateWaterRecord(Number(req.params.id), {
        offeredMl: Number(offeredMl),
        consumedMl: measured ? Number(consumedMl) : null,
        measured,
        notes,
        recordDate
    });

    if (!record) {
        res.status(404).json({
            success: false,
            message: "Water record not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: "Water record updated!",
        record
    });
};


// PATCH: Update only selected water fields
export const patchWaterRecordController = (
    req: Request,
    res: Response
): void => {

    if (!isValidId(req.params.id)) {
        res.status(400).json({
            success: false,
            message: "Invalid water record ID."
        });
        return;
    }

    if (!isValidWaterPatch(req.body)) {
        res.status(400).json({
            success: false,
            message: "Please provide at least one valid water field to update."
        });
        return;
    }

    const id = Number(req.params.id);

    // Retrieve the existing record to validate the resulting state
    const existingRecord = getWaterRecordById(id);

    if (!existingRecord) {
        res.status(404).json({
            success: false,
            message: "Water record not found."
        });
        return;
    }

    const body = req.body as Record<string, unknown>;

    const input: PatchWaterInput = {};

    if (body.offeredMl !== undefined) {
        input.offeredMl = Number(body.offeredMl);
    }

    if (body.consumedMl !== undefined) {
        input.consumedMl =
            body.consumedMl === null
                ? null
                : Number(body.consumedMl);
    }

    if (body.measured !== undefined) {
        input.measured = body.measured as boolean;
    }

    if (body.notes !== undefined) {
        input.notes = body.notes as string;
    }

    if (body.recordDate !== undefined) {
        input.recordDate = body.recordDate as string;
    }

    // Validate the resulting measurement state
    const resultingMeasured =
        input.measured ?? existingRecord.measured;

    const resultingConsumed =
        input.consumedMl !== undefined
            ? input.consumedMl
            : existingRecord.consumedMl;

    if (
        resultingMeasured &&
        resultingConsumed === null
    ) {
        res.status(400).json({
            success: false,
            message: "Consumed water must be provided when measurement is enabled."
        });
        return;
    }

    if (
        !resultingMeasured &&
        input.consumedMl !== undefined &&
        input.consumedMl !== null
    ) {
        res.status(400).json({
            success: false,
            message: "Consumed water cannot be recorded when measurement is disabled."
        });
        return;
    }

    const record = patchWaterRecord(id, input);

    if (!record) {
        res.status(404).json({
            success: false,
            message: "Water record not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: "Water record updated!",
        record
    });
};


// DELETE a water record
export const deleteWaterRecordController = (
    req: Request,
    res: Response
): void => {

    if (!isValidId(req.params.id)) {
        res.status(400).json({
            success: false,
            message: "Invalid water record ID."
        });
        return;
    }

    const deleted = deleteWaterRecord(Number(req.params.id));

    if (!deleted) {
        res.status(404).json({
            success: false,
            message: "Water record not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: "Water record deleted!"
    });
};
