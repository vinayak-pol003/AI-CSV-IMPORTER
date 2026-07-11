import { JobProgress, JobStatusState } from "../types/csv";

/**
 * In-memory job store. Sufficient for a single-instance deployment (per the
 * assignment's "stateless / optional DB" allowance). For horizontal scaling,
 * swap this for Redis without changing the public interface.
 */
class StatusService {
  private jobs = new Map<string, JobProgress>();

  createJob(jobId: string, totalRows: number, totalBatches: number): JobProgress {
    const job: JobProgress = {
      jobId,
      status: "uploaded",
      totalRows,
      processedRows: 0,
      totalBatches,
      currentBatch: 0,
      importedCount: 0,
      skippedCount: 0,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, job);
    return job;
  }

  get(jobId: string): JobProgress | undefined {
    return this.jobs.get(jobId);
  }

  update(jobId: string, patch: Partial<JobProgress>): JobProgress | undefined {
    const existing = this.jobs.get(jobId);
    if (!existing) return undefined;
    const updated: JobProgress = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, updated);
    return updated;
  }

  markProcessing(jobId: string) {
    return this.update(jobId, { status: "processing", startedAt: new Date().toISOString() });
  }

  markBatchComplete(
    jobId: string,
    args: { currentBatch: number; processedRows: number; importedCount: number; skippedCount: number }
  ) {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    const elapsedMs = job.startedAt ? Date.now() - new Date(job.startedAt).getTime() : 0;
    const progressRatio = args.currentBatch / job.totalBatches;
    const estimatedTotalMs = progressRatio > 0 ? elapsedMs / progressRatio : 0;
    const estimatedRemainingMs = Math.max(0, Math.round(estimatedTotalMs - elapsedMs));

    return this.update(jobId, { ...args, estimatedRemainingMs });
  }

  markCompleted(jobId: string) {
    return this.update(jobId, {
      status: "completed" as JobStatusState,
      completedAt: new Date().toISOString(),
      estimatedRemainingMs: 0,
    });
  }

  markFailed(jobId: string, error: string) {
    return this.update(jobId, { status: "failed" as JobStatusState, error });
  }
}

export const statusService = new StatusService();
