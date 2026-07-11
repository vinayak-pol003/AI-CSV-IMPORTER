import { Router } from "express";
import { startProcessingHandler, getResultHandler } from "../controllers/processController";
import { processRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/", processRateLimiter, startProcessingHandler);
router.get("/:jobId/result", getResultHandler);

export default router;
