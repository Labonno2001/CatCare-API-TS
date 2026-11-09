
import { Request, Response } from "express";
import { getDailyWellness } from "../wellness/wellness.service";

// Validate YYYY-MM-DD format and actual calendar date
const isValidDate = (date: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    return (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === date
    );
};

// GET daily wellness information
export const getDailyWellnessController = (
    req: Request,
    res: Response
): void => {
    const date = req.query.date;

    if (typeof date !== "string" || !isValidDate(date)) {
        res.status(400).json({
            success: false,
            message: "Please provide a valid date in YYYY-MM-DD format."
        });
        return;
    }

    const wellness = getDailyWellness(date);

    if (!wellness) {
        res.status(404).json({
            success: false,
            message: "Cat profile not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        ...wellness
    });
};
