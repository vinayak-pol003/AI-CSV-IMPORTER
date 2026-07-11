import { Router } from "express";
import { getScansHandler, getScanByJobIdHandler, deleteScanHandler, downloadScanCsvHandler } from "../controllers/scanController";

const router = Router();

router.get("/", getScansHandler);
router.get("/:jobId/download", downloadScanCsvHandler);
router.get("/:jobId", getScanByJobIdHandler);
router.delete("/:jobId", deleteScanHandler);

export default router;
