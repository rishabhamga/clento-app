import type { FieldContext, LeadRow } from "../types/personalization";
import type { CompanyEnrichment } from "./company-enrichment";

export interface GeneratedMessages {
  connection_request: string;
  linkedin_message: string;
  follow_up_message: string;
}

function insert(template: string, vars: Record<string, string | undefined>) {
  return template.replace(/{{(\w+)}}/g, (_, k) => vars[k] ?? "");
}

export function generateMessages(
  lead: LeadRow,
  ctx: FieldContext,
  enrichment?: CompanyEnrichment
): GeneratedMessages {
  const vars = {
    firstName: lead["First name"],
    title: lead["Title"],
    company: lead["Company"],
    coreOffering: ctx.coreOffering,
    competitiveAdvantages: ctx.competitiveAdvantages,
    valueProp: ctx.valueProp,
    painPoints: ctx.painPoints,
    caseStudies: ctx.caseStudies,
    signOffs: ctx.signOffs,
  } as Record<string, string | undefined>;

  const connectionTemplate =
    "Hi {{firstName}}, impressed by your work as {{title}} at {{company}}. I share insights on {{coreOffering}}—thought to connect and exchange ideas!";

  const msgTemplate =
    "Hi {{firstName}}, I was reading about {{company}} and noticed {{companyDescription}}. Given your role as {{title}}, our {{valueProp}} could help. {{competitiveAdvantages}} Curious if it makes sense to chat?";

  const followTemplate =
    "Hi {{firstName}}, following up—companies tackling {{painPoints}} (like {{company}}) have seen success with our {{coreOffering}} (e.g., {{caseStudies}}). Would it be worth a quick look? {{signOffs}}";

  // extend vars with enrichment
  if (enrichment?.description) vars["companyDescription"] = enrichment.description;

  return {
    connection_request: insert(connectionTemplate, vars),
    linkedin_message: insert(msgTemplate, vars),
    follow_up_message: insert(followTemplate, vars),
  };
} 