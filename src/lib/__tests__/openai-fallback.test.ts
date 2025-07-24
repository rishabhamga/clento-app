import { describe, it, expect } from "vitest";
import { generateMessagesAI } from "../openai-message";
import { type LeadRow, type FieldContext } from "@/types/personalization";

const lead: LeadRow = {
  "First name": "Jane",
  "Last name": "Doe",
  Title: "CEO",
  Company: "Acme",
  Location: "NY",
  "Linkedin url": "https://linkedin.com/in/jane",
  "Company website": "https://example.com",
};

const ctx: FieldContext = {
  coreOffering: "AI Outreach",
  competitiveAdvantages: "10x faster",
  techStack: "NodeJS",
  caseStudies: "Acme grew 2x",
  leadMagnets: "eBook",
  socialProof: "500+ clients",
  valueProp: "Save time",
  painPoints: "manual outreach",
  successStories: "Closed deals",
  campaignLanguage: "en",
  signOffs: "Best regards",
  tone: "friendly",
  ctas: "Book a call",
};

describe("generateMessagesAI fallback", () => {
  it("should fallback to template when no OPENAI_API_KEY", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const msgs = await generateMessagesAI(lead, ctx);
    expect(msgs.connection_request).toContain("Jane");
    expect(msgs.linkedin_message).toContain("Acme");
    process.env.OPENAI_API_KEY = prev;
  });
}); 