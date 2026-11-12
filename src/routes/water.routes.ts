
import { Router } from "express";

import {
    getAllWaterRecordsController,
    createWaterRecordController,
    getWaterSummaryController,
    getWaterRecordByIdController,
    updateWaterRecordController,
    patchWaterRecordController,
    deleteWaterRecordController
} from "../controllers/water.controller";

const router = Router();

// GET water summary
router.get("/summary", getWaterSummaryController);

// GET all water records
router.get("/", getAllWaterRecordsController);

// POST a new water record
router.post("/", createWaterRecordController);

// GET one water record by ID
router.get("/:id", getWaterRecordByIdController);

// PUT: Replace the complete water record
router.put("/:id", updateWaterRecordController);

// PATCH: Update selected water fields
router.patch("/:id", patchWaterRecordController);

// DELETE a water record
router.delete("/:id", deleteWaterRecordController);

export default router;
