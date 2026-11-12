
import { Router } from "express";

import {
    getAllFeedingRecordsController,
    createFeedingRecordController,
    getFeedingSummaryController,
    getFeedingRecordByIdController,
    updateFeedingRecordController,
    patchFeedingRecordController,
    deleteFeedingRecordController
} from "../controllers/feeding.controller";

const router = Router();

// GET feeding summary
router.get("/summary", getFeedingSummaryController);

// GET all feeding records
router.get("/", getAllFeedingRecordsController);

// POST a feeding record
router.post("/", createFeedingRecordController);

// GET one feeding record by ID
router.get("/:id", getFeedingRecordByIdController);

// PUT: Replace the complete feeding record
router.put("/:id", updateFeedingRecordController);

// PATCH: Update selected feeding fields
router.patch("/:id", patchFeedingRecordController);

// DELETE a feeding record
router.delete("/:id", deleteFeedingRecordController);

export default router;
