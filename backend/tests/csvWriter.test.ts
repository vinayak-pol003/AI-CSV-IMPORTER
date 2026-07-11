import { describe, it, expect } from "vitest";
import { recordsToCsv } from "../src/utils/csvWriter";
import { CrmRecord } from "../src/types/crm";

function makeRecord(overrides: Partial<CrmRecord> = {}): CrmRecord {
  return {
    created_at: "2026-05-13T14:20:48.000Z",
    name: "John Doe",
    email: "john@example.com",
    country_code: "+91",
    mobile_without_country_code: "9876543210",
    company: "GrowEasy",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    lead_owner: "test@gmail.com",
    crm_status: "GOOD_LEAD_FOLLOW_UP",
    crm_note: "",
    data_source: "meridian_tower",
    possession_time: "",
    description: "",
    ...overrides,
  };
}

describe("recordsToCsv", () => {
  it("produces a header row plus one row per record", () => {
    const csv = recordsToCsv([makeRecord(), makeRecord({ name: "Jane Doe" })]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(3);
    expect(lines[0]).toContain("created_at");
    expect(lines[1]).toContain("John Doe");
    expect(lines[2]).toContain("Jane Doe");
  });

  it("quotes and escapes values containing commas", () => {
    const csv = recordsToCsv([makeRecord({ crm_note: "Prefers calls, not email" })]);
    expect(csv).toContain('"Prefers calls, not email"');
  });

  it("escapes embedded newlines so each record stays on one row", () => {
    const csv = recordsToCsv([makeRecord({ description: "Line one\nLine two" })]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(2); // header + 1 record, no extra line from the embedded newline
    expect(lines[1]).toContain("Line one\\nLine two");
  });

  it("escapes embedded double quotes", () => {
    const csv = recordsToCsv([makeRecord({ company: 'The "Best" Company' })]);
    expect(csv).toContain('"The ""Best"" Company"');
  });
});
