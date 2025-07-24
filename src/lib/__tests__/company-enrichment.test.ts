import { describe, it, expect } from "vitest";
import { enrichCompany } from "../company-enrichment";

// This is an online test hitting external site; keep timeout high.

describe("enrichCompany", () => {
  it("should return description for example.com", async () => {
    const data = await enrichCompany("https://example.com", { refresh: true });
    expect(data).toBeDefined();
    expect(data.description).toBeTruthy();
  }, 30000);
}); 