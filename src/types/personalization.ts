export type LeadRow = Record<string, string> & {
  "First name": string;
  "Last name": string;
  Title: string;
  Company: string;
  Location: string;
  "Linkedin url": string;
  "Company website": string;
};

export interface FieldContext {
  coreOffering: string;
  competitiveAdvantages: string;
  techStack: string;
  caseStudies: string;
  leadMagnets: string;
  socialProof: string;
  valueProp: string;
  painPoints: string;
  successStories: string;
  campaignLanguage: string;
  signOffs: string;
  tone: string;
  ctas: string;
} 