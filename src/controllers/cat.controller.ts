
import { Request, Response } from "express";

import {
    getCatProfile,
    updateCatProfile,
    UpdateCatProfileInput
} from "../services/cat.service";

// Validate partial cat profile updates
const isValidCatProfileInput = (
    body: unknown
): body is UpdateCatProfileInput => {
    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        return false;
    }

    const input = body as Record<string, unknown>;

    const allowedFields = [
        "name",
        "age",
        "weightKg",
        "favoriteFood",
        "activity"
    ];

    const keys = Object.keys(input);

    if (
        keys.length === 0 ||
        keys.some((key) => !allowedFields.includes(key))
    ) {
        return false;
    }

    if (
        input.name !== undefined &&
        (typeof input.name !== "string" || !input.name.trim())
    ) {
        return false;
    }

    if (
        input.age !== undefined &&
        (
            typeof input.age !== "number" ||
            !Number.isFinite(input.age) ||
            input.age < 0
        )
    ) {
        return false;
    }

    if (
        input.weightKg !== undefined &&
        (
            typeof input.weightKg !== "number" ||
            !Number.isFinite(input.weightKg) ||
            input.weightKg <= 0
        )
    ) {
        return false;
    }

    if (
        input.favoriteFood !== undefined &&
        (
            typeof input.favoriteFood !== "string" ||
            !input.favoriteFood.trim()
        )
    ) {
        return false;
    }

    if (
        input.activity !== undefined &&
        (
            typeof input.activity !== "string" ||
            !input.activity.trim()
        )
    ) {
        return false;
    }

    return true;
};

// GET cat profile
export const getCatProfileController = (
    _req: Request,
    res: Response
): void => {
    const cat = getCatProfile();

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
export const updateCatProfileController = (
    req: Request,
    res: Response
): void => {
    if (!isValidCatProfileInput(req.body)) {
        res.status(400).json({
            success: false,
            message: "Please enter valid cat profile details."
        });
        return;
    }

    const cat = updateCatProfile(req.body);

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
