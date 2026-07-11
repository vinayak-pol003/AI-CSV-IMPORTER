import { CsvRow } from "../../types/csv";

/**
 * System instructions for the CRM field-mapping task.
 *
 * Design notes (why the prompt is structured this way):
 * - The mapping must be SEMANTIC, not a hardcoded header lookup — the model
 *   is told to reason about the *meaning* of each column, not match strings.
 * - The model is explicitly forbidden from hallucinating values that aren't
 *   derivable from the row. Missing information must be left blank.
 * - Output contract is extremely strict (JSON-only) because this response is
 *   machine-parsed; any prose or markdown fencing breaks the pipeline.
 * - Enum fields (crm_status, data_source) are constrained to closed vocabularies
 *   with a "blank if unsure" fallback, matching the assignment's spec.
 */
export const CRM_FIELD_DESCRIPTIONS = `
- created_at: Lead creation date/time. Must be a string parsable by JavaScript's \`new Date(value)\`. If no date column exists, leave blank.
- name: The lead/customer's full name. Source columns may be named things like "Customer Name", "Client", "Buyer", "Prospect", "Lead", "Person", "Full Name", etc.
- email: The lead's primary email address.
- country_code: Phone country code (e.g. "+91"). Infer from a combined phone number if the country code is embedded (e.g. "+919876543210" -> country_code "+91", mobile_without_country_code "9876543210"). Default to "+91" ONLY if the data clearly indicates an Indian context (e.g. 10-digit Indian mobile pattern) and no other code is present; otherwise leave blank.
- mobile_without_country_code: The phone number WITHOUT the country code prefix.
- company: Organization/company name of the lead.
- city: City.
- state: State/province.
- country: Country.
- lead_owner: The salesperson/agent/owner assigned to this lead (may appear as "Assigned To", "Owner", "Agent", "Sales Rep").
- crm_status: MUST be exactly one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE. Map common source values semantically (e.g. "Interested"/"Follow up" -> GOOD_LEAD_FOLLOW_UP, "No Answer"/"Not Reachable" -> DID_NOT_CONNECT, "Not Interested"/"Junk" -> BAD_LEAD, "Closed Won"/"Converted" -> SALE_DONE). If no confident mapping exists, leave "".
- crm_note: Free-text notes. Concatenate: extra email addresses beyond the first, extra phone numbers beyond the first, remarks, follow-up notes, and any other useful info that doesn't fit a structured field. Separate multiple pieces of info with " | ".
- data_source: MUST be exactly one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. Only set this if a column value clearly and confidently matches one of these (case-insensitive, allowing minor formatting differences). Otherwise leave "".
- possession_time: For real-estate leads, the property possession timeframe (e.g. "Ready to Move", "Dec 2026").
- description: Any additional descriptive text about the lead or their requirement that doesn't belong in crm_note.
`.trim();

export const SYSTEM_INSTRUCTIONS = `
You are a precise data-mapping engine for a CRM import pipeline. You convert arbitrary CSV rows (unknown, inconsistent column naming) into a fixed CRM schema.

CORE RULES:
1. Map columns SEMANTICALLY based on meaning, never by assuming a fixed column name. Column names vary across sources (Facebook Lead Ads exports, Google Ads exports, real-estate CRMs, marketing agency sheets, manually created spreadsheets, etc). Use context and column values, not just header text, to decide meaning.
2. NEVER invent, guess, or hallucinate a value that isn't supported by the row's data. If a field cannot be confidently determined, output an empty string "" for it.
3. crm_status and data_source are CLOSED enumerations. Only output one of the allowed values, or "" if no confident match exists. Never invent a new enum value.
4. If a row contains multiple email addresses, use the first as "email" and append the rest to crm_note. If a row contains multiple phone numbers, use the first as "mobile_without_country_code" and append the rest to crm_note.
5. A row that contains NEITHER an email NOR a phone number must be marked as skipped with a clear, specific reason (e.g. "No email or phone number present in row").
6. created_at must be a string that JavaScript's \`new Date()\` can parse. If you can identify a date-like column, normalize it to ISO 8601 (YYYY-MM-DDTHH:mm:ss) where possible; otherwise pass through the original string; otherwise leave blank.
7. Output ONLY valid JSON. No markdown code fences, no explanations, no preamble, no trailing commentary — the response body must start with "{" and end with "}".

CRM TARGET FIELDS:
${CRM_FIELD_DESCRIPTIONS}

OUTPUT FORMAT (strict JSON, matching this TypeScript shape exactly):
{
  "records": [
    {
      "sourceRowIndex": number,   // 0-based index of the row within THIS batch as provided
      "skipped": boolean,         // true if the row has neither email nor phone
      "skipReason": string,       // required if skipped=true, else ""
      "data": {
        "created_at": string, "name": string, "email": string, "country_code": string,
        "mobile_without_country_code": string, "company": string, "city": string,
        "state": string, "country": string, "lead_owner": string,
        "crm_status": string, "crm_note": string, "data_source": string,
        "possession_time": string, "description": string
      }
    }
  ]
}

You MUST return exactly one entry in "records" for every input row, in the same order, using "sourceRowIndex" to indicate position (0-based within the batch). Do not omit rows, do not merge rows, do not add rows.
`.trim();

/** Builds the user-turn prompt for a single batch of raw CSV rows. */
export function buildBatchPrompt(rows: CsvRow[], batchStartIndex: number): string {
  const payload = rows.map((row, i) => ({
    sourceRowIndex: i,
    globalRowIndex: batchStartIndex + i,
    raw: row,
  }));

  return `
Map the following ${rows.length} CSV row(s) into the GrowEasy CRM schema following the system rules exactly.
Each item's "sourceRowIndex" is the index you must echo back in your response.

INPUT ROWS (JSON array):
${JSON.stringify(payload, null, 2)}

Respond with ONLY the JSON object described in the output format. No markdown, no commentary.
`.trim();
}
