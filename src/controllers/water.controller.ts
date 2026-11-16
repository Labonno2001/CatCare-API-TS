
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
    WaterQueryOptions
} from "../services/water.service";

import {
    CreateWaterInput,
    PatchWaterInput,
    CreateWaterDailyTargetInput
} from "../types/water.types";

import {
    isValidDate,
    isValidId
} from "../utils/validation";

// --------------------------------------------------
// Validation helpers
// --------------------------------------------------

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);

const isValidNonNegativeNumber = (value: unknown): boolean =>
    (typeof value === "number" ||
        (typeof value === "string" && value.trim() !== "")) &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0;

const isPositiveInteger = (value: unknown): boolean =>
    typeof value === "string" &&
    /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) > 0;

// --------------------------------------------------
// Validate complete water consumption record
// --------------------------------------------------

const isValidWaterInput = (
    body: unknown
): body is Record<string, unknown> => {
    if (!isObject(body)) {
        return false;
    }

    const validConsumption =
        body.measured === true
            ? isValidNonNegativeNumber(body.consumedMl)
            : body.consumedMl === undefined ||
              body.consumedMl === null;

    return (
        typeof body.measured === "boolean" &&
        validConsumption &&
        (body.notes === undefined || typeof body.notes === "string") &&
        typeof body.recordDate === "string" &&
        isValidDate(body.recordDate)
    );
};

// --------------------------------------------------
// Validate partial water record update
// --------------------------------------------------

const isValidWaterPatch = (
    body: unknown
): body is Record<string, unknown> => {
    if (!isObject(body)) {
        return false;
    }

    const keys = Object.keys(body);

    const allowedFields = [
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
        body.consumedMl !== undefined &&
        body.consumedMl !== null &&
        !isValidNonNegativeNumber(body.consumedMl)
    ) {
        return false;
    }

    if (
        body.measured !== undefined &&
        typeof body.measured !== "boolean"
    ) {
        return false;
    }

    if (
        body.notes !== undefined &&
        typeof body.notes !== "string"
    ) {
        return false;
    }

    if (
        body.recordDate !== undefined &&
        (typeof body.recordDate !== "string" ||
            !isValidDate(body.recordDate))
    ) {
        return false;
    }

    if (
        body.measured === false &&
        body.consumedMl !== undefined &&
        body.consumedMl !== null
    ) {
        return false;
    }

    return true;
};

// --------------------------------------------------
// GET all water records
// --------------------------------------------------

export const getAllWaterRecordsController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const date = req.query.date;

    if (
        date !== undefined &&
        (typeof date !== "string" || !isValidDate(date))
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid date. Use YYYY-MM-DD."
        });
        return;
    }

    const allRecords = await getAllWaterRecords();

    const records = typeof date === "string"
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
    if (!isValidWaterInput(req.body)) {
        res.status(400).json({
            success: false,
            message: "Please provide valid water consumption details."
        });
        return;
    }

    const body = req.body;

    const input: CreateWaterInput = {
        consumedMl: body.measured ? Number(body.consumedMl) : null,
        measured: body.measured as boolean,
        notes: (body.notes as string | undefined) ?? "",
        recordDate: body.recordDate as string
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
// GET /api/water/daily-target?date=YYYY-MM-DD
// --------------------------------------------------

export const getWaterDailyTargetController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const date = req.query.date;

    if (
        typeof date !== "string" ||
        !isValidDate(date)
    ) {
        res.status(400).json({
            success: false,
            message: "A valid date is required. Use YYYY-MM-DD."
        });
        return;
    }

    const target = await getWaterDailyTarget(date);

    res.status(200).json({
        success: true,
        target
    });
};

// --------------------------------------------------
// PUT water daily target
// PUT /api/water/daily-target
// --------------------------------------------------

export const saveWaterDailyTargetController = async (
    req: Request,
    res: Response
): Promise<void> => {
    if (!isObject(req.body)) {
        res.status(400).json({
            success: false,
            message: "Invalid request body."
        });
        return;
    }

    const { offeredMl, recordDate } = req.body;

    if (
        !isValidNonNegativeNumber(offeredMl) ||
        typeof recordDate !== "string" ||
        !isValidDate(recordDate)
    ) {
        res.status(400).json({
            success: false,
            message: "Provide a valid offeredMl and recordDate."
        });
        return;
    }

    const input: CreateWaterDailyTargetInput = {
        offeredMl: Number(offeredMl),
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
    req: Request,
    res: Response
): Promise<void> => {
    const date = req.query.date;

    // A daily summary must always have a specific date.
    if (typeof date !== "string" || !isValidDate(date)) {
        res.status(400).json({
            success: false,
            message: "A valid date is required. Use YYYY-MM-DD."
        });
        return;
    }

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
    if (!isValidId(req.params.id)) {
        res.status(400).json({
            success: false,
            message: "Invalid water record ID."
        });
        return;
    }

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
            message: "PUT requires valid water consumption fields."
        });
        return;
    }

    const body = req.body;

    const input: CreateWaterInput = {
        consumedMl: body.measured ? Number(body.consumedMl) : null,
        measured: body.measured as boolean,
        notes: (body.notes as string | undefined) ?? "",
        recordDate: body.recordDate as string
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
            message: "Provide at least one valid field to update."
        });
        return;
    }

    const existingRecord = await getWaterRecordById(
        Number(req.params.id)
    );

    if (!existingRecord) {
        res.status(404).json({
            success: false,
            message: "Water record not found."
        });
        return;
    }

    const body = req.body;
    const input: PatchWaterInput = {};

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

    const resultingMeasured =
        input.measured ?? existingRecord.measured;

    const resultingConsumed =
        input.measured === false
            ? null
            : input.consumedMl !== undefined
                ? input.consumedMl
                : existingRecord.consumedMl;

    if (resultingMeasured && resultingConsumed === null) {
        res.status(400).json({
            success: false,
            message: "Consumed water is required when measurement is enabled."
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
};

// --------------------------------------------------
// DELETE water record
// --------------------------------------------------

export const deleteWaterRecordController = async (
    req: Request,
    res: Response
): Promise<void> => {
    if (!isValidId(req.params.id)) {
        res.status(400).json({
            success: false,
            message: "Invalid water record ID."
        });
        return;
    }

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
    req: Request,
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
    } = req.query;

    const queryValues = [
        startDate,
        endDate,
        measured,
        minConsumedMl,
        maxConsumedMl,
        sortBy,
        order,
        page,
        limit
    ];

    if (queryValues.some(
        value => value !== undefined && typeof value !== "string"
    )) {
        res.status(400).json({
            success: false,
            message: "Each query parameter must have one value."
        });
        return;
    }

    if (
        startDate !== undefined &&
        !isValidDate(startDate)
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid startDate. Use YYYY-MM-DD."
        });
        return;
    }

    if (
        endDate !== undefined &&
        !isValidDate(endDate)
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid endDate. Use YYYY-MM-DD."
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

    let measuredValue: boolean | undefined;

    if (measured !== undefined) {
        if (measured !== "true" && measured !== "false") {
            res.status(400).json({
                success: false,
                message: "measured must be true or false."
            });
            return;
        }

        measuredValue = measured === "true";
    }

    let minConsumedValue: number | undefined;
    let maxConsumedValue: number | undefined;

    if (minConsumedMl !== undefined) {
        if (!isValidNonNegativeNumber(minConsumedMl)) {
            res.status(400).json({
                success: false,
                message: "minConsumedMl must be a non-negative number."
            });
            return;
        }

        minConsumedValue = Number(minConsumedMl);
    }

    if (maxConsumedMl !== undefined) {
        if (!isValidNonNegativeNumber(maxConsumedMl)) {
            res.status(400).json({
                success: false,
                message: "maxConsumedMl must be a non-negative number."
            });
            return;
        }

        maxConsumedValue = Number(maxConsumedMl);
    }

    if (
        minConsumedValue !== undefined &&
        maxConsumedValue !== undefined &&
        minConsumedValue > maxConsumedValue
    ) {
        res.status(400).json({
            success: false,
            message: "minConsumedMl cannot be greater than maxConsumedMl."
        });
        return;
    }

    const allowedSortFields = [
        "recordDate",
        "consumedMl",
        "createdAt"
    ];

    if (
        sortBy !== undefined &&
        !allowedSortFields.includes(sortBy as string)
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid sortBy field."
        });
        return;
    }

    if (
        order !== undefined &&
        order !== "ASC" &&
        order !== "DESC"
    ) {
        res.status(400).json({
            success: false,
            message: "order must be ASC or DESC."
        });
        return;
    }

    if (page !== undefined && !isPositiveInteger(page)) {
        res.status(400).json({
            success: false,
            message: "page must be a positive integer."
        });
        return;
    }

    if (
        limit !== undefined &&
        (!isPositiveInteger(limit) || Number(limit) > 100)
    ) {
        res.status(400).json({
            success: false,
            message: "limit must be between 1 and 100."
        });
        return;
    }

    const options: WaterQueryOptions = {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        measured: measuredValue,
        minConsumedMl: minConsumedValue,
        maxConsumedMl: maxConsumedValue,
        sortBy: sortBy as WaterQueryOptions["sortBy"],
        order: order as WaterQueryOptions["order"],
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

    const groups = await getWaterGrouped(
        startDate as string | undefined,
        endDate as string | undefined
    );

    res.status(200).json({
        success: true,
        groups
    });
};
