import { parse } from "fast-csv";
import { Readable } from "stream";
import { ParsedCsv, CsvRow } from "../types/csv";
import { AppError } from "./errors";

/**
 * Parses a CSV buffer into headers + row objects.
 * - Never assumes fixed column names; headers come straight from row 1.
 * - Handles quoted values, escaped commas, UTF-8 BOM, and empty fields via fast-csv.
 * - Trims header whitespace so "Phone " and "Phone" map identically downstream.
 */
export function parseCsvBuffer(buffer: Buffer): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];
    let headers: string[] = [];

    // Strip UTF-8 BOM if present
    const cleaned = buffer.toString("utf-8").replace(/^\uFEFF/, "");

    if (!cleaned.trim()) {
      reject(new AppError("The uploaded CSV file is empty.", 400));
      return;
    }

    const stream = Readable.from([cleaned]);

    stream
      .pipe(
        parse({
          headers: (headerRow) =>
            headerRow.map((h) => (h ?? "").toString().trim()),
          ignoreEmpty: true,
          trim: true,
          discardUnmappedColumns: false,
        })
      )
      .on("headers", (h: string[]) => {
        headers = h;
      })
      .on("data", (row: CsvRow) => {
        rows.push(row);
      })
      .on("error", (err: Error) => {
        reject(new AppError(`Failed to parse CSV: ${err.message}`, 400));
      })
      .on("end", () => {
        if (headers.length === 0) {
          reject(new AppError("Could not detect any columns in the CSV header row.", 400));
          return;
        }
        if (rows.length === 0) {
          reject(new AppError("The CSV file has no data rows.", 400));
          return;
        }
        resolve({ headers, rows, rowCount: rows.length });
      });
  });
}

/** Splits rows into fixed-size batches for AI processing. */
export function chunkRows<T>(rows: T[], batchSize: number): T[][] {
  if (batchSize <= 0) return [rows];
  const batches: T[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }
  return batches;
}
