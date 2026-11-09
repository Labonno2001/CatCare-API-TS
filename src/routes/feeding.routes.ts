
import { Router } from "express";

import {
    getAllFeedingRecordsController,
    createFeedingRecordController,
    getFeedingSummaryController,
    getFeedingRecordByIdController,
    updateFeedingRecordController,
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

// PATCH a feeding record
router.patch("/:id", updateFeedingRecordController);

// DELETE a feeding record
router.delete("/:id", deleteFeedingRecordController);

export default router;
