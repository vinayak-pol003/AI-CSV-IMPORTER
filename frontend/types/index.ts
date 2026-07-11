export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  row: Record<string, unknown>;
  rowIndex: number;
  reason: string;
}

export interface ImportResult {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  stats: {
    totalRows: number;
    importedCount: number;
    skippedCount: number;
  };
}

export interface UploadResponseData {
  jobId: string;
  fileName: string;
  fileSizeBytes: number;
  headers: string[];
  rowCount: number;
  previewRows: Record<string, string>[];
}

export type JobStatusState = "uploaded" | "processing" | "completed" | "failed";

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

export type AppStep = "upload" | "preview" | "processing" | "results";

export interface ScanResultSummary {
  jobId: string;
  fileName: string;
  stats: {
    totalRows: number;
    importedCount: number;
    skippedCount: number;
  };
  createdAt: string;
}

export interface ScanResult extends ScanResultSummary {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  completedAt: string;
}
