import { CrmRecord } from "../types/crm";

const CRM_FIELDS: (keyof CrmRecord)[] = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  // Escape embedded newlines so each record stays on a single CSV row
  const singleLine = str.replace(/\r?\n/g, "\\n");
  if (/[",]/.test(singleLine)) {
    return `"${singleLine.replace(/"/g, '""')}"`;
  }
  return singleLine;
}

/** Serializes CRM records to a valid, single-row-per-record CSV string. */
export function recordsToCsv(records: CrmRecord[]): string {
  const header = CRM_FIELDS.join(",");
  const lines = records.map((record) =>
    CRM_FIELDS.map((field) => escapeCsvValue(record[field])).join(",")
  );
  return [header, ...lines].join("\n");
}
