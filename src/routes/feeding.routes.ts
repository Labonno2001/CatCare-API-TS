
import { Router } from "express";

import {
    getAllFeedingRecordsController,
    createFeedingRecordController,
    getFeedingSummaryController,
    getFeedingRecordByIdController,
    updateFeedingRecordController,
    patchFeedingRecordController,
    deleteFeedingRecordController,
    getAdvancedFeedingRecordsController,
    getFeedingGroupedByFoodController
} from "../controllers/feeding.controller";

const router = Router();

// GET feeding summary
router.get("/summary", getFeedingSummaryController);

// GET advanced feeding records
router.get("/advanced", getAdvancedFeedingRecordsController);

// GET feeding records grouped by food
router.get("/grouped", getFeedingGroupedByFoodController);

// GET all feeding records
router.get("/", getAllFeedingRecordsController);

// POST a new feeding record
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
