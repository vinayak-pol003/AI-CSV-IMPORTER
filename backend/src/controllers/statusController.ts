import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import { statusService } from "../services/statusService";

/** GET /api/status/:jobId — polled by the frontend during processing. */
export const getStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const status = statusService.get(jobId);

  if (!status) {
    throw new AppError(`No job found for jobId '${jobId}'.`, 404);
  }

  res.status(200).json({ success: true, data: status });
});
