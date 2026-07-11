import { CsvRow } from "../types/csv";
import { CrmRecord, SkippedRecord } from "../types/crm";
import { buildBatchPrompt, SYSTEM_INSTRUCTIONS } from "./prompts/crmExtractionPrompt";
import { callGemini } from "./geminiClient";
import { callOpenRouter } from "./openrouterClient";
import { callGroq } from "./groqClient";
import { callHuggingFace } from "./huggingfaceClient";
import { callCerebras } from "./cerebrasClient";
import { aiBatchResponseSchema, crmRecordSchema, hasContactInfo } from "../validators/crmValidator";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { AiProcessingError } from "../utils/errors";

export interface BatchMapResult {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strips accidental markdown code fences in case the model ignores the JSON-only instruction. */
function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

function emptyCrmRecord(): CrmRecord {
  return {
    created_at: "",
    name: "",
    email: "",
    country_code: "",
    mobile_without_country_code: "",
    company: "",
    city: "",
    state: "",
    country: "",
    lead_owner: "",
    crm_status: "",
    crm_note: "",
    data_source: "",
    possession_time: "",
    description: "",
  };
}

/**
 * Sends one batch of raw CSV rows to the AI, validates + normalizes the response,
 * and applies deterministic business rules (skip rows without contact info) as a
 * safety net even if the model's own skip logic is imperfect.
 */
async function mapBatchOnce(rows: CsvRow[], batchStartIndex: number): Promise<BatchMapResult> {
  const prompt = buildBatchPrompt(rows, batchStartIndex);
  const providers: Record<string, typeof callGemini> = {
    gemini: callGemini,
    openrouter: callOpenRouter,
    groq: callGroq,
    huggingface: callHuggingFace,
    cerebras: callCerebras,
  };
  const callAI = providers[env.aiProvider] ?? callGemini;
  const rawText = await callAI(SYSTEM_INSTRUCTIONS, prompt);
  const cleaned = stripCodeFences(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch (err) {
    throw new AiProcessingError("AI returned malformed JSON.", { rawText: cleaned.slice(0, 500) });
  }

  const validation = aiBatchResponseSchema.safeParse(parsedJson);
  if (!validation.success) {
    throw new AiProcessingError("AI response did not match the expected schema.", {
      issues: validation.error.issues,
    });
  }

  const imported: CrmRecord[] = [];
  const skipped: SkippedRecord[] = [];
  const { records } = validation.data;

  // Defensive: ensure every input row has a corresponding output entry.
  const byIndex = new Map(records.map((r) => [r.sourceRowIndex ?? -1, r]));

  rows.forEach((row, i) => {
    const entry = byIndex.get(i);
    const globalIndex = batchStartIndex + i;

    if (!entry) {
      skipped.push({
        row,
        rowIndex: globalIndex,
        reason: "AI did not return a result for this row.",
      });
      return;
    }

    const candidate = { ...emptyCrmRecord(), ...(entry.data ?? {}) };
    const parsedRecord = crmRecordSchema.safeParse(candidate);
    const record = parsedRecord.success ? parsedRecord.data : candidate;

    const shouldSkip = entry.skipped || !hasContactInfo(record);

    if (shouldSkip) {
      skipped.push({
        row,
        rowIndex: globalIndex,
        reason:
          entry.skipReason ||
          (!hasContactInfo(record)
            ? "Row has neither an email nor a phone number."
            : "Marked as skipped by AI."),
      });
      return;
    }

    imported.push(record as CrmRecord);
  });

  return { imported, skipped };
}

/** Wraps mapBatchOnce with exponential-backoff retries for transient AI failures. */
export async function mapBatchWithRetry(
  rows: CsvRow[],
  batchStartIndex: number,
  batchNumber: number
): Promise<BatchMapResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= env.aiMaxRetries; attempt++) {
    try {
      return await mapBatchOnce(rows, batchStartIndex);
    } catch (err) {
      lastError = err;
      logger.warn(`Batch ${batchNumber} failed (attempt ${attempt + 1}/${env.aiMaxRetries + 1})`, {
        error: err instanceof Error ? err.message : String(err),
      });
      if (attempt < env.aiMaxRetries) {
        const delay = env.aiRetryBaseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted: mark every row in this batch as skipped rather than
  // failing the entire import — partial success is more useful than total failure.
  logger.error(`Batch ${batchNumber} permanently failed after retries`, {
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });

  return {
    imported: [],
    skipped: rows.map((row, i) => ({
      row,
      rowIndex: batchStartIndex + i,
      reason: `AI batch processing failed after ${env.aiMaxRetries + 1} attempts: ${
        lastError instanceof Error ? lastError.message : "unknown error"
      }`,
    })),
  };
}
