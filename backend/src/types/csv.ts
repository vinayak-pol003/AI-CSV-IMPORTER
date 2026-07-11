export type CsvRow = Record<string, string>;

export interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
  rowCount: number;
}

export interface UploadedFileMeta {
  jobId: string;
  originalName: string;
  sizeBytes: number;
  filePath: string;
  uploadedAt: string;
}

export type JobStatusState =
  | "uploaded"
  | "processing"
  | "completed"
  | "failed";

export interface JobProgress {
  jobId: string;
  status: JobStatusState;
  totalRows: number;
  processedRows: number;
  totalBatches: number;
  currentBatch: number;
  importedCount: number;
  skippedCount: number;
  startedAt?: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  estimatedRemainingMs?: number;
}
