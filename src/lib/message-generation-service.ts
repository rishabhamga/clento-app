/**
 * Message Generation Service
 * 
 * Provides types and utilities for generating hyper-personalized 
 * LinkedIn and email messages based on website analysis data.
 */

export interface WebsiteAnalysisData {
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

export interface PersonalizationElement {
  type: 'recent_post' | 'company_news' | 'funding' | 'product_launch' | 'role_change' | 'industry_trend'
  content: string
  context: string
}

export interface MessageSender {
  name: string
  role: string
  company: string
}

export interface MessageRecipient {
  name: string
  role: string
  company: string
  industry: string
}

export interface GeneratedMessage {
  id: string
  type: 'linkedin' | 'email'
  variant: number
  content: {
    subject?: string // For emails only
    message: string
    personalization: PersonalizationElement
    sender: MessageSender
    recipient: MessageRecipient
  }
  metadata: {
    generated_at: string
    personalization_strength: 'high' | 'medium' | 'low'
    estimated_response_rate: number
  }
}

export interface GenerateMessagesRequest {
  websiteAnalysis: WebsiteAnalysisData
  messageCount?: number
}

export interface GenerateMessagesResponse {
  success: boolean
  linkedinMessages: GeneratedMessage[]
  emailMessages: GeneratedMessage[]
  totalGenerated: number
  error?: string
}

/**
 * Generate sample messages for the onboarding carousel
 */
export async function generateSampleMessages(
  websiteAnalysis: WebsiteAnalysisData,
  messageCount: number = 5
): Promise<GenerateMessagesResponse> {
  console.log('🚀 [MESSAGE SERVICE] Starting sample message generation request:', {
    messageCount,
    websiteUrl: websiteAnalysis.website_url,
    coreOffer: websiteAnalysis.core_offer,
    industry: websiteAnalysis.industry,
    hasTargetPersonas: websiteAnalysis.target_personas?.length > 0,
    competitiveAdvantagesCount: websiteAnalysis.competitive_advantages?.length || 0
  })

  try {
    const requestBody = {
      websiteAnalysis,
      messageCount
    }

    console.log('📋 [MESSAGE SERVICE] Sending request to /api/generate-sample-messages:', {
      bodySize: JSON.stringify(requestBody).length,
      messageCount: requestBody.messageCount
    })

    const response = await fetch('/api/generate-sample-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📡 [MESSAGE SERVICE] Received response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [MESSAGE SERVICE] HTTP error response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      })
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data: GenerateMessagesResponse = await response.json()
    
    console.log('✅ [MESSAGE SERVICE] Successfully parsed response data:', {
      success: data.success,
      linkedinCount: data.linkedinMessages?.length || 0,
      emailCount: data.emailMessages?.length || 0,
      totalGenerated: data.totalGenerated,
      hasError: !!data.error,
      linkedinSample: data.linkedinMessages?.[0]?.content?.message?.substring(0, 100),
      emailSample: data.emailMessages?.[0]?.content?.message?.substring(0, 100)
    })

    if (!data.success) {
      console.error('❌ [MESSAGE SERVICE] API returned unsuccessful response:', data.error)
      throw new Error(data.error || 'API returned unsuccessful response')
    }

    if (!data.linkedinMessages || !data.emailMessages) {
      console.error('❌ [MESSAGE SERVICE] Response missing message arrays:', {
        hasLinkedin: !!data.linkedinMessages,
        hasEmail: !!data.emailMessages
      })
      throw new Error('Response missing required message arrays')
    }

    console.log('🎉 [MESSAGE SERVICE] Message generation completed successfully:', {
      linkedinMessages: data.linkedinMessages.length,
      emailMessages: data.emailMessages.length,
      totalGenerated: data.totalGenerated
    })

    return data
  } catch (error) {
    console.error('💥 [MESSAGE SERVICE] Error in generateSampleMessages:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      websiteUrl: websiteAnalysis.website_url
    })
    return {
      success: false,
      linkedinMessages: [],
      emailMessages: [],
      totalGenerated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * LinkedIn Message Best Practices
 */
export const LINKEDIN_BEST_PRACTICES = {
  maxLength: 150,
  personalizeOpening: true,
  includeCredibility: true,
  softCTA: true,
  avoidSalesyLanguage: true,
  mentionSpecificDetails: true
}

/**
 * Cold Email Best Practices  
 */
export const EMAIL_BEST_PRACTICES = {
  personalizedSubject: true,
  personalizedOpening: true,
  useBulletPoints: true,
  singleCTA: true,
  professionalSignature: true,
  avoidSpamLanguage: true,
  followUpSequence: true
}

/**
 * Personalization scenarios for realistic message generation
 */
export const PERSONALIZATION_SCENARIOS = [
  {
    type: 'recent_post' as const,
    description: 'Recent LinkedIn post about industry challenges',
    context: 'Professional engagement with thought leadership'
  },
  {
    type: 'company_news' as const,
    description: 'Funding announcement or product launch',
    context: 'Business milestone recognition'
  },
  {
    type: 'funding' as const,
    description: 'Investment round or acquisition',
    context: 'Growth phase acknowledgment'
  },
  {
    type: 'product_launch' as const,
    description: 'New product or service announcement',
    context: 'Innovation recognition'
  },
  {
    type: 'role_change' as const,
    description: 'Job promotion or company transition',
    context: 'Career milestone congratulation'
  },
  {
    type: 'industry_trend' as const,
    description: 'Market trends affecting their business',
    context: 'Industry insight sharing'
  }
]

/**
 * Sample prospect profiles for realistic message generation
 */
export const SAMPLE_PROSPECTS = {
  linkedin: [
    { name: 'Sarah Johnson', role: 'VP of Sales', company: 'TechCorp', industry: 'Software' },
    { name: 'Michael Chen', role: 'CTO', company: 'InnovateNow', industry: 'Technology' },
    { name: 'Emily Rodriguez', role: 'Head of Marketing', company: 'GrowthLab', industry: 'Digital Marketing' },
    { name: 'David Kim', role: 'Operations Director', company: 'ScaleUp Inc', industry: 'SaaS' },
    { name: 'Lisa Thompson', role: 'Chief Revenue Officer', company: 'Revenue Pro', industry: 'Sales Tech' }
  ],
  email: [
    { name: 'Alex Martinez', role: 'CEO', company: 'StartupVentures', industry: 'FinTech' },
    { name: 'Jennifer Walsh', role: 'VP of Product', company: 'ProductCo', industry: 'B2B Software' },
    { name: 'Robert Taylor', role: 'Head of Engineering', company: 'DevTools Inc', industry: 'Developer Tools' },
    { name: 'Amanda Foster', role: 'Chief Marketing Officer', company: 'BrandBuilder', industry: 'Marketing' },
    { name: 'James Wilson', role: 'Director of Sales', company: 'SalesForce Pro', industry: 'CRM' }
  ]
}

/**
 * Utility function to extract company name from URL
 */
export function getCompanyNameFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    const name = domain.split('.')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'YourCompany'
  }
}

/**
 * Calculate personalization strength based on content analysis
 */
export function calculatePersonalizationStrength(
  personalization: PersonalizationElement,
  responseRate: number
): 'high' | 'medium' | 'low' {
  if (responseRate > 30 || personalization.type === 'recent_post' || personalization.type === 'funding') {
    return 'high'
  }
  if (responseRate > 20 || personalization.type === 'company_news' || personalization.type === 'product_launch') {
    return 'medium'
  }
  return 'low'
}

/**
 * Generate sample prospect data for message personalization
 */
export function generateSampleProspects(
  websiteAnalysis: WebsiteAnalysisData,
  count: number = 5
): (MessageRecipient & { personalization: PersonalizationElement })[] {
  const prospects: (MessageRecipient & { personalization: PersonalizationElement })[] = []
  
  // Sample prospect templates based on common B2B personas
  const prospectTemplates = [
    {
      nameOptions: ['Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim', 'Jessica Thompson'],
      roleOptions: ['VP of Sales', 'Head of Revenue', 'Chief Revenue Officer', 'Sales Director', 'VP of Business Development'],
      companyTypes: ['TechCorp', 'InnovateNow', 'ScaleUp Solutions', 'GrowthCo', 'NextGen Systems'],
      personalizationTypes: ['recent_post', 'company_news', 'funding'] as const,
      industries: ['Technology', 'SaaS', 'Software', 'Digital Marketing', 'E-commerce']
    },
    {
      nameOptions: ['Alex Thompson', 'Lisa Wang', 'Carlos Rodriguez', 'Amanda Foster', 'Ryan Mitchell'],
      roleOptions: ['VP of Marketing', 'Chief Marketing Officer', 'Head of Growth', 'Marketing Director', 'VP of Customer Success'],
      companyTypes: ['MarketLeaders', 'BrandBuilders', 'CustomerFirst', 'GrowthHackers', 'EngageCorp'],
      personalizationTypes: ['recent_post', 'product_launch', 'industry_trend'] as const,
      industries: ['Marketing', 'SaaS', 'E-commerce', 'FinTech', 'HealthTech']
    },
    {
      nameOptions: ['Jennifer Smith', 'Mark Anderson', 'Priya Patel', 'James Wilson', 'Rachel Green'],
      roleOptions: ['CTO', 'VP of Engineering', 'Head of Technology', 'Engineering Director', 'Chief Technology Officer'],
      companyTypes: ['TechInnovators', 'BuildBetter', 'CodeCraft', 'DevSolutions', 'TechPioneers'],
      personalizationTypes: ['recent_post', 'funding', 'role_change'] as const,
      industries: ['Technology', 'Software', 'Cloud Computing', 'AI/ML', 'Cybersecurity']
    },
    {
      nameOptions: ['Brian Davis', 'Sophie Martinez', 'Kevin O\'Connor', 'Maria Gonzalez', 'Thomas Baker'],
      roleOptions: ['CEO', 'Founder', 'Co-Founder', 'President', 'Managing Director'],
      companyTypes: ['StartupVentures', 'DisruptCorp', 'InnovateLab', 'FutureBuilders', 'VisionaryInc'],
      personalizationTypes: ['funding', 'company_news', 'industry_trend'] as const,
      industries: ['Startup', 'Technology', 'FinTech', 'SaaS', 'E-commerce']
    },
    {
      nameOptions: ['Nicole Roberts', 'Steven Clark', 'Maya Singh', 'Christopher Lee', 'Olivia Taylor'],
      roleOptions: ['VP of Operations', 'Chief Operating Officer', 'Head of Operations', 'Operations Director', 'VP of Strategy'],
      companyTypes: ['OperateWell', 'EfficiencyCorp', 'StreamlinePro', 'OptimizeNow', 'ProcessMasters'],
      personalizationTypes: ['recent_post', 'company_news', 'product_launch'] as const,
      industries: ['Operations', 'Logistics', 'Manufacturing', 'Supply Chain', 'Consulting']
    }
  ]
  
  const personalizationContent = {
    recent_post: [
      'recent LinkedIn post about scaling challenges in Q4',
      'insightful post on market trends affecting growth teams',
      'thoughtful analysis of industry shifts and opportunities',
      'post about team expansion and operational challenges',
      'discussion on customer acquisition strategies'
    ],
    company_news: [
      'Series B funding round announcement of $25M',
      'expansion into European markets',
      'launch of new product line',
      'partnership with leading industry platform',
      'acquisition of competitor startup'
    ],
    funding: [
      'recent $15M Series A led by top-tier VC',
      'seed funding announcement for market expansion',
      'successful Series B closing with strategic investors',
      'bridge round to accelerate product development',
      'growth funding for international expansion'
    ],
    product_launch: [
      'announcement of new AI-powered features',
      'launch of enterprise product suite',
      'beta release of next-generation platform',
      'introduction of mobile app with advanced analytics',
      'rollout of integration marketplace'
    ],
    role_change: [
      'promotion to current role after leading successful initiative',
      'recent joining from leading competitor company',
      'transition from startup to scale-up environment',
      'appointment as first hire in newly created position',
      'move from consulting to in-house leadership role'
    ],
    industry_trend: [
      'recent industry report on digital transformation',
      'market research showing shift to cloud-first strategies',
      'analysis of customer behavior changes post-pandemic',
      'report on emerging technologies in their sector',
      'study on operational efficiency in modern businesses'
    ]
  }
  
  // Determine the most relevant prospect template based on website analysis
  const targetPersonas = websiteAnalysis.target_personas || []
  let primaryTemplate = prospectTemplates[0] // Default to sales-focused
  
  if (targetPersonas.length > 0) {
    const primaryPersona = targetPersonas[0]
    const personaRole = (primaryPersona.role || primaryPersona.title || '').toLowerCase()
    
    if (personaRole.includes('marketing') || personaRole.includes('growth')) {
      primaryTemplate = prospectTemplates[1]
    } else if (personaRole.includes('tech') || personaRole.includes('engineer') || personaRole.includes('cto')) {
      primaryTemplate = prospectTemplates[2]
    } else if (personaRole.includes('ceo') || personaRole.includes('founder')) {
      primaryTemplate = prospectTemplates[3]
    } else if (personaRole.includes('operation') || personaRole.includes('strategy')) {
      primaryTemplate = prospectTemplates[4]
    }
  }
  
  // Generate prospects
  for (let i = 0; i < count; i++) {
    const template = i === 0 ? primaryTemplate : prospectTemplates[i % prospectTemplates.length]
    const personalizationType = template.personalizationTypes[i % template.personalizationTypes.length]
    
    const prospect = {
      name: template.nameOptions[i % template.nameOptions.length],
      role: template.roleOptions[i % template.roleOptions.length],
      company: template.companyTypes[i % template.companyTypes.length],
      industry: template.industries[i % template.industries.length],
      personalization: {
        type: personalizationType,
        content: personalizationContent[personalizationType][i % personalizationContent[personalizationType].length],
        context: `Recent ${personalizationType.replace('_', ' ')} that provides perfect conversation starter`
      }
    }
    
    prospects.push(prospect)
  }
  
  return prospects
}

/**
 * Validate message content for best practices
 */
export function validateMessageContent(message: GeneratedMessage): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  
  if (message.type === 'linkedin') {
    if (message.content.message.length > LINKEDIN_BEST_PRACTICES.maxLength) {
      warnings.push(`LinkedIn message is ${message.content.message.length} characters (recommended: max ${LINKEDIN_BEST_PRACTICES.maxLength})`)
    }
  }
  
  if (message.type === 'email' && !message.content.subject) {
    warnings.push('Email message missing subject line')
  }
  
  if (!message.content.personalization.content) {
    warnings.push('Message lacks specific personalization')
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  }
} 