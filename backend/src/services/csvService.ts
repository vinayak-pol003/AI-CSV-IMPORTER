import fs from "fs/promises";
import { parseCsvBuffer } from "../utils/csvParser";
import { ParsedCsv } from "../types/csv";

/** Reads an uploaded CSV file from disk and parses it into rows. */
export async function loadAndParseCsv(filePath: string): Promise<ParsedCsv> {
  const buffer = await fs.readFile(filePath);
  return parseCsvBuffer(buffer);
}
