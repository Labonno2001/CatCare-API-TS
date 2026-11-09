
import { Request, Response } from "express";

import {
    getAllWaterRecords,
    createWaterRecord,
    getWaterSummary,
    getWaterRecordById,
    updateWaterRecord,
    deleteWaterRecord
} from "../services/water.service";

// Define the accepted water request structure
interface WaterInputBody {
    offeredMl: number | string;
    consumedMl?: number | string | null;
    measured: boolean;
    notes?: string;
}

// Safely validate an unknown request body
const isValidWaterInput = (body: unknown): body is WaterInputBody => {
    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        return false;
    }

    const input = body as Record<string, unknown>;

    const validOfferedMl =
        (typeof input.offeredMl === "number" ||
            typeof input.offeredMl === "string") &&
        Number.isFinite(Number(input.offeredMl)) &&
        Number(input.offeredMl) >= 0;

    const validNotes =
        input.notes === undefined ||
        typeof input.notes === "string";

    const validConsumedMl =
        input.measured === false ||
        (
            (typeof input.consumedMl === "number" ||
                typeof input.consumedMl === "string") &&
            Number.isFinite(Number(input.consumedMl)) &&
            Number(input.consumedMl) >= 0
        );

    return (
        validOfferedMl &&
        typeof input.measured === "boolean" &&
        validNotes &&
        validConsumedMl
    );
};

// Validate record ID
const isValidId = (id: string | string[]): boolean => {
    if (typeof id !== "string") {
        return false;
    }

    const numericId = Number(id);

    return Number.isInteger(numericId) && numericId > 0;
};

// 1. GET all water records
export const getAllWaterRecordsController = (
    _req: Request,
    res: Response
): void => {
    const records = getAllWaterRecords();

    res.status(200).json({
        success: true,
        count: records.length,
        records
    });
};

// 2. Create a water record
export const createWaterRecordController = (
    req: Request,
    res: Response
): void => {
    if (!isValidWaterInput(req.body)) {
        res.status(400).json({
            success: false,
            message: "Please enter valid water details."
        });
        return;
    }

    const {
        offeredMl,
        consumedMl,
        measured,
        notes = ""
    } = req.body;

    const record = createWaterRecord({
        offeredMl: Number(offeredMl),
        consumedMl: measured ? Number(consumedMl) : null,
        measured,
        notes
    });

    res.status(201).json({
        success: true,
        message: "Water record saved!",
        record
    });
};

// 3. Get water records summary
export const getWaterSummaryController = (
    _req: Request,
    res: Response
): void => {
    const summary = getWaterSummary();

    res.status(200).json({
        success: true,
        ...summary
    });
};

// 4. Get a water record by ID
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

// 5. Update a water record
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
            message: "Please enter valid water details."
        });
        return;
    }

    const {
        offeredMl,
        consumedMl,
        measured,
        notes = ""
    } = req.body;

    const record = updateWaterRecord(Number(req.params.id), {
        offeredMl: Number(offeredMl),
        consumedMl: measured ? Number(consumedMl) : null,
        measured,
        notes
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

// 6. Delete a water record
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
