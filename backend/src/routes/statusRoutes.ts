import { Router } from "express";
import { getStatusHandler } from "../controllers/statusController";

const router = Router();

router.get("/:jobId", getStatusHandler);

export default router;
