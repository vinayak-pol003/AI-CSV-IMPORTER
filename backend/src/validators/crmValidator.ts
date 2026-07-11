import { z } from "zod";
import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from "../types/crm";

/**
 * Validates a single AI-extracted CRM record.
 * Enum fields fall back to "" instead of failing validation, since the
 * assignment spec requires blanking unrecognized enum values rather than
 * rejecting the whole record.
 */
export const crmRecordSchema = z.object({
  created_at: z.string().default(""),
  name: z.string().default(""),
  email: z.string().default(""),
  country_code: z.string().default(""),
  mobile_without_country_code: z.string().default(""),
  company: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  country: z.string().default(""),
  lead_owner: z.string().default(""),
  crm_status: z
    .union([z.enum(CRM_STATUS_VALUES), z.literal("")])
    .catch(""),
  crm_note: z.string().default(""),
  data_source: z
    .union([z.enum(DATA_SOURCE_VALUES), z.literal("")])
    .catch(""),
  possession_time: z.string().default(""),
  description: z.string().default(""),
});

export const aiBatchResponseSchema = z.object({
  records: z.array(
    z.object({
      // AI may echo back which source row this maps to for skip-tracking
      sourceRowIndex: z.number().optional(),
      skipped: z.boolean().optional().default(false),
      skipReason: z.string().optional().default(""),
      data: crmRecordSchema.partial().optional(),
    })
  ),
});

export type AiBatchResponse = z.infer<typeof aiBatchResponseSchema>;

/** Normalizes a date string to something `new Date()` can parse; falls back to "" */
export function normalizeDate(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value; // leave as-is, let AI's best-effort string through
  return d.toISOString();
}

/** Business rule: a record must have an email or a mobile number to be valid */
export function hasContactInfo(record: { email?: string; mobile_without_country_code?: string }): boolean {
  return Boolean(record.email?.trim()) || Boolean(record.mobile_without_country_code?.trim());
}
