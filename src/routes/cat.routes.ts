import { Router } from "express";
import { getCatProfileController } from "../controllers/cat.controller";

const router = Router();

router.get("/", getCatProfileController);

export default router;