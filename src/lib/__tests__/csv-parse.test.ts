import { describe, it, expect } from "vitest";
import { parse } from "csv-parse/sync";

const sampleCsv = `First name,Last name,Title,Company,Location,Linkedin url,Company website\nJohn,Doe,CTO,Widgets,NY,https://lnkd.in/john,https://widgets.com`;

describe("csv parse", () => {
  it("parses required fields", () => {
    const records = parse(sampleCsv, { columns: true, trim: true });
    expect(records.length).toBe(1);
    expect(records[0]["First name"]).toBe("John");
  });
}); 