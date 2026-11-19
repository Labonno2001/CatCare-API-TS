
import { Request, Response } from "express";

import {
    getAllWaterRecords,
    createWaterRecord,
    getWaterSummary,
    getWaterRecordById,
    updateWaterRecord,
    patchWaterRecord,
    deleteWaterRecord,
    getAdvancedWaterRecords,
    getWaterGrouped,
    getWaterDailyTarget,
    saveWaterDailyTarget,
    WaterQueryOptions,
    WaterPatchValidationError
} from "../services/water.service";

import {
    CreateWaterInput,
    PatchWaterInput,
    CreateWaterDailyTargetInput
} from "../types/water.types";

// --------------------------------------------------
// GET all water records
// --------------------------------------------------

export const getAllWaterRecordsController = async (
    _req: Request,
    res: Response
): Promise<void> => {

    const { date } = res.locals.validatedQuery;

    const allRecords = await getAllWaterRecords();

    const records = date
        ? allRecords.filter(record => record.recordDate === date)
        : allRecords;

    res.status(200).json({
        success: true,
        count: records.length,
        records
    });
};

// --------------------------------------------------
// POST water consumption record
// --------------------------------------------------

export const createWaterRecordController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const body = req.body;

    const input: CreateWaterInput = {
        consumedMl: body.measured ? body.consumedMl : null,
        measured: body.measured,
        notes: body.notes ?? "",
        recordDate: body.recordDate
    };

    const record = await createWaterRecord(input);

    res.status(201).json({
        success: true,
        message: "Water record saved!",
        record
    });
};

// --------------------------------------------------
// GET water daily target
// --------------------------------------------------

export const getWaterDailyTargetController = async (
    _req: Request,
    res: Response
): Promise<void> => {

    const { date } = res.locals.validatedQuery;

    const target = await getWaterDailyTarget(date);

    res.status(200).json({
        success: true,
        target
    });
};

// --------------------------------------------------
// PUT water daily target
// --------------------------------------------------

export const saveWaterDailyTargetController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const { offeredMl, recordDate } = req.body;

    const input: CreateWaterDailyTargetInput = {
        offeredMl,
        recordDate
    };

    const target = await saveWaterDailyTarget(input);

    res.status(200).json({
        success: true,
        message: "Daily offered water target saved!",
        target
    });
};

// --------------------------------------------------
// GET water summary for a specific date
// --------------------------------------------------

export const getWaterSummaryController = async (
    _req: Request,
    res: Response
): Promise<void> => {

    const { date } = res.locals.validatedQuery;

    const summary = await getWaterSummary(date);

    res.status(200).json({
        success: true,
        ...summary
    });
};

// --------------------------------------------------
// GET one water record
// --------------------------------------------------

export const getWaterRecordByIdController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const record = await getWaterRecordById(Number(req.params.id));

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

// --------------------------------------------------
// PUT water record
// --------------------------------------------------

export const updateWaterRecordController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const body = req.body;

    const input: CreateWaterInput = {
        consumedMl: body.measured ? body.consumedMl : null,
        measured: body.measured,
        notes: body.notes ?? "",
        recordDate: body.recordDate
    };

    const record = await updateWaterRecord(
        Number(req.params.id),
        input
    );

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

// --------------------------------------------------
// PATCH water record
// --------------------------------------------------

export const patchWaterRecordController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const body = req.body;

    const input: PatchWaterInput = {};

    if (body.consumedMl !== undefined) {
        input.consumedMl = body.consumedMl;
    }

    if (body.measured !== undefined) {
        input.measured = body.measured;
    }

    if (body.notes !== undefined) {
        input.notes = body.notes;
    }

    if (body.recordDate !== undefined) {
        input.recordDate = body.recordDate;
    }

    try {
        const record = await patchWaterRecord(
            Number(req.params.id),
            input
        );

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

    } catch (error) {

        if (error instanceof WaterPatchValidationError) {
            res.status(400).json({
                success: false,
                message: error.message
            });
            return;
        }

        throw error;
    }
};

// --------------------------------------------------
// DELETE water record
// --------------------------------------------------

export const deleteWaterRecordController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const deleted = await deleteWaterRecord(Number(req.params.id));

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

// --------------------------------------------------
// GET advanced water records
// --------------------------------------------------

export const getAdvancedWaterRecordsController = async (
    _req: Request,
    res: Response
): Promise<void> => {

    const {
        startDate,
        endDate,
        measured,
        minConsumedMl,
        maxConsumedMl,
        sortBy,
        order,
        page,
        limit
    } = res.locals.validatedQuery;

    const measuredValue: boolean | undefined =
        measured === undefined
            ? undefined
            : measured === "true";

    const options: WaterQueryOptions = {
        startDate,
        endDate,
        measured: measuredValue,
        minConsumedMl: minConsumedMl === undefined
            ? undefined
            : Number(minConsumedMl),
        maxConsumedMl: maxConsumedMl === undefined
            ? undefined
            : Number(maxConsumedMl),
        sortBy,
        order,
        page: page === undefined ? 1 : Number(page),
        limit: limit === undefined ? 10 : Number(limit)
    };

    const result = await getAdvancedWaterRecords(options);

    res.status(200).json({
        success: true,
        ...result
    });
};

// --------------------------------------------------
// GET water records grouped by measurement status
// --------------------------------------------------

export const getWaterGroupedController = async (
    _req: Request,
    res: Response
): Promise<void> => {

    const { startDate, endDate } = res.locals.validatedQuery;

    const groups = await getWaterGrouped(
        startDate,
        endDate
    );

    res.status(200).json({
        success: true,
        groups
    });
};
