/**
 * Email Message Generation Template
 * 
 * Creates hyper-personalized cold emails following best practices:
 * - Compelling subject line
 * - Hyper-personalized opening
 * - Clear WIIFM (What's In It For Me)
 * - Scannable format with bullets
 * - Single, clear CTA
 * - Professional yet human tone
 */

import { type WebsiteAnalysisData, type PersonalizationElement, type MessageRecipient } from '../message-generation-service'

export interface EmailMessageContext {
  websiteAnalysis: WebsiteAnalysisData
  recipient: MessageRecipient
  personalization: PersonalizationElement
  sender: {
    name: string
    role: string
    company: string
    email: string
  }
  messageVariant: number
  toneOfVoice: string
}

export const createEmailMessagePrompt = (context: EmailMessageContext): string => {
  const { websiteAnalysis, recipient, personalization, sender, messageVariant, toneOfVoice } = context

  const basePrompt = `
You are an expert at writing cold emails that get opened and responded to. Generate a compelling cold email based on the following context:

**SENDER PROFILE:**
- Name: ${sender.name}
- Role: ${sender.role}
- Company: ${sender.company}
- Email: ${sender.email}

**RECIPIENT PROFILE:**
- Name: ${recipient.name}
- Role: ${recipient.role}
- Company: ${recipient.company}
- Industry: ${recipient.industry || websiteAnalysis.industry}

**PERSONALIZATION HOOK:**
- Type: ${personalization.type}
- Content: ${personalization.content}
- Context: ${personalization.context}

**OUR BUSINESS:**
- Core Offering: ${websiteAnalysis.core_offer}
- Industry: ${websiteAnalysis.industry}
- Business Model: ${websiteAnalysis.business_model}
- Key Advantages: ${websiteAnalysis.competitive_advantages.join(', ')}
- Target Personas: ${websiteAnalysis.target_personas.map(p => p.role || p.title).join(', ')}
- Tech Stack: ${websiteAnalysis.tech_stack.join(', ')}
- Social Proof: ${Array.isArray(websiteAnalysis.social_proof) 
    ? websiteAnalysis.social_proof.join(', ') 
    : (typeof websiteAnalysis.social_proof === 'object' && websiteAnalysis.social_proof && 
       'testimonials' in websiteAnalysis.social_proof ? 
       (websiteAnalysis.social_proof as any).testimonials?.map((t: any) => t.quote || t.author || '').filter(Boolean).join(', ') || 'Customer success stories' :
       'Customer success stories')}
- Website: ${websiteAnalysis.website_url}

**EMAIL REQUIREMENTS:**
1. Generate both subject line and email body
2. Subject line: Curiosity-driven or benefit-focused (under 50 characters)
3. Opening line: 100% personalized (reference their ${personalization.type})
4. Body: Focus on recipient's pain points and specific benefits
5. Use bullet points for easy scanning
6. Include quantifiable benefits where possible
7. End with low-friction ask (not immediate meeting)
8. Professional signature
9. Avoid spam trigger words
10. Keep total email under 150 words
11. CRITICAL: Use a ${toneOfVoice.toLowerCase()} tone throughout the entire email
12. Ensure the tone reflects ${toneOfVoice} characteristics (${getToneDescription(toneOfVoice)})

**STRUCTURE VARIANTS** (Use variant ${messageVariant}):
${getEmailStructureVariants()}

**OUTPUT FORMAT:**
Subject: [subject line]

[email body with proper formatting]

Best regards,
${sender.name}
${sender.role}
${sender.company}
${sender.email}

Generate the complete email following the specified variant structure.
`

  return basePrompt
}

const getToneDescription = (tone: string): string => {
  const toneDescriptions: Record<string, string> = {
    'Urgent': 'pressing and immediate, emphasizing the importance of quick action',
    'Professional': 'formal and respectful, maintaining a business-like demeanor',
    'Supportive': 'encouraging and helpful, offering assistance and understanding',
    'Sincere': 'genuine and honest, building trust through authenticity',
    'Storytelling': 'engaging and narrative, using compelling stories to connect',
    'Challenging': 'provocative and thought-provoking, questioning the status quo',
    'Confident': 'assured and self-assured, demonstrating expertise and authority',
    'Friendly': 'warm and approachable, creating a personal connection with enthusiasm'
  }
  return toneDescriptions[tone] || 'professional and appropriate for business communication'
}

const getEmailStructureVariants = (): string => {
  return `
Variant 1: Problem-Agitate-Solve (PAS)
- Hook with personalization
- Agitate the problem
- Present solution benefits
- Soft CTA

Variant 2: Before-After-Bridge (BAB)
- Current state (their challenge)
- Desired future state
- Bridge (our solution)
- Interest check

Variant 3: Attention-Interest-Desire-Action (AIDA)
- Grab attention with personalization
- Build interest with insights
- Create desire with benefits
- Call to action

Variant 4: Social Proof + Value
- Personalized opening
- Similar customer success
- Specific benefits/results
- Resource offer

Variant 5: Question-Problem-Solution-Benefit
- Engaging question
- Identify problem
- Hint at solution
- Quantified benefit
`
}

export const emailMessageExamples = {
  variant1: {
    structure: "Problem-Agitate-Solve (PAS)",
    subject: "Re: [Specific Reference]",
    example: `Hi [Name],

Noticed [specific personalization hook].

Most [role] at [similar companies] struggle with [specific problem] - costing them [quantified impact]. The manual approaches just don't scale.

We've helped [similar company] achieve:
• [Specific metric/result]
• [Time/cost savings]
• [Efficiency gain]

Worth a quick conversation to see if similar results are possible for [Company]?

Best regards,`
  },
  variant2: {
    structure: "Before-After-Bridge (BAB)",
    subject: "[Benefit] for [Company]?",
    example: `Hi [Name],

Saw [personalization reference] - impressive work on [specific detail].

Right now: [Current challenging situation]
Imagine: [Desired future state with benefits]

We've bridged this gap for [similar companies] using [solution approach], resulting in [specific outcomes].

Quick question: Is [related challenge] on your radar for [time period]?

Best regards,`
  },
  variant3: {
    structure: "AIDA",
    subject: "Quick question about [Topic]",
    example: `Hi [Name],

Your recent [personalization hook] caught my attention - particularly [specific detail].

[Industry insight or trend] is creating new challenges for [role] like yourself. We're seeing companies struggle with [specific problem].

Our [solution] has helped [similar companies]:
• [Benefit 1 with metric]
• [Benefit 2 with outcome]

Would this be relevant for [Company]'s current priorities?

Best regards,`
  },
  variant4: {
    structure: "Social Proof + Value",
    subject: "How [Similar Company] achieved [Result]",
    example: `Hi [Name],

Congrats on [personalization reference] - [specific comment about it].

[Similar Company], facing similar [challenge] as [Company], achieved [specific result] in [timeframe] using our [solution].

Key outcomes:
• [Metric 1]
• [Metric 2]
• [Efficiency/cost benefit]

Worth exploring if similar results are possible for [Company]?

Best regards,`
  },
  variant5: {
    structure: "Question-Problem-Solution-Benefit",
    subject: "[Question about their situation]",
    example: `Hi [Name],

Following [personalization hook] - how are you currently handling [related challenge]?

Most [role] we speak with find [specific problem] takes [time/resources] and impacts [business outcome].

Our [solution approach] typically delivers [quantified benefit] by [how it works].

Would be interested to learn about [Company]'s approach to [relevant area].

Best regards,`
  }
} 