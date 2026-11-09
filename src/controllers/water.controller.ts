
import { Request, Response } from "express";

import {
    getAllWaterRecords,
    createWaterRecord,
    getWaterSummary,
    getWaterRecordById,
    updateWaterRecord,
    deleteWaterRecord
} from "../services/water.service";

// Validate water record input
const isValidWaterInput = (body: any): boolean => {
    return (
        body.offeredMl !== undefined &&
        Number.isFinite(Number(body.offeredMl)) &&
        Number(body.offeredMl) >= 0 &&
        typeof body.measured === "boolean" &&
        (body.notes === undefined || typeof body.notes === "string") &&
        (
            body.measured === false ||
            (
                body.consumedMl !== undefined &&
                body.consumedMl !== null &&
                body.consumedMl !== "" &&
                Number.isFinite(Number(body.consumedMl)) &&
                Number(body.consumedMl) >= 0
            )
        )
    );
};

// 1. Get all water records
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
    if (!req.body || !isValidWaterInput(req.body)) {
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
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({
            success: false,
            message: "Invalid water record ID."
        });
        return;
    }

    const record = getWaterRecordById(id);

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
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({
            success: false,
            message: "Invalid water record ID."
        });
        return;
    }

    if (!req.body || !isValidWaterInput(req.body)) {
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

    const record = updateWaterRecord(id, {
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
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({
            success: false,
            message: "Invalid water record ID."
        });
        return;
    }

    const deleted = deleteWaterRecord(id);

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
