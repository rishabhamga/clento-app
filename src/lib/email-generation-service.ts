import OpenAI from "openai";
import type { 
  EmailLeadRow, 
  EmailFieldContext, 
  EmailSequenceOutput, 
  EnhancedCompanyEnrichment, 
  CampaignContext 
} from "@/types/email-personalization";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

export class EmailGenerationService {
  
  /**
   * Generate personalized email sequence (1 initial + 4 follow-ups) using campaign context
   */
  async generateEmailSequence(
    lead: EmailLeadRow,
    campaignContext: CampaignContext,
    enrichment?: EnhancedCompanyEnrichment
  ): Promise<EmailSequenceOutput> {
    if (!openai) {
      console.warn('OpenAI not configured, falling back to template generation');
      return this.generateTemplateEmailSequence(lead, campaignContext, enrichment);
    }

    try {
      const systemPrompt = this.createSystemPrompt(campaignContext);
      const userPrompt = this.createUserPrompt(lead, campaignContext, enrichment);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPrompt) },
        ],
      });

      const jsonContent = completion.choices[0].message.content ?? "";
      const parsed = JSON.parse(jsonContent);

      // Validate the response has all required fields
      if (this.validateEmailSequence(parsed)) {
        return this.formatEmailSequence(parsed, campaignContext);
      } else {
        console.warn('Invalid AI response format, falling back to template');
        return this.generateTemplateEmailSequence(lead, campaignContext, enrichment);
      }

    } catch (error) {
      console.error('Email generation failed:', error);
      return this.generateTemplateEmailSequence(lead, campaignContext, enrichment);
    }
  }

  /**
   * Create system prompt for email generation with campaign context
   */
  private createSystemPrompt(campaignContext: CampaignContext): string {
    const toneOfVoice = campaignContext.outreach.toneOfVoice || 'professional';
    const language = campaignContext.outreach.campaignLanguage || 'English';

    return `You are an expert email copywriter specializing in B2B sales outreach. Your task is to create a personalized email sequence consisting of 1 initial email and 4 follow-up emails.

CAMPAIGN CONTEXT:
- Campaign: ${campaignContext.campaignName}
- Tone: ${toneOfVoice}
- Language: ${language}

EMAIL GUIDELINES:
${campaignContext.coachingPoints.map(cp => `- ${cp.instruction}`).join('\n')}

EMAIL-SPECIFIC GUIDELINES:
${campaignContext.emailCoachingPoints.map(ecp => `- ${ecp.instruction}`).join('\n')}

PAIN POINTS TO ADDRESS:
${campaignContext.painPoints.map(pp => `- ${pp.title}: ${pp.description}`).join('\n')}

PROOF POINTS TO LEVERAGE:
${campaignContext.proofPoints.map(pp => `- ${pp.title}: ${pp.description}`).join('\n')}

CALLS TO ACTION:
${campaignContext.outreach.callsToAction.join(', ')}

SIGN OFFS TO USE:
${campaignContext.outreach.signOffs.join(', ')}

EMAIL SEQUENCE STRATEGY:
1. Initial Email: Warm introduction with personalization and value proposition
2. Follow-up 1: Reference initial email, add social proof or case study
3. Follow-up 2: Different angle - focus on pain point resolution
4. Follow-up 3: Urgency or scarcity, include strong CTA
5. Follow-up 4: Final attempt with alternative approach or offer

REQUIREMENTS:
- Each email should be 150-250 words
- Subject lines should be under 60 characters
- Use personalization from lead and company data
- Progressive engagement approach - each email should build on the previous
- Include specific value propositions from campaign context
- Maintain consistent tone throughout sequence
- Each email must have a clear call to action
- Avoid being pushy or sales-heavy in early emails

Return JSON with: initial_email, follow_up_email_1, follow_up_email_2, follow_up_email_3, follow_up_email_4, and subject_lines object with initial, followUp1, followUp2, followUp3, followUp4 keys.`;
  }

  /**
   * Create user prompt with lead and enrichment data
   */
  private createUserPrompt(
    lead: EmailLeadRow,
    campaignContext: CampaignContext,
    enrichment?: EnhancedCompanyEnrichment
  ): any {
    return {
      lead: {
        firstName: lead["First name"],
        lastName: lead["Last name"],
        title: lead.Title,
        company: lead.Company,
        location: lead.Location,
        email: lead.Email,
        linkedinUrl: lead["Linkedin url"]
      },
      companyData: {
        website: lead["Company website"],
        description: enrichment?.description,
        techStack: enrichment?.techStackHints,
        industry: enrichment?.linkedInData?.industry,
        companySize: enrichment?.linkedInData?.companySize,
        recentNews: enrichment?.headlines,
        linkedInFollowers: enrichment?.linkedInData?.followers,
        recentPosts: enrichment?.linkedInData?.recentPosts
      },
      leadProfile: {
        headline: enrichment?.leadLinkedInData?.profileData?.headline,
        summary: enrichment?.leadLinkedInData?.profileData?.summary,
        experience: enrichment?.leadLinkedInData?.profileData?.experience,
        skills: enrichment?.leadLinkedInData?.profileData?.skills,
        recentActivity: enrichment?.leadLinkedInData?.recentActivity
      },
      websiteAnalysis: campaignContext.websiteAnalysis,
      scrapingErrors: enrichment?.scrapingErrors || {},
      personalizationSources: campaignContext.outreach.personalizationSources,
      instructions: `Generate a complete email sequence that progressively engages ${lead["First name"]} at ${lead.Company}. Use the provided data for personalization but don't mention data that failed to scrape. Focus on value delivery and building relationship before asking for meetings.`
    };
  }

  /**
   * Validate AI response format
   */
  private validateEmailSequence(parsed: any): boolean {
    const requiredFields = [
      'initial_email',
      'follow_up_email_1', 
      'follow_up_email_2',
      'follow_up_email_3',
      'follow_up_email_4',
      'subject_lines'
    ];

    const requiredSubjectLines = [
      'initial',
      'followUp1',
      'followUp2', 
      'followUp3',
      'followUp4'
    ];

    const hasAllFields = requiredFields.every(field => parsed[field]);
    const hasAllSubjects = parsed.subject_lines && 
      requiredSubjectLines.every(subject => parsed.subject_lines[subject]);

    return hasAllFields && hasAllSubjects;
  }

  /**
   * Format and enhance email sequence with metadata
   */
  private formatEmailSequence(
    parsed: any, 
    campaignContext: CampaignContext
  ): EmailSequenceOutput {
    return {
      initial_email: parsed.initial_email,
      follow_up_email_1: parsed.follow_up_email_1,
      follow_up_email_2: parsed.follow_up_email_2,
      follow_up_email_3: parsed.follow_up_email_3,
      follow_up_email_4: parsed.follow_up_email_4,
      subject_lines: {
        initial: parsed.subject_lines.initial,
        followUp1: parsed.subject_lines.followUp1,
        followUp2: parsed.subject_lines.followUp2,
        followUp3: parsed.subject_lines.followUp3,
        followUp4: parsed.subject_lines.followUp4
      },
      personalization_score: this.calculatePersonalizationScore(parsed),
      campaign_reference: campaignContext.campaignId
    };
  }

  /**
   * Calculate personalization score based on content analysis
   */
  private calculatePersonalizationScore(emailSequence: any): number {
    let score = 0;
    const emails = [
      emailSequence.initial_email,
      emailSequence.follow_up_email_1,
      emailSequence.follow_up_email_2,
      emailSequence.follow_up_email_3,
      emailSequence.follow_up_email_4
    ];

    emails.forEach(email => {
      const content = email.toLowerCase();
      
      // Check for personalization indicators
      if (content.includes('{{') || content.includes('[')) score += 10; // Template variables
      if (content.includes('company') || content.includes('organization')) score += 5;
      if (content.includes('recent') || content.includes('latest')) score += 8;
      if (content.includes('industry') || content.includes('sector')) score += 6;
      if (content.includes('challenge') || content.includes('pain')) score += 7;
      if (content.includes('growth') || content.includes('scale')) score += 5;
    });

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Fallback template generation when AI is not available
   */
  private generateTemplateEmailSequence(
    lead: EmailLeadRow,
    campaignContext: CampaignContext,
    enrichment?: EnhancedCompanyEnrichment
  ): EmailSequenceOutput {
    const firstName = lead["First name"];
    const company = lead.Company;
    const title = lead.Title;
    const signOff = campaignContext.outreach.signOffs[0] || "Best regards";
    const mainCTA = campaignContext.outreach.callsToAction[0] || "Would you be interested in learning more?";
    
    const companyInfo = enrichment?.description ? ` I noticed ${company} ${enrichment.description.toLowerCase()}` : '';
    const techStack = enrichment?.techStackHints?.length ? ` and you're using ${enrichment.techStackHints.slice(0, 2).join(' and ')}` : '';
    
    return {
      initial_email: `Hi ${firstName},

I hope you're doing well! As ${title} at ${company}, I imagine you're focused on driving growth and efficiency.${companyInfo}${techStack}.

At our company, we help businesses like ${company} ${campaignContext.painPoints[0]?.description || 'overcome operational challenges'} through ${campaignContext.websiteAnalysis?.coreOffer || 'innovative solutions'}.

${mainCTA}

${signOff},
[Your Name]`,

      follow_up_email_1: `Hi ${firstName},

I wanted to follow up on my previous email about helping ${company} ${campaignContext.proofPoints[0]?.title || 'achieve better results'}.

${campaignContext.proofPoints[0]?.description || 'We\'ve helped similar companies achieve significant improvements.'} One of our recent clients saw ${campaignContext.websiteAnalysis?.socialProof?.metrics[0]?.value || '30%'} improvement in ${campaignContext.websiteAnalysis?.socialProof?.metrics[0]?.metric || 'efficiency'}.

Would you be open to a brief 15-minute call to discuss how this could apply to ${company}?

${signOff},
[Your Name]`,

      follow_up_email_2: `Hi ${firstName},

I understand you're busy, but I wanted to share something specific that might resonate with your challenges at ${company}.

${campaignContext.painPoints[1]?.description || 'Many companies in your industry struggle with scalability issues'}. We recently helped a similar ${enrichment?.linkedInData?.industry || 'company'} overcome this exact challenge.

The approach we used could potentially help ${company} ${campaignContext.websiteAnalysis?.targetPersonas[0]?.desiredOutcomes[0] || 'achieve similar results'}.

Are you available for a quick call this week?

${signOff},
[Your Name]`,

      follow_up_email_3: `Hi ${firstName},

I realize I haven't heard back, which usually means one of two things:
1) You're incredibly busy (which I totally understand), or  
2) This isn't a priority right now.

If it's #1, I'd love to work around your schedule. ${campaignContext.websiteAnalysis?.caseStudies[0]?.results[0] || 'Our solution typically shows results within 30 days'}.

If it's #2, no worries at all – just let me know and I'll stop reaching out.

${mainCTA}

${signOff},
[Your Name]`,

      follow_up_email_4: `Hi ${firstName},

This will be my last email as I don't want to be a bother.

I noticed ${company} is ${enrichment?.headlines?.[0]?.title ? `in the news recently (${enrichment.headlines[0].title})` : 'growing rapidly'}, which often means ${campaignContext.painPoints[0]?.title || 'new challenges'} become more pressing.

If you ever want to explore how we can help ${company} ${campaignContext.websiteAnalysis?.targetPersonas[0]?.desiredOutcomes[0] || 'overcome these challenges'}, my door is always open.

Wishing you and the team at ${company} continued success!

${signOff},
[Your Name]`,

      subject_lines: {
        initial: `Quick question about ${company}'s growth`,
        followUp1: `Re: ${company} - ${campaignContext.proofPoints[0]?.title || 'Results'} example`,
        followUp2: `${firstName}, specific to ${company}`,
        followUp3: `Should I stop reaching out?`,
        followUp4: `Final note - ${company}`
      },
      personalization_score: 65,
      campaign_reference: campaignContext.campaignId
    };
  }

  /**
   * Generate sample CSV data for download
   */
  generateSampleCSV(): string {
    const sampleData = [
      {
        "First name": "John",
        "Last name": "Smith", 
        "Title": "VP of Marketing",
        "Company": "TechCorp Inc",
        "Location": "San Francisco, CA",
        "Linkedin url": "https://linkedin.com/in/johnsmith",
        "Company website": "https://techcorp.com",
        "Email": "john.smith@techcorp.com"
      },
      {
        "First name": "Sarah",
        "Last name": "Johnson",
        "Title": "Head of Sales",
        "Company": "Growth Dynamics",
        "Location": "New York, NY", 
        "Linkedin url": "https://linkedin.com/in/sarahjohnson",
        "Company website": "https://growthdynamics.com",
        "Email": "sarah@growthdynamics.com"
      },
      {
        "First name": "Michael",
        "Last name": "Chen",
        "Title": "CTO",
        "Company": "Innovation Labs",
        "Location": "Austin, TX",
        "Linkedin url": "https://linkedin.com/in/michaelchen",
        "Company website": "https://innovationlabs.io",
        "Email": "m.chen@innovationlabs.io"
      }
    ];

    // Convert to CSV
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}

// Export singleton instance
export const emailGenerationService = new EmailGenerationService();