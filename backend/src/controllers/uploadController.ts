import { Request, Response } from "express";
import path from "path";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import { loadAndParseCsv } from "../services/csvService";
import { jobStore } from "../services/importService";
import { statusService } from "../services/statusService";
import { chunkRows } from "../utils/csvParser";
import { env } from "../config/env";

/**
 * POST /api/upload
 * Accepts a multipart CSV file, parses it (no AI yet), registers a job,
 * and returns a preview payload the frontend can render immediately.
 */
export const uploadCsvHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("No file was uploaded. Attach a CSV file under field name 'file'.", 400);
  }

  const jobId = path.parse(req.file.filename).name;
  const parsedCsv = await loadAndParseCsv(req.file.path);

  jobStore.set(jobId, {
    parsedCsv,
    filePath: req.file.path,
    originalName: req.file.originalname,
  });

  const totalBatches = chunkRows(parsedCsv.rows, env.aiBatchSize).length;
  statusService.createJob(jobId, parsedCsv.rowCount, totalBatches);

  res.status(201).json({
    success: true,
    data: {
      jobId,
      fileName: req.file.originalname,
      fileSizeBytes: req.file.size,
      headers: parsedCsv.headers,
      rowCount: parsedCsv.rowCount,
      previewRows: parsedCsv.rows.slice(0, 50),
    },
  });
});
