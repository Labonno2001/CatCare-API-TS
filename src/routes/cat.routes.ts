import { Router } from "express";

import {
    getCatProfileController,
    updateCatProfileController
} from "../controllers/cat.controller";

const router = Router();

router.get("/", getCatProfileController);
router.patch("/", updateCatProfileController);

export default router;