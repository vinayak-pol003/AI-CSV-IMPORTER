import { describe, it, expect } from "vitest";
import { buildBatchPrompt, SYSTEM_INSTRUCTIONS } from "../src/ai/prompts/crmExtractionPrompt";

describe("SYSTEM_INSTRUCTIONS", () => {
  it("enumerates the allowed crm_status values", () => {
    expect(SYSTEM_INSTRUCTIONS).toContain("GOOD_LEAD_FOLLOW_UP");
    expect(SYSTEM_INSTRUCTIONS).toContain("DID_NOT_CONNECT");
    expect(SYSTEM_INSTRUCTIONS).toContain("BAD_LEAD");
    expect(SYSTEM_INSTRUCTIONS).toContain("SALE_DONE");
  });

  it("enumerates the allowed data_source values", () => {
    expect(SYSTEM_INSTRUCTIONS).toContain("leads_on_demand");
    expect(SYSTEM_INSTRUCTIONS).toContain("meridian_tower");
    expect(SYSTEM_INSTRUCTIONS).toContain("eden_park");
    expect(SYSTEM_INSTRUCTIONS).toContain("varah_swamy");
    expect(SYSTEM_INSTRUCTIONS).toContain("sarjapur_plots");
  });

  it("instructs the model to never hallucinate values", () => {
    expect(SYSTEM_INSTRUCTIONS.toLowerCase()).toContain("never invent, guess, or hallucinate");
  });

  it("instructs strict JSON-only output", () => {
    expect(SYSTEM_INSTRUCTIONS).toContain("Output ONLY valid JSON");
  });
});

describe("buildBatchPrompt", () => {
  it("includes every row's data in the prompt payload", () => {
    const rows = [{ Name: "John", Phone: "9876543210" }, { Name: "Jane", Phone: "9876543211" }];
    const prompt = buildBatchPrompt(rows, 0);
    expect(prompt).toContain("John");
    expect(prompt).toContain("Jane");
    expect(prompt).toContain("9876543210");
  });

  it("offsets globalRowIndex by the batch start index", () => {
    const rows = [{ Name: "John" }];
    const prompt = buildBatchPrompt(rows, 50);
    expect(prompt).toContain('"globalRowIndex": 50');
  });
});
