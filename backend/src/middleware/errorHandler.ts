import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { isProduction } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  logger.error(err.message, {
    path: req.originalUrl,
    method: req.method,
    statusCode,
    stack: isProduction ? undefined : err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Internal server error",
      ...(isAppError && err.details ? { details: err.details } : {}),
      ...(!isProduction && !isAppError ? { stack: err.stack } : {}),
    },
  });
}
