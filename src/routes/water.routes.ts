
import { Router } from "express";

import {
    getAllWaterRecordsController,
    createWaterRecordController,
    getWaterSummaryController,
    getWaterRecordByIdController,
    updateWaterRecordController,
    deleteWaterRecordController
} from "../controllers/water.controller";

const router = Router();

// GET water summary
router.get("/summary", getWaterSummaryController);

// GET all water records
router.get("/", getAllWaterRecordsController);

// POST a new water record
router.post("/", createWaterRecordController);

// GET a specific water record
router.get("/:id", getWaterRecordByIdController);

// PATCH an existing water record
router.patch("/:id", updateWaterRecordController);

// DELETE a water record
router.delete("/:id", deleteWaterRecordController);

export default router;
