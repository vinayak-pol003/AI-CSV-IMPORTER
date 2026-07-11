import { ParsedCsv } from "../types/csv";
import { CrmRecord, ImportResult, SkippedRecord } from "../types/crm";
import { chunkRows } from "../utils/csvParser";
import { mapBatchWithRetry } from "../ai/aiMapper";
import { statusService } from "./statusService";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";
import { ScanResult } from "../models/scanResult";

interface JobRecord {
  parsedCsv: ParsedCsv;
  filePath: string;
  originalName: string;
  result?: ImportResult;
}

/** In-memory registry of jobs (uploaded CSV + eventual result). */
class JobStore {
  private store = new Map<string, JobRecord>();

  set(jobId: string, record: JobRecord) {
    this.store.set(jobId, record);
  }

  get(jobId: string): JobRecord | undefined {
    return this.store.get(jobId);
  }

  setResult(jobId: string, result: ImportResult) {
    const existing = this.store.get(jobId);
    if (!existing) return;
    this.store.set(jobId, { ...existing, result });
  }
}

export const jobStore = new JobStore();

/**
 * Orchestrates the full AI extraction pipeline for a job:
 * batch the parsed rows, call the AI mapper per batch (with retry), aggregate
 * imported/skipped records, and report progress via statusService as it goes.
 *
 * Runs asynchronously/detached from the HTTP request that triggered it — the
 * frontend polls GET /api/status/:jobId for progress.
 */
export async function runImportPipeline(jobId: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) {
    throw new AppError(`Job ${jobId} not found.`, 404);
  }

  const { rows } = job.parsedCsv;
  const batches = chunkRows(rows, env.aiBatchSize);

  statusService.markProcessing(jobId);

  const imported: CrmRecord[] = [];
  const skipped: SkippedRecord[] = [];

  try {
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchStartIndex = i * env.aiBatchSize;

      const result = await mapBatchWithRetry(batch, batchStartIndex, i + 1);
      imported.push(...result.imported);
      skipped.push(...result.skipped);

      statusService.markBatchComplete(jobId, {
        currentBatch: i + 1,
        processedRows: Math.min((i + 1) * env.aiBatchSize, rows.length),
        importedCount: imported.length,
        skippedCount: skipped.length,
      });
    }

    const finalResult: ImportResult = {
      imported,
      skipped,
      stats: {
        totalRows: rows.length,
        importedCount: imported.length,
        skippedCount: skipped.length,
      },
    };

    jobStore.setResult(jobId, finalResult);
    statusService.markCompleted(jobId);

    try {
      await ScanResult.create({
        jobId,
        fileName: job.originalName,
        imported: finalResult.imported,
        skipped: finalResult.skipped,
        stats: finalResult.stats,
        completedAt: new Date(),
      });
      logger.info("Scan result saved to database", { jobId });
    } catch (dbErr) {
      logger.error("Failed to save scan result to database", {
        jobId,
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
    }

    logger.info("Import pipeline completed", { jobId, ...finalResult.stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during import processing.";
    statusService.markFailed(jobId, message);
    logger.error("Import pipeline failed", { jobId, error: message });
  }
}
