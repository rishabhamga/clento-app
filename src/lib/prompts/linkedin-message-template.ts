/**
 * LinkedIn Message Generation Template
 * 
 * Creates hyper-personalized LinkedIn messages following best practices:
 * - Under 150 words
 * - Reference recent posts/activity
 * - Role-specific pain points
 * - Clear value proposition
 * - Soft ask (no immediate meeting request)
 */

import { type WebsiteAnalysisData, type PersonalizationElement, type MessageRecipient } from '../message-generation-service'

export interface LinkedInMessageContext {
  websiteAnalysis: WebsiteAnalysisData
  recipient: MessageRecipient
  personalization: PersonalizationElement
  sender: {
    name: string
    role: string
    company: string
  }
  messageVariant: number
  toneOfVoice: string
}

export const createLinkedInMessagePrompt = (context: LinkedInMessageContext): string => {
  const { websiteAnalysis, recipient, personalization, sender, messageVariant, toneOfVoice } = context

  const basePrompt = `
You are an expert at writing hyper-personalized LinkedIn messages that get responses. Generate a compelling LinkedIn DM based on the following context:

**SENDER PROFILE:**
- Name: ${sender.name}
- Role: ${sender.role}
- Company: ${sender.company}

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
- Key Advantages: ${websiteAnalysis.competitive_advantages.slice(0, 2).join(', ')}
- Target Personas: ${websiteAnalysis.target_personas.map(p => p.role || p.title).slice(0, 2).join(', ')}
- Website: ${websiteAnalysis.website_url}

**MESSAGE REQUIREMENTS:**
1. Start with the personalization hook (reference their ${personalization.type})
2. Keep it under 150 words
3. Be conversational and genuine
4. Connect their challenge/interest to our solution
5. End with a soft ask (NOT a meeting request)
6. IMPORTANT: Use a ${toneOfVoice.toLowerCase()} tone throughout the entire message
7. No salesy language or buzzwords
8. Ensure the tone reflects ${toneOfVoice} characteristics (${getToneDescription(toneOfVoice)})

**STRUCTURE VARIANTS** (Use variant ${messageVariant}):
${getLinkedInStructureVariants()}

Generate ONLY the message content, no subject line or additional formatting.
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

const getLinkedInStructureVariants = (): string => {
  return `
Variant 1: Hook + Insight + Value + Soft Ask
- Lead with personalization
- Share relevant insight
- Mention specific value
- Ask for opinion/feedback

Variant 2: Hook + Question + Value + Connection Ask
- Reference their content/activity
- Ask thoughtful question
- Share brief value prop
- Suggest connection

Variant 3: Hook + Compliment + Help + Resource Share
- Acknowledge their work
- Offer specific help
- Share relevant resource
- No immediate ask

Variant 4: Hook + Common Challenge + Solution Hint + Interest Check
- Reference their situation
- Mention common challenge
- Hint at solution approach
- Check if relevant

Variant 5: Hook + Industry Insight + Value Prop + Opinion Ask
- Reference their post/news
- Share industry perspective
- Quick value mention
- Ask for their thoughts
`
}

export const linkedInMessageExamples = {
  variant1: {
    structure: "Hook + Insight + Value + Soft Ask",
    example: `Hi [Name], saw your post about [specific topic]. Your point about [specific detail] really resonated - we're seeing similar challenges with [relevant insight]. We've helped [similar companies] [specific result] through [brief solution]. Would love to know if this aligns with what you're seeing in your space?`
  },
  variant2: {
    structure: "Hook + Question + Value + Connection Ask",
    example: `[Name], loved your take on [specific post topic]. Quick question - how are you currently handling [related challenge]? We've developed an approach that's helped [similar role] at [similar companies] [specific outcome]. Would be interested to connect and hear your perspective.`
  },
  variant3: {
    structure: "Hook + Compliment + Help + Resource Share",
    example: `Hi [Name], impressive work on [specific achievement/post]. Having worked with [similar companies], I know how challenging [related issue] can be. Thought you might find this [relevant resource] helpful - no agenda, just sharing what's worked for others in your situation.`
  },
  variant4: {
    structure: "Hook + Common Challenge + Solution Hint + Interest Check",
    example: `[Name], noticed you're at [Company] - congrats on [recent news]. Most [role] in [industry] we talk to mention [common challenge]. We've found [solution approach] can [specific benefit]. Does this sound relevant to your current priorities?`
  },
  variant5: {
    structure: "Hook + Industry Insight + Value Prop + Opinion Ask",
    example: `Hi [Name], your recent post about [topic] was spot on. We're seeing similar trends with [specific insight] across [industry]. Our [solution] has helped [type of companies] [outcome]. Curious what your thoughts are on [related trend]?`
  }
} 