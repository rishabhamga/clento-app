import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { createLinkedInMessagePrompt, type LinkedInMessageContext } from '@/lib/prompts/linkedin-message-template'
import { createEmailMessagePrompt, type EmailMessageContext } from '@/lib/prompts/email-message-template'
import { generateSampleProspects, type WebsiteAnalysisData } from '@/lib/message-generation-service'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Types for the request and response
interface OutreachData {
  campaignLanguage: string
  signOffs: string[]
  toneOfVoice: string
  callsToAction: string[]
  messagePersonalization: boolean
}

interface GenerateMessagesRequest {
  websiteAnalysis: {
    core_offer: string
    industry: string
    business_model: string
    icp_summary: string
    target_personas: any[]
    competitive_advantages: string[]
    tech_stack: string[]
    social_proof: string[]
    website_url: string
  }
  outreach?: OutreachData
  messageCount?: number // Optional, defaults to 5 each
}

interface PersonalizationElement {
  type: 'recent_post' | 'company_news' | 'funding' | 'product_launch' | 'role_change' | 'industry_trend'
  content: string
  context: string
}

interface GeneratedMessage {
  id: string
  type: 'linkedin' | 'email'
  variant: number
  content: {
    subject?: string // For emails
    message: string
    personalization: PersonalizationElement
    sender: {
      name: string
      role: string
      company: string
    }
    recipient: {
      name: string
      role: string
      company: string
      industry: string
    }
  }
  metadata: {
    generated_at: string
    personalization_strength: 'high' | 'medium' | 'low'
    estimated_response_rate: number
  }
}

interface GenerateMessagesResponse {
  success: boolean
  linkedinMessages: GeneratedMessage[]
  emailMessages: GeneratedMessage[]
  totalGenerated: number
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateMessagesResponse>> {
  console.log('🚀 [SAMPLE MESSAGES API] Starting message generation request')
  
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ [SAMPLE MESSAGES API] OPENAI_API_KEY not found in environment variables')
    return NextResponse.json({
      success: false,
      linkedinMessages: [],
      emailMessages: [],
      totalGenerated: 0,
      error: 'OpenAI API key not configured'
    }, { status: 500 })
  }
  
  console.log('✅ [SAMPLE MESSAGES API] OpenAI API key found:', {
    keyLength: process.env.OPENAI_API_KEY.length,
    keyPrefix: process.env.OPENAI_API_KEY.substring(0, 10) + '...'
  })
  
  try {
    const { userId } = await auth()
    console.log('👤 [SAMPLE MESSAGES API] User ID:', userId)
    
    if (!userId) {
      console.error('❌ [SAMPLE MESSAGES API] No user ID found - unauthorized request')
      return NextResponse.json({ 
        success: false, 
        linkedinMessages: [], 
        emailMessages: [], 
        totalGenerated: 0, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const body: GenerateMessagesRequest = await request.json()
    console.log('📋 [SAMPLE MESSAGES API] Request body received:', {
      hasWebsiteAnalysis: !!body.websiteAnalysis,
      messageCount: body.messageCount,
      websiteUrl: body.websiteAnalysis?.website_url,
      coreOffer: body.websiteAnalysis?.core_offer,
      industry: body.websiteAnalysis?.industry
    })
    
    if (!body.websiteAnalysis) {
      console.error('❌ [SAMPLE MESSAGES API] Missing website analysis data')
      return NextResponse.json({ 
        success: false, 
        linkedinMessages: [], 
        emailMessages: [], 
        totalGenerated: 0, 
        error: 'Website analysis data is required' 
      }, { status: 400 })
    }

    const messageCount = body.messageCount || 1
    const { websiteAnalysis, outreach } = body

    console.log('⚙️ [SAMPLE MESSAGES API] Starting message generation with count:', messageCount)
    console.log('📊 [SAMPLE MESSAGES API] Website analysis structure:', {
      coreOffer: websiteAnalysis.core_offer,
      industry: websiteAnalysis.industry,
      businessModel: websiteAnalysis.business_model,
      icpSummary: websiteAnalysis.icp_summary,
      targetPersonasCount: websiteAnalysis.target_personas?.length || 0,
      competitiveAdvantagesCount: websiteAnalysis.competitive_advantages?.length || 0,
      techStackCount: websiteAnalysis.tech_stack?.length || 0,
      socialProofCount: websiteAnalysis.social_proof?.length || 0
    })
    console.log('🎛️ [SAMPLE MESSAGES API] Outreach configuration:', {
      campaignLanguage: outreach?.campaignLanguage,
      toneOfVoice: outreach?.toneOfVoice,
      signOffsCount: outreach?.signOffs?.length || 0,
      callsToActionCount: outreach?.callsToAction?.length || 0,
      messagePersonalization: outreach?.messagePersonalization
    })

    // Generate LinkedIn messages
    console.log('📱 [SAMPLE MESSAGES API] Generating LinkedIn messages...')
    const linkedinMessages = await generateLinkedInMessages(websiteAnalysis, messageCount, outreach)
    console.log('✅ [SAMPLE MESSAGES API] LinkedIn messages generated:', linkedinMessages.length)
    
    // Generate email messages  
    console.log('📧 [SAMPLE MESSAGES API] Generating email messages...')
    const emailMessages = await generateEmailMessages(websiteAnalysis, messageCount, outreach)
    console.log('✅ [SAMPLE MESSAGES API] Email messages generated:', emailMessages.length)

    const response = {
      success: true,
      linkedinMessages,
      emailMessages,
      totalGenerated: linkedinMessages.length + emailMessages.length
    }

    console.log('🎉 [SAMPLE MESSAGES API] Successfully generated messages:', {
      linkedinCount: linkedinMessages.length,
      emailCount: emailMessages.length,
      totalGenerated: response.totalGenerated,
      linkedinSample: linkedinMessages[0]?.content?.message?.substring(0, 100),
      emailSample: emailMessages[0]?.content?.message?.substring(0, 100)
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 [SAMPLE MESSAGES API] Fatal error in message generation:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      success: false,
      linkedinMessages: [],
      emailMessages: [],
      totalGenerated: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

async function generateLinkedInMessages(
  analysis: GenerateMessagesRequest['websiteAnalysis'], 
  count: number,
  outreach?: OutreachData
): Promise<GeneratedMessage[]> {
  console.log('📱 [LINKEDIN GEN] Starting LinkedIn message generation:', { count, industry: analysis.industry })
  const messages: GeneratedMessage[] = []
  
  // Generate sample prospects for message personalization
  console.log('👥 [LINKEDIN GEN] Generating sample prospects...')
  const prospects = generateSampleProspects(analysis, count)
  console.log('✅ [LINKEDIN GEN] Generated prospects:', prospects.map(p => ({ name: p.name, role: p.role, personalizationType: p.personalization.type })))
  
  // Generate messages using the new template system
  for (let i = 0; i < count; i++) {
    console.log(`📝 [LINKEDIN GEN] Generating message ${i + 1}/${count}`)
    const prospect = prospects[i % prospects.length]
    const variant = (i % 5) + 1
    
    try {
      const context: LinkedInMessageContext = {
        websiteAnalysis: analysis,
        recipient: prospect,
        personalization: prospect.personalization,
        sender: {
          name: 'Alex Rodriguez',
          role: 'Business Development Manager',
          company: getCompanyNameFromUrl(analysis.website_url)
        },
        messageVariant: variant,
        toneOfVoice: outreach?.toneOfVoice || 'Professional'
      }
      
      console.log(`🎯 [LINKEDIN GEN] Message ${i + 1} context:`, {
        recipient: prospect.name,
        personalizationType: prospect.personalization.type,
        variant: variant
      })
      
      const prompt = createLinkedInMessagePrompt(context)
      console.log(`📋 [LINKEDIN GEN] Generated prompt for message ${i + 1}, length:`, prompt.length)
      console.log(`📝 [LINKEDIN GEN] Full prompt for message ${i + 1}:`)
      console.log('='.repeat(80))
      console.log(prompt)
      console.log('='.repeat(80))
      console.log(`🎯 [LINKEDIN GEN] Context for message ${i + 1}:`, {
        recipient: {
          name: prospect.name,
          role: prospect.role,
          company: prospect.company,
          industry: prospect.industry
        },
        personalization: {
          type: prospect.personalization.type,
          content: prospect.personalization.content,
          context: prospect.personalization.context
        },
        sender: context.sender,
        messageVariant: variant,
        outreachSettings: outreach || 'none'
      })
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert LinkedIn messaging strategist who creates hyper-personalized outreach messages that get responses. Follow the prompt structure exactly and generate ONLY the message content as specified."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      })

      console.log(`🤖 [LINKEDIN GEN] OpenAI response for message ${i + 1}:`, {
        hasResponse: !!completion.choices[0]?.message?.content,
        responseLength: completion.choices[0]?.message?.content?.length || 0,
        responsePreview: completion.choices[0]?.message?.content?.substring(0, 100) || 'No content'
      })

      const messageContent = completion.choices[0]?.message?.content?.trim()
      if (!messageContent) throw new Error('No response from OpenAI')

      const generatedMessage = {
        id: `linkedin_${Date.now()}_${i}`,
        type: 'linkedin' as const,
        variant: variant,
        content: {
          message: messageContent,
          personalization: prospect.personalization,
          sender: context.sender,
          recipient: prospect
        },
        metadata: {
          generated_at: new Date().toISOString(),
          personalization_strength: 'high' as const,
          estimated_response_rate: Math.floor(Math.random() * 15) + 25 // 25-40%
        }
      }

      console.log(`✅ [LINKEDIN GEN] Message ${i + 1} generated successfully:`, {
        id: generatedMessage.id,
        messageLength: generatedMessage.content.message.length,
        messagePreview: generatedMessage.content.message.substring(0, 100)
      })

      messages.push(generatedMessage)
      
    } catch (error) {
      console.error(`❌ [LINKEDIN GEN] Message ${i + 1} generation failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        prospect: prospect.name
      })
      // Add fallback message if individual generation fails
      const fallbackMessages = generateFallbackLinkedInMessages(analysis, 1)
      if (fallbackMessages.length > 0) {
        console.log(`🔄 [LINKEDIN GEN] Using fallback message for ${i + 1}`)
        messages.push(fallbackMessages[0])
      }
    }
  }
  
  console.log(`🎉 [LINKEDIN GEN] Completed LinkedIn message generation: ${messages.length} messages`)
  
  // If we don't have enough messages, add fallback messages to reach the target count
  if (messages.length < count) {
    const additionalFallbacks = generateFallbackLinkedInMessages(analysis, count - messages.length)
    console.log(`🔄 [LINKEDIN GEN] Adding ${additionalFallbacks.length} additional fallback messages`)
    messages.push(...additionalFallbacks)
  }
  
  return messages.slice(0, count) // Ensure we don't exceed the requested count
}

async function generateEmailMessages(
  analysis: GenerateMessagesRequest['websiteAnalysis'], 
  count: number,
  outreach?: OutreachData
): Promise<GeneratedMessage[]> {
  console.log('📧 [EMAIL GEN] Starting email message generation:', { count, industry: analysis.industry })
  const messages: GeneratedMessage[] = []
  
  // Generate sample prospects for message personalization
  console.log('👥 [EMAIL GEN] Generating sample prospects...')
  const prospects = generateSampleProspects(analysis, count)
  console.log('✅ [EMAIL GEN] Generated prospects:', prospects.map(p => ({ name: p.name, role: p.role, personalizationType: p.personalization.type })))
  
  // Generate messages using the new template system
  for (let i = 0; i < count; i++) {
    console.log(`📝 [EMAIL GEN] Generating message ${i + 1}/${count}`)
    const prospect = prospects[i % prospects.length]
    const variant = (i % 5) + 1
    
    try {
      const context: EmailMessageContext = {
        websiteAnalysis: analysis,
        recipient: prospect,
        personalization: prospect.personalization,
        sender: {
          name: 'Alex Rodriguez',
          role: 'Business Development Manager',
          company: getCompanyNameFromUrl(analysis.website_url),
          email: `alex@${getCompanyNameFromUrl(analysis.website_url).toLowerCase()}.com`
        },
        messageVariant: variant,
        toneOfVoice: outreach?.toneOfVoice || 'Professional'
      }
      
      console.log(`🎯 [EMAIL GEN] Message ${i + 1} context:`, {
        recipient: prospect.name,
        personalizationType: prospect.personalization.type,
        variant: variant
      })
      
      const prompt = createEmailMessagePrompt(context)
      console.log(`📋 [EMAIL GEN] Generated prompt for message ${i + 1}, length:`, prompt.length)
      console.log(`📝 [EMAIL GEN] Full prompt for message ${i + 1}:`)
      console.log('='.repeat(80))
      console.log(prompt)
      console.log('='.repeat(80))
      console.log(`🎯 [EMAIL GEN] Context for message ${i + 1}:`, {
        recipient: {
          name: prospect.name,
          role: prospect.role,
          company: prospect.company,
          industry: prospect.industry
        },
        personalization: {
          type: prospect.personalization.type,
          content: prospect.personalization.content,
          context: prospect.personalization.context
        },
        sender: context.sender,
        messageVariant: variant,
        outreachSettings: outreach || 'none'
      })
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert cold email copywriter who creates hyper-personalized emails that get opened, read, and responded to. Follow the prompt structure exactly and generate the complete email as specified in the OUTPUT FORMAT."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800,
      })

      console.log(`🤖 [EMAIL GEN] OpenAI response for message ${i + 1}:`, {
        hasResponse: !!completion.choices[0]?.message?.content,
        responseLength: completion.choices[0]?.message?.content?.length || 0,
        responsePreview: completion.choices[0]?.message?.content?.substring(0, 100) || 'No content'
      })

      const emailResponse = completion.choices[0]?.message?.content?.trim()
      if (!emailResponse) throw new Error('No response from OpenAI')
      
      // Parse subject and body from the response
      const subjectMatch = emailResponse.match(/Subject:\s*(.+?)(?:\n|$)/i)
      const subject = subjectMatch ? subjectMatch[1].trim() : 'Quick question about your recent work'
      
      // Extract email body (everything after subject line until signature)
      const bodyMatch = emailResponse.match(/Subject:.*?\n\n([\s\S]*?)(?:\n\nBest regards,|$)/i)
      const messageContent = bodyMatch ? bodyMatch[1].trim() : emailResponse

      console.log(`📧 [EMAIL GEN] Parsed email ${i + 1}:`, {
        subject: subject,
        messageLength: messageContent.length,
        messagePreview: messageContent.substring(0, 100)
      })

      const generatedMessage = {
        id: `email_${Date.now()}_${i}`,
        type: 'email' as const,
        variant: variant,
        content: {
          subject: subject,
          message: messageContent,
          personalization: prospect.personalization,
          sender: context.sender,
          recipient: prospect
        },
        metadata: {
          generated_at: new Date().toISOString(),
          personalization_strength: 'high' as const,
          estimated_response_rate: Math.floor(Math.random() * 12) + 18 // 18-30%
        }
      }

      console.log(`✅ [EMAIL GEN] Message ${i + 1} generated successfully:`, {
        id: generatedMessage.id,
        subject: generatedMessage.content.subject,
        messageLength: generatedMessage.content.message.length
      })

      messages.push(generatedMessage)
      
    } catch (error) {
      console.error(`❌ [EMAIL GEN] Message ${i + 1} generation failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        prospect: prospect.name
      })
      // Add fallback message if individual generation fails
      const fallbackMessages = generateFallbackEmailMessages(analysis, 1)
      if (fallbackMessages.length > 0) {
        // Update the ID to match the expected sequence
        const fallbackMessage = {
          ...fallbackMessages[0],
          id: `email_fallback_${Date.now()}_${i}`
        }
        console.log(`🔄 [EMAIL GEN] Using fallback message for ${i + 1}`)
        messages.push(fallbackMessage)
      }
    }
  }
  
  console.log(`🎉 [EMAIL GEN] Completed email message generation: ${messages.length} messages`)
  
  // If we don't have enough messages, add fallback messages to reach the target count
  if (messages.length < count) {
    const additionalFallbacks = generateFallbackEmailMessages(analysis, count - messages.length)
    console.log(`🔄 [EMAIL GEN] Adding ${additionalFallbacks.length} additional fallback messages`)
    messages.push(...additionalFallbacks)
  }
  
  return messages.slice(0, count) // Ensure we don't exceed the requested count
}

function createLinkedInPrompt(
  analysis: GenerateMessagesRequest['websiteAnalysis'], 
  count: number,
  outreach?: OutreachData
): string {
  const primaryPersona = analysis.target_personas?.[0] || {}
  const competitiveAdvantages = analysis.competitive_advantages?.slice(0, 3).join(', ') || 'innovative solutions'
  const tone = outreach?.toneOfVoice || 'Professional'
  const ctaExamples = outreach?.callsToAction?.slice(0, 3).join(' | ') || 'Interested in learning more?'
  const signOffExample = outreach?.signOffs?.[0] || 'Best'
  
  return `Generate ${count} hyper-personalized LinkedIn messages for selling "${analysis.core_offer}" to prospects in the "${analysis.industry}" industry.

TARGET PERSONA:
${JSON.stringify(primaryPersona, null, 2)}

BUSINESS CONTEXT:
- Core Offering: ${analysis.core_offer}
- Industry: ${analysis.industry}
- Business Model: ${analysis.business_model}
- Key Advantages: ${competitiveAdvantages}
- ICP Summary: ${analysis.icp_summary}
- Tone of Voice: ${tone}

LINKEDIN MESSAGE REQUIREMENTS:
1. Each message must be under 150 words
2. Include realistic personalization (recent post, company update, industry news)
3. Reference specific pain points relevant to their role
4. Mention 1-2 competitive advantages naturally
5. End with a soft, low-friction ask like one of: ${ctaExamples}
6. Use ${tone.toLowerCase()} tone
7. Sign-off with "${signOffExample}"

OUTPUT FORMAT:
For each message, provide JSON with keys: PERSONALIZATION_TYPE, PERSONALIZATION_HOOK, PROSPECT_PROFILE, MESSAGE, RESPONSE_RATE_ESTIMATE`
}

function createEmailPrompt(
  analysis: GenerateMessagesRequest['websiteAnalysis'], 
  count: number,
  outreach?: OutreachData
): string {
  const primaryPersona = analysis.target_personas?.[0] || {}
  const competitiveAdvantages = analysis.competitive_advantages?.slice(0, 3).join(', ') || 'innovative solutions'
  const tone = outreach?.toneOfVoice || 'Professional'
  const ctaExamples = outreach?.callsToAction?.slice(0, 3).join(' | ') || 'Would you be interested in learning more?'
  const signOffExample = outreach?.signOffs?.[0] || 'Best'
  
  return `Generate ${count} hyper-personalized cold emails for selling "${analysis.core_offer}" to prospects in the "${analysis.industry}" industry.

TARGET PERSONA:
${JSON.stringify(primaryPersona, null, 2)}

BUSINESS CONTEXT:
- Core Offering: ${analysis.core_offer}
- Industry: ${analysis.industry}
- Business Model: ${analysis.business_model}
- Key Advantages: ${competitiveAdvantages}
- ICP Summary: ${analysis.icp_summary}
- Tone of Voice: ${tone}

COLD EMAIL REQUIREMENTS:
1. Compelling, curiosity-driven subject lines
2. 100% personalized opening line (recent post, company news, etc.)
3. Concise body with bullet points for easy scanning
4. Clear WIIFM (What's In It For Me) value proposition
5. Single, simple call-to-action (e.g., ${ctaExamples})
6. Professional signature ending with "${signOffExample}"
7. Each email should be unique and authentic

EMAIL STRUCTURE:
1. Subject line
2. Personalized opening
3. Brief credibility statement
4. 2-3 bullet points of value/benefits
5. Soft CTA
6. Signature with sign-off

OUTPUT FORMAT:
For each email, provide JSON with keys: PERSONALIZATION_TYPE, PERSONALIZATION_HOOK, PROSPECT_PROFILE, SUBJECT, EMAIL, RESPONSE_RATE_ESTIMATE`
}

function parseLinkedInMessages(response: string, analysis: GenerateMessagesRequest['websiteAnalysis']): GeneratedMessage[] {
  const messages: GeneratedMessage[] = []
  
  // Split response into individual messages and parse each one
  const messageBlocks = response.split(/(?=PERSONALIZATION_TYPE:|(?=\d+\.|MESSAGE \d+))/i).filter(block => block.trim())
  
  messageBlocks.forEach((block, index) => {
    try {
      const personalizationType = extractField(block, 'PERSONALIZATION_TYPE') || 'recent_post'
      const personalizationHook = extractField(block, 'PERSONALIZATION_HOOK') || 'recent industry update'
      const prospectProfile = extractField(block, 'PROSPECT_PROFILE') || 'Sarah Johnson, VP Sales, TechCorp, Software'
      const messageContent = extractField(block, 'MESSAGE') || block.trim()
      const responseRate = parseInt(extractField(block, 'RESPONSE_RATE_ESTIMATE') || '25')
      
      const [name, role, company, industry] = prospectProfile.split(',').map(s => s.trim())
      
      messages.push({
        id: `linkedin_${Date.now()}_${index}`,
        type: 'linkedin',
        variant: index + 1,
        content: {
          message: cleanMessageContent(messageContent),
          personalization: {
            type: personalizationType as PersonalizationElement['type'],
            content: personalizationHook,
            context: `Recent ${personalizationType.replace('_', ' ')} from ${name || 'prospect'}`
          },
          sender: {
            name: 'Alex Rodriguez',
            role: 'Business Development Manager',
            company: getCompanyNameFromUrl(analysis.website_url)
          },
          recipient: {
            name: name || 'Sarah Johnson',
            role: role || 'VP of Sales',
            company: company || 'TechCorp',
            industry: industry || analysis.industry
          }
        },
        metadata: {
          generated_at: new Date().toISOString(),
          personalization_strength: responseRate > 30 ? 'high' : responseRate > 20 ? 'medium' : 'low',
          estimated_response_rate: responseRate
        }
      })
    } catch (error) {
      console.error('Error parsing LinkedIn message block:', error)
    }
  })
  
  return messages.slice(0, 5) // Ensure we return max 5 messages
}

function parseEmailMessages(response: string, analysis: GenerateMessagesRequest['websiteAnalysis']): GeneratedMessage[] {
  const messages: GeneratedMessage[] = []
  
  const messageBlocks = response.split(/(?=PERSONALIZATION_TYPE:|(?=\d+\.|EMAIL \d+))/i).filter(block => block.trim())
  
  messageBlocks.forEach((block, index) => {
    try {
      const personalizationType = extractField(block, 'PERSONALIZATION_TYPE') || 'company_news'
      const personalizationHook = extractField(block, 'PERSONALIZATION_HOOK') || 'recent company update'
      const prospectProfile = extractField(block, 'PROSPECT_PROFILE') || 'Michael Chen, CTO, InnovateNow, Technology'
      const subject = extractField(block, 'SUBJECT') || 'Quick question about your recent announcement'
      const emailContent = extractField(block, 'EMAIL') || block.trim()
      const responseRate = parseInt(extractField(block, 'RESPONSE_RATE_ESTIMATE') || '18')
      
      const [name, role, company, industry] = prospectProfile.split(',').map(s => s.trim())
      
      messages.push({
        id: `email_${Date.now()}_${index}`,
        type: 'email',
        variant: index + 1,
        content: {
          subject: subject,
          message: cleanMessageContent(emailContent),
          personalization: {
            type: personalizationType as PersonalizationElement['type'],
            content: personalizationHook,
            context: `Recent ${personalizationType.replace('_', ' ')} from ${name || 'prospect'}`
          },
          sender: {
            name: 'Alex Rodriguez',
            role: 'Business Development Manager',
            company: getCompanyNameFromUrl(analysis.website_url)
          },
          recipient: {
            name: name || 'Michael Chen',
            role: role || 'CTO',
            company: company || 'InnovateNow',
            industry: industry || analysis.industry
          }
        },
        metadata: {
          generated_at: new Date().toISOString(),
          personalization_strength: responseRate > 25 ? 'high' : responseRate > 15 ? 'medium' : 'low',
          estimated_response_rate: responseRate
        }
      })
    } catch (error) {
      console.error('Error parsing email message block:', error)
    }
  })
  
  return messages.slice(0, 5) // Ensure we return max 5 messages
}

function extractField(text: string, fieldName: string): string {
  const regex = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 'is')
  const match = text.match(regex)
  return match ? match[1].trim() : ''
}

function cleanMessageContent(content: string): string {
  // Remove field labels and clean up the message content
  return content
    .replace(/^(MESSAGE|EMAIL):\s*/i, '')
    .replace(/PERSONALIZATION_TYPE:.*$/gms, '')
    .replace(/PROSPECT_PROFILE:.*$/gms, '')
    .replace(/SUBJECT:.*$/gms, '')
    .replace(/RESPONSE_RATE_ESTIMATE:.*$/gms, '')
    .replace(/^\d+\.\s*/, '')
    .trim()
}

function getCompanyNameFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    const name = domain.split('.')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'YourCompany'
  }
}

// Fallback messages in case AI generation fails
function generateFallbackLinkedInMessages(analysis: GenerateMessagesRequest['websiteAnalysis'], count: number): GeneratedMessage[] {
  console.log('🔄 [FALLBACK] Generating fallback LinkedIn messages:', { count, coreOffer: analysis.core_offer })
  
  const templates = [
    {
      personalization: { type: 'recent_post' as const, content: 'recent post about industry challenges', context: 'Recent industry discussion' },
      message: `Hi {{name}},\n\nI saw your recent post about the challenges in {{industry}} - really insightful perspective on market dynamics.\n\nWe've been helping companies like {{company}} with similar challenges through ${analysis.core_offer}. Just helped a similar company reduce their operational costs by 30%.\n\nWould love to share how we approached their situation. Worth a quick chat?\n\nBest,\nAlex`
    },
    {
      personalization: { type: 'company_news' as const, content: 'recent funding announcement', context: 'Recent company milestone' },
      message: `Hi {{name}},\n\nCongrats on {{company}}'s recent funding round! Exciting times ahead.\n\nAs you scale, I imagine ${analysis.icp_summary} becomes even more critical. We've helped several portfolio companies navigate similar growth phases.\n\nHappy to share some insights that might be relevant. Quick call this week?\n\nCheers,\nAlex`
    },
    {
      personalization: { type: 'industry_trend' as const, content: 'industry report on digital transformation', context: 'Market insight sharing' },
      message: `Hi {{name}},\n\nSaw the latest ${analysis.industry} report and thought of our conversation about growth challenges.\n\nWe've been helping companies like {{company}} navigate these exact market pressures through ${analysis.core_offer}.\n\nWorth a brief chat about how this might apply to your situation?\n\nBest,\nAlex`
    },
    {
      personalization: { type: 'product_launch' as const, content: 'new product announcement', context: 'Innovation recognition' },
      message: `Hi {{name}},\n\nExciting news about {{company}}'s new product launch! The innovation in ${analysis.industry} is impressive.\n\nGiven your expansion, ${analysis.core_offer} becomes even more valuable. We've helped similar companies scale efficiently during growth phases.\n\nQuick call to discuss your roadmap?\n\nBest,\nAlex`
    },
    {
      personalization: { type: 'role_change' as const, content: 'recent promotion announcement', context: 'Career milestone congratulation' },
      message: `Hi {{name}},\n\nCongrats on your recent promotion! Well-deserved recognition of your leadership in ${analysis.industry}.\n\nAs you take on new responsibilities, ${analysis.core_offer} will likely become increasingly important. We've helped other leaders in similar transitions.\n\nWorth exploring how we might support your new initiatives?\n\nBest,\nAlex`
    }
  ]

  const prospects = [
    { name: 'Sarah Johnson', role: 'VP of Sales', company: 'TechCorp', industry: analysis.industry },
    { name: 'Michael Chen', role: 'CTO', company: 'InnovateNow', industry: analysis.industry },
    { name: 'Emily Rodriguez', role: 'Head of Marketing', company: 'GrowthLab', industry: analysis.industry },
    { name: 'David Kim', role: 'Operations Director', company: 'ScaleUp Inc', industry: analysis.industry },
    { name: 'Lisa Thompson', role: 'Chief Revenue Officer', company: 'Revenue Pro', industry: analysis.industry }
  ]

  const fallbackMessages = templates.slice(0, count).map((template, index) => {
    const prospect = prospects[index % prospects.length]
    const processedMessage = template.message
      .replace(/\{\{name\}\}/g, prospect.name)
      .replace(/\{\{company\}\}/g, prospect.company)
      .replace(/\{\{industry\}\}/g, analysis.industry)

    const message: GeneratedMessage = {
      id: `linkedin_fallback_${Date.now()}_${index}`,
      type: 'linkedin',
      variant: index + 1,
      content: {
        message: processedMessage,
        personalization: template.personalization,
        sender: {
          name: 'Alex Rodriguez',
          role: 'Business Development Manager',
          company: getCompanyNameFromUrl(analysis.website_url)
        },
        recipient: prospect
      },
      metadata: {
        generated_at: new Date().toISOString(),
        personalization_strength: 'medium' as const,
        estimated_response_rate: 25
      }
    }

    console.log(`✅ [FALLBACK] Generated LinkedIn fallback ${index + 1}:`, {
      id: message.id,
      recipientName: prospect.name,
      messageLength: message.content.message.length
    })

    return message
  })

  console.log(`🎉 [FALLBACK] Generated ${fallbackMessages.length} LinkedIn fallback messages`)
  return fallbackMessages
}



function generateFallbackEmailMessages(analysis: GenerateMessagesRequest['websiteAnalysis'], count: number): GeneratedMessage[] {
  console.log('🔄 [FALLBACK] Generating fallback email messages:', { count, coreOffer: analysis.core_offer })
  
  const templates = [
    {
      subject: 'Quick question about your recent growth',
      personalization: { type: 'company_news' as const, content: 'company expansion announcement', context: 'Recent growth milestone' },
      message: `Hi {{name}},\n\nI noticed {{company}}'s recent expansion into new markets - congratulations!\n\nAs you scale operations, I imagine maintaining ${analysis.core_offer} becomes increasingly complex. We've helped companies like yours:\n\n• Reduce operational overhead by 40%\n• Streamline processes during rapid growth\n• Maintain quality while scaling\n\nWorth a 15-minute call to share how we approached similar challenges?\n\nBest regards,\nAlex Rodriguez\nBusiness Development Manager`
    },
    {
      subject: 'Thought you\'d find this interesting...',
      personalization: { type: 'industry_trend' as const, content: 'recent industry report on market trends', context: 'Industry insight' },
      message: `Hi {{name}},\n\nSaw the latest ${analysis.industry} report highlighting challenges you're probably facing at {{company}}.\n\nThe data on market pressures aligns with what we're seeing across our client base. We've been helping similar companies navigate these exact challenges.\n\nQuick wins we've delivered:\n• Improved efficiency metrics by 35%\n• Reduced time-to-market\n• Enhanced competitive positioning\n\nInterested in a brief conversation about your specific situation?\n\nRegards,\nAlex Rodriguez`
    },
    {
      subject: 'How similar companies scaled their operations',
      personalization: { type: 'recent_post' as const, content: 'LinkedIn post about scaling challenges', context: 'Professional engagement' },
      message: `Hi {{name}},\n\nYour recent post about scaling challenges in ${analysis.industry} really resonated - those are exactly the issues we help solve.\n\nWe recently helped a similar ${analysis.industry} company:\n• Increase efficiency by 45%\n• Reduce costs while maintaining quality\n• Scale operations without adding overhead\n\nWould love to share the specific approach we used. Open to a quick call?\n\nBest,\nAlex Rodriguez`
    },
    {
      subject: 'Congratulations on the funding!',
      personalization: { type: 'funding' as const, content: 'Series B funding announcement', context: 'Growth milestone recognition' },
      message: `Hi {{name}},\n\nCongratulations on {{company}}'s recent funding round! Exciting times ahead.\n\nWith your growth plans, ${analysis.core_offer} will become even more critical. We've helped other portfolio companies in ${analysis.industry} scale efficiently:\n\n• Maintained quality during 3x growth\n• Reduced per-unit costs by 30%\n• Built scalable processes\n\nHappy to share our playbook. Worth a brief chat?\n\nCheers,\nAlex Rodriguez`
    },
    {
      subject: 'Quick wins for your new role',
      personalization: { type: 'role_change' as const, content: 'promotion to current position', context: 'Career transition support' },
      message: `Hi {{name}},\n\nCongrats on your new role at {{company}}! Leading ${analysis.industry} operations is an exciting challenge.\n\nWe've helped other leaders in similar transitions achieve quick wins:\n• Optimize existing processes (20% efficiency gain)\n• Identify cost reduction opportunities\n• Build scalable systems for growth\n\nWorth exploring how we might support your first 90 days?\n\nBest regards,\nAlex Rodriguez`
    }
  ]

  const prospects = [
    { name: 'Michael Chen', role: 'CTO', company: 'InnovateNow', industry: analysis.industry },
    { name: 'Jennifer Walsh', role: 'VP of Product', company: 'ProductCo', industry: analysis.industry },
    { name: 'Robert Taylor', role: 'Head of Engineering', company: 'DevTools Inc', industry: analysis.industry },
    { name: 'Amanda Foster', role: 'Chief Marketing Officer', company: 'BrandBuilder', industry: analysis.industry },
    { name: 'James Wilson', role: 'Director of Sales', company: 'SalesForce Pro', industry: analysis.industry }
  ]

  const fallbackMessages = templates.slice(0, count).map((template, index) => {
    const prospect = prospects[index % prospects.length]
    const processedMessage = template.message
      .replace(/\{\{name\}\}/g, prospect.name)
      .replace(/\{\{company\}\}/g, prospect.company)
      .replace(/\{\{industry\}\}/g, analysis.industry)

    const message: GeneratedMessage = {
      id: `email_fallback_${Date.now()}_${index}`,
      type: 'email',
      variant: index + 1,
      content: {
        subject: template.subject,
        message: processedMessage,
        personalization: template.personalization,
        sender: {
          name: 'Alex Rodriguez',
          role: 'Business Development Manager',
          company: getCompanyNameFromUrl(analysis.website_url)
        },
        recipient: prospect
      },
      metadata: {
        generated_at: new Date().toISOString(),
        personalization_strength: 'medium' as const,
        estimated_response_rate: 18
      }
    }

    console.log(`✅ [FALLBACK] Generated email fallback ${index + 1}:`, {
      id: message.id,
      subject: message.content.subject,
      recipientName: prospect.name,
      messageLength: message.content.message.length
    })

    return message
  })

  console.log(`🎉 [FALLBACK] Generated ${fallbackMessages.length} email fallback messages`)
  return fallbackMessages
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 