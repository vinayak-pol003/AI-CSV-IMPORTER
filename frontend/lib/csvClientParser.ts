import Papa from "papaparse";

export interface ClientParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

/**
 * Client-side CSV parsing used ONLY for the immediate local preview (Step 2).
 * This never calls the AI — it exists purely so users see their data instantly
 * after dropping a file, before committing to the backend/AI pipeline.
 */
export function parseCsvClientSide(file: File): Promise<ClientParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data.filter((row) =>
          Object.values(row).some((v) => v !== undefined && v !== "")
        );
        resolve({ headers, rows, rowCount: rows.length });
      },
      error: (err: Error) => reject(err),
    });
  });
}
