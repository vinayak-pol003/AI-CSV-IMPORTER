import mongoose, { Schema, Document } from "mongoose";
import { CrmRecord, SkippedRecord } from "../types/crm";

export interface ScanResultDocument extends Document {
  jobId: string;
  fileName: string;
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  stats: {
    totalRows: number;
    importedCount: number;
    skippedCount: number;
  };
  createdAt: Date;
  completedAt: Date;
}

const crmRecordSchema = new Schema<CrmRecord>(
  {
    created_at: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    country_code: { type: String, default: "" },
    mobile_without_country_code: { type: String, default: "" },
    company: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    lead_owner: { type: String, default: "" },
    crm_status: { type: String, default: "" },
    crm_note: { type: String, default: "" },
    data_source: { type: String, default: "" },
    possession_time: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const skippedRecordSchema = new Schema<SkippedRecord>(
  {
    row: { type: Schema.Types.Mixed, default: {} },
    rowIndex: { type: Number, default: 0 },
    reason: { type: String, default: "" },
  },
  { _id: false }
);

const scanResultSchema = new Schema<ScanResultDocument>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    fileName: { type: String, required: true },
    imported: [crmRecordSchema],
    skipped: [skippedRecordSchema],
    stats: {
      totalRows: { type: Number, default: 0 },
      importedCount: { type: Number, default: 0 },
      skippedCount: { type: Number, default: 0 },
    },
    completedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ScanResult = mongoose.model<ScanResultDocument>(
  "ScanResult",
  scanResultSchema
);
