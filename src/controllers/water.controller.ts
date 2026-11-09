import { Request, Response } from "express";

import {
    getAllWaterRecords,
    createWaterRecord,
    getWaterSummary,
    getWaterRecordById,
    updateWaterRecord,
    deleteWaterRecord
} from "../services/water.service";

interface WaterInputBody {
    offeredMl: number | string;
    consumedMl?: number | string | null;
    measured: boolean;
    notes?: string;
    recordDate: string;
}

const isValidDate = (date: unknown): date is string => {
    if (typeof date !== "string") return false;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

    const parsed = new Date(`${date}T00:00:00.000Z`);

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date
    );
};

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
        validConsumedMl &&
        isValidDate(input.recordDate)
    );
};

const isValidId = (id: string | string[]): boolean => {
    if (typeof id !== "string") return false;

    const numericId = Number(id);

    return Number.isInteger(numericId) && numericId > 0;
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

// PATCH a water record
export const updateWaterRecordController = (
    req: Request,
    res: Response
): void => {
    if (
        !isValidId(req.params.id) ||
        !isValidWaterInput(req.body)
    ) {
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