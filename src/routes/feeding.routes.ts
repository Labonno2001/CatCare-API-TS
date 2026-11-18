
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

// Zod validation middleware
import {
    validateBody,
    validateParams,
    validateQuery
} from "../middleware/validate.middleware";

// Feeding body validation schemas
import {
    feedingCreateSchema,
    feedingUpdateSchema,
    feedingPatchSchema
} from "../validators/feeding.validator";

// Feeding query validation schemas
import {
    feedingDateQuerySchema,
    feedingSummaryQuerySchema,
    feedingAdvancedQuerySchema,
    feedingGroupedQuerySchema
} from "../validators/feeding-query.validator";

// URL parameter validation schema
import { idParamSchema } from "../validators/params.validator";

const router = Router();

// GET feeding summary
router.get(
    "/summary",
    validateQuery(feedingSummaryQuerySchema),
    getFeedingSummaryController
);

// GET advanced feeding records
router.get(
    "/advanced",
    validateQuery(feedingAdvancedQuerySchema),
    getAdvancedFeedingRecordsController
);

// GET feeding records grouped by food
router.get(
    "/grouped",
    validateQuery(feedingGroupedQuerySchema),
    getFeedingGroupedByFoodController
);

// GET all feeding records
router.get(
    "/",
    validateQuery(feedingDateQuerySchema),
    getAllFeedingRecordsController
);

// POST a new feeding record
router.post(
    "/",
    validateBody(feedingCreateSchema),
    createFeedingRecordController
);

// GET one feeding record by ID
router.get(
    "/:id",
    validateParams(idParamSchema),
    getFeedingRecordByIdController
);

// PUT: Replace the complete feeding record
router.put(
    "/:id",
    validateParams(idParamSchema),
    validateBody(feedingUpdateSchema),
    updateFeedingRecordController
);

// PATCH: Update selected feeding fields
router.patch(
    "/:id",
    validateParams(idParamSchema),
    validateBody(feedingPatchSchema),
    patchFeedingRecordController
);

// DELETE a feeding record
router.delete(
    "/:id",
    validateParams(idParamSchema),
    deleteFeedingRecordController
);

export default router;
