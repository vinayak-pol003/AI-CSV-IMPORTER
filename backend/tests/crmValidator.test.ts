import { describe, it, expect } from "vitest";
import { crmRecordSchema, hasContactInfo, aiBatchResponseSchema } from "../src/validators/crmValidator";

describe("crmRecordSchema", () => {
  it("accepts a fully valid record", () => {
    const result = crmRecordSchema.safeParse({
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
    });
    expect(result.success).toBe(true);
  });

  it("falls back invalid crm_status to empty string instead of failing", () => {
    const result = crmRecordSchema.parse({ crm_status: "NOT_A_REAL_STATUS" });
    expect(result.crm_status).toBe("");
  });

  it("falls back invalid data_source to empty string instead of failing", () => {
    const result = crmRecordSchema.parse({ data_source: "some_random_project" });
    expect(result.data_source).toBe("");
  });

  it("defaults missing string fields to empty string", () => {
    const result = crmRecordSchema.parse({});
    expect(result.name).toBe("");
    expect(result.email).toBe("");
  });
});

describe("hasContactInfo", () => {
  it("returns true when email is present", () => {
    expect(hasContactInfo({ email: "a@b.com", mobile_without_country_code: "" })).toBe(true);
  });

  it("returns true when phone is present", () => {
    expect(hasContactInfo({ email: "", mobile_without_country_code: "9876543210" })).toBe(true);
  });

  it("returns false when neither is present", () => {
    expect(hasContactInfo({ email: "", mobile_without_country_code: "" })).toBe(false);
  });

  it("returns false for whitespace-only values", () => {
    expect(hasContactInfo({ email: "   ", mobile_without_country_code: "" })).toBe(false);
  });
});

describe("aiBatchResponseSchema", () => {
  it("validates a well-formed AI batch response", () => {
    const payload = {
      records: [
        {
          sourceRowIndex: 0,
          skipped: false,
          skipReason: "",
          data: { name: "John", email: "john@example.com" },
        },
      ],
    };
    expect(aiBatchResponseSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects a response missing the records array", () => {
    expect(aiBatchResponseSchema.safeParse({}).success).toBe(false);
  });
});
