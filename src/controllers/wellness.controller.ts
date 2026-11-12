
import { Request, Response } from "express";
import { getDailyWellness } from "../wellness/wellness.service";
import { isValidDate } from "../utils/validation";

// GET daily wellness information
export const getDailyWellnessController = (
    req: Request,
    res: Response
): void => {
    const date = req.query.date;

    if (!isValidDate(date)) {
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
