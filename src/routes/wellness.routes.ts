
import { Router } from "express";

import {
    getDailyWellnessController
} from "../controllers/wellness.controller";

const router = Router();

// GET daily wellness information
router.get("/daily", getDailyWellnessController);

export default router;
