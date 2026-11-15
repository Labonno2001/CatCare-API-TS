
import { Router } from "express";

import {
    getAllWaterRecordsController,
    createWaterRecordController,
    getWaterSummaryController,
    getWaterRecordByIdController,
    updateWaterRecordController,
    patchWaterRecordController,
    deleteWaterRecordController,
    getAdvancedWaterRecordsController,
    getWaterGroupedController
} from "../controllers/water.controller";

const router = Router();

// Summary
router.get("/summary", getWaterSummaryController);

// Advanced QueryBuilder endpoints
router.get("/advanced", getAdvancedWaterRecordsController);
router.get("/grouped", getWaterGroupedController);

// CRUD endpoints
router.get("/", getAllWaterRecordsController);
router.post("/", createWaterRecordController);
router.get("/:id", getWaterRecordByIdController);
router.put("/:id", updateWaterRecordController);
router.patch("/:id", patchWaterRecordController);
router.delete("/:id", deleteWaterRecordController);

export default router;
