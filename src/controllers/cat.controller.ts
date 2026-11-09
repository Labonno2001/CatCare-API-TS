import { Request, Response } from "express";
import { getCatProfile } from "../services/cat.service";

export const getCatProfileController = (
    _req: Request,
    res: Response
): void => {
    const cat = getCatProfile();

    if (!cat) {
        res.status(404).json({
            success: false,
            message: "Cat profile not found"
        });
        return;
    }

    res.status(200).json({
        success: true,
        data: cat
    });
};