
import { Request, Response } from "express";

import {
    getCatProfile,
    updateCatProfile
} from "../services/cat.service";

// GET cat profile
export const getCatProfileController = async (
    _req: Request,
    res: Response
): Promise<void> => {

    const cat = await getCatProfile();

    if (!cat) {
        res.status(404).json({
            success: false,
            message: "Cat profile not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: `Here is ${cat.name}'s wellness profile! 🐾`,
        cat
    });
};


// PATCH cat profile
export const updateCatProfileController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const cat = await updateCatProfile(req.body);

    if (!cat) {
        res.status(404).json({
            success: false,
            message: "Cat profile not found."
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: "Cat profile updated successfully!",
        cat
    });
};
