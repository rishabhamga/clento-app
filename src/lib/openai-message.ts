import OpenAI from "openai";
import type { LeadRow } from "@/types/personalization";
import type { FieldContext } from "@/types/personalization";
import type { CompanyEnrichment } from "./company-enrichment";
import { generateMessages as fallbackTemplate } from "./message-generator";

export interface AIMessageOutput {
  connection_request: string;
  linkedin_message: string;
  follow_up_message: string;
}

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

/**
 * Safely calls OpenAI to generate three outreach messages. Falls back to template generator on error or missing key.
 */
export async function generateMessagesAI(
  lead: LeadRow,
  ctx: FieldContext,
  enrichment?: CompanyEnrichment
): Promise<AIMessageOutput> {
  if (!openai) {
    // Fallback
    return fallbackTemplate(lead, ctx, enrichment);
  }

  const sysPrompt = `You are an expert SDR copywriter. Craft concise, personalized LinkedIn messages (<=300 chars for connection; <=500 chars for messages) using the provided details. Use a ${ctx.tone} tone.`;

  const userPrompt = {
    lead,
    productContext: ctx,
    enrichment,
    instructions: `Return JSON with keys connection_request, linkedin_message, follow_up_message.`,
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // choose economical model
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: JSON.stringify(userPrompt) },
      ],
    });

    const jsonContent = completion.choices[0].message.content ?? "";
    const parsed = JSON.parse(jsonContent);
    if (
      parsed.connection_request &&
      parsed.linkedin_message &&
      parsed.follow_up_message
    ) {
      return parsed as AIMessageOutput;
    }
    throw new Error("Malformed AI response");
  } catch (err) {
    console.warn("OpenAI generation failed, falling back", err);
    return fallbackTemplate(lead, ctx, enrichment);
  }
} 