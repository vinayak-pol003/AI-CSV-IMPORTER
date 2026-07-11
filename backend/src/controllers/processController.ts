import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import { jobStore, runImportPipeline } from "../services/importService";
import { statusService } from "../services/statusService";
import { recordsToCsv } from "../utils/csvWriter";
import { logger } from "../utils/logger";

/**
 * POST /api/process
 * Body: { jobId: string }
 * Kicks off the AI batch pipeline for a previously uploaded job. Returns
 * immediately (202) — progress is tracked via GET /api/status/:jobId.
 */
export const startProcessingHandler = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.body as { jobId?: string };

  if (!jobId) {
    throw new AppError("jobId is required in the request body.", 400);
  }

  const job = jobStore.get(jobId);
  if (!job) {
    throw new AppError(`No uploaded job found for jobId '${jobId}'.`, 404);
  }

  const status = statusService.get(jobId);
  if (status?.status === "processing") {
    res.status(202).json({ success: true, data: { jobId, message: "Already processing." } });
    return;
  }

  // Fire-and-forget: the pipeline runs detached from this request/response cycle.
  runImportPipeline(jobId).catch((err) => {
    logger.error("Unhandled error in import pipeline", {
      jobId,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  res.status(202).json({
    success: true,
    data: { jobId, message: "Processing started." },
  });
});

/**
 * GET /api/process/:jobId/result
 * Returns the final imported/skipped records once processing has completed.
 */
export const getResultHandler = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);
  const status = statusService.get(jobId);

  if (!job || !status) {
    throw new AppError(`No job found for jobId '${jobId}'.`, 404);
  }

  if (status.status !== "completed") {
    throw new AppError(`Job '${jobId}' is not completed yet (status: ${status.status}).`, 409);
  }

  if (!job.result) {
    throw new AppError(`Job '${jobId}' completed but no result was stored.`, 500);
  }

  const format = (req.query.format as string) || "json";

  if (format === "csv") {
    const csv = recordsToCsv(job.result.imported);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="crm_import_${jobId}.csv"`);
    res.send(csv);
    return;
  }

  res.status(200).json({ success: true, data: job.result });
});
