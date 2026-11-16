
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
    getWaterGroupedController,
    getWaterDailyTargetController,
    saveWaterDailyTargetController
} from "../controllers/water.controller";

const router = Router();

// --------------------------------------------------
// Daily offered water target
// --------------------------------------------------

// GET /api/water/daily-target?date=2026-11-16
router.get(
    "/daily-target",
    getWaterDailyTargetController
);

// PUT /api/water/daily-target
router.put(
    "/daily-target",
    saveWaterDailyTargetController
);

// --------------------------------------------------
// Summary
// --------------------------------------------------

// GET /api/water/summary?date=2026-11-16
router.get(
    "/summary",
    getWaterSummaryController
);

// --------------------------------------------------
// Advanced filtering, sorting and pagination
// --------------------------------------------------

// GET /api/water/advanced
router.get(
    "/advanced",
    getAdvancedWaterRecordsController
);

// --------------------------------------------------
// Group water records
// --------------------------------------------------

// GET /api/water/grouped
router.get(
    "/grouped",
    getWaterGroupedController
);

// --------------------------------------------------
// Individual water consumption records
// --------------------------------------------------

// GET /api/water
router.get(
    "/",
    getAllWaterRecordsController
);

// POST /api/water
router.post(
    "/",
    createWaterRecordController
);

// GET /api/water/:id
router.get(
    "/:id",
    getWaterRecordByIdController
);

// PUT /api/water/:id
router.put(
    "/:id",
    updateWaterRecordController
);

// PATCH /api/water/:id
router.patch(
    "/:id",
    patchWaterRecordController
);

// DELETE /api/water/:id
router.delete(
    "/:id",
    deleteWaterRecordController
);

export default router;
