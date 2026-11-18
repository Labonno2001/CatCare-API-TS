
import { Router } from "express";

import {
    getCatProfileController,
    updateCatProfileController
} from "../controllers/cat.controller";

import { validateBody } from "../middleware/validate.middleware";
import { catProfileUpdateSchema } from "../validators/cat.validator";

const router = Router();

router.get("/", getCatProfileController);

router.patch(
    "/",
    validateBody(catProfileUpdateSchema),
    updateCatProfileController
);

export default router;
