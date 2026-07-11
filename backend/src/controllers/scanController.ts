import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import { ScanResult } from "../models/scanResult";
import { logger } from "../utils/logger";
import { recordsToCsv } from "../utils/csvWriter";

/** GET /api/scans -- list all scanned results (newest first). */
export const getScansHandler = asyncHandler(async (_req: Request, res: Response) => {
  const scans = await ScanResult.find()
    .select({ jobId: 1, fileName: 1, stats: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: scans });
});

/** GET /api/scans/:jobId -- get a single scanned result by jobId. */
export const getScanByJobIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const scan = await ScanResult.findOne({ jobId }).lean();

  if (!scan) {
    throw new AppError(`No scan result found for jobId '${jobId}'.`, 404);
  }

  res.status(200).json({ success: true, data: scan });
});

/** DELETE /api/scans/:jobId -- delete a scanned result. */
export const deleteScanHandler = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const result = await ScanResult.findOneAndDelete({ jobId });

  if (!result) {
    throw new AppError(`No scan result found for jobId '${jobId}'.`, 404);
  }

  logger.info("Scan result deleted", { jobId });
  res.status(200).json({ success: true, data: { message: "Scan result deleted." } });
});

/** GET /api/scans/:jobId/download -- download imported records as CSV. */
export const downloadScanCsvHandler = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const scan = await ScanResult.findOne({ jobId }).lean();

  if (!scan) {
    throw new AppError(`No scan result found for jobId '${jobId}'.`, 404);
  }

  const csv = recordsToCsv(scan.imported);
  const safeName = scan.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.csv$/i, "");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}_imported.csv"`);
  res.send(csv);
});
