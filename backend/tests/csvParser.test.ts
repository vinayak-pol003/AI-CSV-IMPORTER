import { describe, it, expect } from "vitest";
import { parseCsvBuffer, chunkRows } from "../src/utils/csvParser";

describe("parseCsvBuffer", () => {
  it("parses a simple CSV with headers and rows", async () => {
    const csv = "Name,Email\nJohn Doe,john@example.com\nJane Doe,jane@example.com";
    const result = await parseCsvBuffer(Buffer.from(csv));
    expect(result.headers).toEqual(["Name", "Email"]);
    expect(result.rowCount).toBe(2);
    expect(result.rows[0]).toEqual({ Name: "John Doe", Email: "john@example.com" });
  });

  it("handles quoted values with embedded commas", async () => {
    const csv = 'Name,Note\n"Doe, John","Called, left voicemail"';
    const result = await parseCsvBuffer(Buffer.from(csv));
    expect(result.rows[0].Name).toBe("Doe, John");
    expect(result.rows[0].Note).toBe("Called, left voicemail");
  });

  it("strips a UTF-8 BOM if present", async () => {
    const csv = "\uFEFFName,Email\nJohn,john@example.com";
    const result = await parseCsvBuffer(Buffer.from(csv));
    expect(result.headers[0]).toBe("Name");
  });

  it("rejects an empty CSV", async () => {
    await expect(parseCsvBuffer(Buffer.from(""))).rejects.toThrow(/empty/i);
  });

  it("rejects a header-only CSV with no data rows", async () => {
    await expect(parseCsvBuffer(Buffer.from("Name,Email\n"))).rejects.toThrow(/no data rows/i);
  });

  it("trims whitespace in header names", async () => {
    const csv = " Name , Email \nJohn,john@example.com";
    const result = await parseCsvBuffer(Buffer.from(csv));
    expect(result.headers).toEqual(["Name", "Email"]);
  });
});

describe("chunkRows", () => {
  it("splits rows into batches of the given size", () => {
    const rows = Array.from({ length: 105 }, (_, i) => ({ id: i }));
    const batches = chunkRows(rows, 50);
    expect(batches.length).toBe(3);
    expect(batches[0].length).toBe(50);
    expect(batches[2].length).toBe(5);
  });

  it("returns a single batch when batchSize is 0 or negative", () => {
    const rows = [{ id: 1 }, { id: 2 }];
    expect(chunkRows(rows, 0).length).toBe(1);
  });
});
