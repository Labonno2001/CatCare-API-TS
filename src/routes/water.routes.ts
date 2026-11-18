
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

// Zod validation middleware
import {
    validateBody,
    validateParams,
    validateQuery
} from "../middleware/validate.middleware";

// Water body validation schemas
import {
    waterCreateSchema,
    waterUpdateSchema,
    waterPatchSchema,
    waterDailyTargetSchema
} from "../validators/water.validator";

// Water query validation schemas
import {
    waterDateQuerySchema,
    waterDailyTargetQuerySchema,
    waterSummaryQuerySchema,
    waterAdvancedQuerySchema,
    waterGroupedQuerySchema
} from "../validators/water-query.validator";

// URL parameter validation schema
import { idParamSchema } from "../validators/params.validator";

const router = Router();

// --------------------------------------------------
// Daily offered water target
// --------------------------------------------------

router.get(
    "/daily-target",
    validateQuery(waterDailyTargetQuerySchema),
    getWaterDailyTargetController
);

router.put(
    "/daily-target",
    validateBody(waterDailyTargetSchema),
    saveWaterDailyTargetController
);

// --------------------------------------------------
// Summary
// --------------------------------------------------

router.get(
    "/summary",
    validateQuery(waterSummaryQuerySchema),
    getWaterSummaryController
);

// --------------------------------------------------
// Advanced filtering, sorting and pagination
// --------------------------------------------------

router.get(
    "/advanced",
    validateQuery(waterAdvancedQuerySchema),
    getAdvancedWaterRecordsController
);

// --------------------------------------------------
// Group water records
// --------------------------------------------------

router.get(
    "/grouped",
    validateQuery(waterGroupedQuerySchema),
    getWaterGroupedController
);

// --------------------------------------------------
// Individual water consumption records
// --------------------------------------------------

router.get(
    "/",
    validateQuery(waterDateQuerySchema),
    getAllWaterRecordsController
);

router.post(
    "/",
    validateBody(waterCreateSchema),
    createWaterRecordController
);

router.get(
    "/:id",
    validateParams(idParamSchema),
    getWaterRecordByIdController
);

router.put(
    "/:id",
    validateParams(idParamSchema),
    validateBody(waterUpdateSchema),
    updateWaterRecordController
);

router.patch(
    "/:id",
    validateParams(idParamSchema),
    validateBody(waterPatchSchema),
    patchWaterRecordController
);

router.delete(
    "/:id",
    validateParams(idParamSchema),
    deleteWaterRecordController
);

export default router;
