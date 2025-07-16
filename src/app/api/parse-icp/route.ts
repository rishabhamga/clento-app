import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { getCurrentProvider, getDataProviderManager } from '@/lib/data-providers/provider-manager'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Schema for validating the parsed ICP
const ParsedICPSchema = z.object({
  // Basic search info
  searchType: z.enum(['people', 'company']),
  
  // Person-level filters
  jobTitles: z.array(z.string()),
  excludeJobTitles: z.array(z.string()).optional().default([]),
  seniorities: z.array(z.string()),
  personLocations: z.array(z.string()).optional().default([]),
  excludePersonLocations: z.array(z.string()).optional().default([]),
  
  // Company-level filters
  industries: z.array(z.string()),
  excludeIndustries: z.array(z.string()).optional().default([]),
  organizationLocations: z.array(z.string()).optional().default([]),
  excludeOrganizationLocations: z.array(z.string()).optional().default([]),
  companySize: z.array(z.string()),
  revenueMin: z.number().nullable().optional(),
  revenueMax: z.number().nullable().optional(),
  technologies: z.array(z.string()),
  excludeTechnologies: z.array(z.string()).optional().default([]),
  
  // Organization job filters (hiring signals)
  organizationJobTitles: z.array(z.string()).optional().default([]),
  organizationJobLocations: z.array(z.string()).optional().default([]),
  organizationNumJobsMin: z.number().nullable().optional(),
  organizationNumJobsMax: z.number().nullable().optional(),
  organizationJobPostedAtMin: z.string().nullable().optional(),
  organizationJobPostedAtMax: z.string().nullable().optional(),
  
  // Funding & growth signals
  fundingStages: z.array(z.string()).optional().default([]),
  fundingAmountMin: z.number().nullable().optional(),
  fundingAmountMax: z.number().nullable().optional(),
  foundedYearMin: z.number().nullable().optional(),
  foundedYearMax: z.number().nullable().optional(),
  
  // Activity signals
  jobPostings: z.boolean().nullable().optional(),
  newsEvents: z.boolean().nullable().optional(),
  webTraffic: z.boolean().nullable().optional(),
  
  // Other filters
  keywords: z.array(z.string()),
  intentTopics: z.array(z.string()).optional().default([]),
  companyDomains: z.array(z.string()).optional().default([]),
  
  // Metadata
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
})

// Schema for validation results
const ValidationResultsSchema = z.object({
  industries: z.record(z.array(z.string())),
  jobTitles: z.record(z.object({
    titles: z.array(z.string()),
    levels: z.array(z.string()),
    departments: z.array(z.string())
  })),
  locations: z.record(z.array(z.string())),
  technologies: z.record(z.array(z.string())),
  isValid: z.boolean(),
  errors: z.array(z.string())
})

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const { icpDescription } = await request.json()

    if (!icpDescription || typeof icpDescription !== 'string') {
      return NextResponse.json(
        { error: 'ICP description is required' },
        { status: 400 }
      )
    }

    // Get current provider to adjust prompt accordingly
    const currentProvider = getCurrentProvider()
    const dataProviderManager = getDataProviderManager()
    const filterOptions = dataProviderManager.getFilterOptions()
    
    console.log('Current provider:', currentProvider)
    console.log('Provider filter options:', filterOptions)

    const prompt = `
You are an expert B2B lead generation analyst. Parse the following natural language Ideal Customer Profile (ICP) description into structured filter parameters that align with ${currentProvider === 'apollo' ? 'Apollo.io' : 'Explorium'} API requirements.

ICP Description: "${icpDescription}"

IMPORTANT: You are generating filters for ${currentProvider.toUpperCase()} API. Please structure the output according to ${currentProvider} specifications.

Analyze this description and extract the following information in JSON format:

{
  "searchType": "people" or "company" (determine if they want to find specific people or companies),
  
  // PERSON-LEVEL FILTERS
  "jobTitles": [array of job titles and roles for the people you want to target, e.g., "CEO", "CTO", "Marketing Director"],
  "excludeJobTitles": [array of job titles to exclude, e.g., "Intern", "Student", "Assistant"],
  "seniorities": [array of seniority levels - use ${currentProvider === 'apollo' ? 'Apollo format: "owner", "founder", "c_suite", "vp", "director", "manager", "senior", "entry"' : 'Explorium format: "cxo", "vp", "director", "manager", "senior", "entry"'}],
  "personLocations": [array of locations where the target people are located, e.g., "United States", "California", "Remote"],
  "excludePersonLocations": [array of person locations to exclude],
  
  // COMPANY-LEVEL FILTERS  
  "industries": [array of industries mentioned or inferred, e.g., "Technology", "Healthcare", "Finance", "SaaS", "Manufacturing"],
  "excludeIndustries": [array of industries to exclude],
  "organizationLocations": [array of company headquarters locations, e.g., "San Francisco", "New York", "London"],
  "excludeOrganizationLocations": [array of company HQ locations to exclude],
  "companySize": [array of employee count ranges, e.g., "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"],
  "revenueMin": number (minimum annual revenue in USD, e.g., 1000000 for $1M),
  "revenueMax": number (maximum annual revenue in USD),
  "technologies": [array of technologies or tools mentioned, e.g., "Salesforce", "AWS", "React", "Workday"],
  "excludeTechnologies": [array of technologies to exclude],
  
  // ORGANIZATION JOB FILTERS (HIRING SIGNALS)
  "organizationJobTitles": [array of job titles mentioned in active job postings, e.g., "software developer", "sales manager", "data analyst"],
  "organizationJobLocations": [array of locations mentioned for job postings, e.g., "Bangalore", "Remote", "San Francisco"],
  "organizationNumJobsMin": number (minimum number of active job postings),
  "organizationNumJobsMax": number (maximum number of active job postings),
  "organizationJobPostedAtMin": "YYYY-MM-DD" (earliest job posting date for temporal phrases like "past month", "recently"),
  "organizationJobPostedAtMax": "YYYY-MM-DD" (latest job posting date),
  
  // FUNDING & GROWTH SIGNALS
  "fundingStages": [array of funding stages if mentioned, e.g., "seed", "series_a", "series_b", "series_c", "ipo", "acquired"],
  "fundingAmountMin": number (minimum funding amount in USD),
  "fundingAmountMax": number (maximum funding amount in USD),
  "foundedYearMin": number (minimum founding year),
  "foundedYearMax": number (maximum founding year),
  
  // ACTIVITY SIGNALS (boolean flags)
  "jobPostings": true/false/null (whether company should have active job postings),
  "newsEvents": true/false/null (whether company should have recent news/events),
  "webTraffic": true/false/null (whether company should have significant web traffic),
  
  // OTHER FILTERS
  "keywords": [array of other relevant keywords for general filtering],
  "intentTopics": [array of intent signals or topics the company might be interested in],
  "companyDomains": [array of specific company domains if mentioned, e.g., "google.com", "salesforce.com"],
  
  // METADATA
  "confidence": number between 0-100 indicating confidence in the analysis,
  "reasoning": "Brief explanation of how you interpreted the ICP description and what hiring signals were detected"
}

CRITICAL PARSING GUIDELINES:

1. **Hiring Signal Detection**: When the description mentions hiring, recruiting, job postings, or looking for talent:
   - Extract job titles from hiring context → "organizationJobTitles"
   - Extract hiring locations → "organizationJobLocations" 
   - Convert temporal expressions to dates for "organizationJobPostedAtMin/Max":
     * "past month" → set Min to 30 days ago
     * "past 3 months" → set Min to 90 days ago
     * "recently" → set Min to 14 days ago
     * "last week" → set Min to 7 days ago
   - Set "jobPostings": true if hiring activity is mentioned

2. **Location Distinction**:
   - "personLocations": Where the target people live/work
   - "organizationLocations": Company headquarters/office locations
   - "organizationJobLocations": Locations mentioned in job postings

3. **Seniority Mapping** (${currentProvider} format):
   ${currentProvider === 'apollo' ? `
   - CEO, CTO, CFO, President → "c_suite"
   - Founder, Co-founder → "founder"  
   - VP, Vice President → "vp"
   - Director, Head of → "director"
   - Manager, Lead → "manager"
   - Senior Engineer, Senior Manager → "senior"
   - Entry level, Junior, Associate → "entry"
   - Owner, Proprietor → "owner"` : `
   - CEO, CTO, CFO, President → "cxo"
   - VP, Vice President → "vp"
   - Director, Head of → "director"
   - Manager, Lead → "manager"
   - Senior Engineer, Senior Manager → "senior"
   - Entry level, Junior, Associate → "entry"`}

4. **Company Size Mapping**:
   - "startup", "small company" → ["1-10", "11-50"]
   - "mid-size", "medium company" → ["51-200", "201-500"]  
   - "large company", "enterprise" → ["501-1000", "1001-5000", "5001-10000"]
   - "Fortune 500", "very large" → ["5001-10000", "10001+"]

5. **Revenue Inference**:
   - "startup" → revenueMax: 10000000 ($10M)
   - "mid-size" → revenueMin: 10000000, revenueMax: 100000000 ($10M-$100M)
   - "enterprise" → revenueMin: 100000000 ($100M+)

6. **Industry Context Clues**:
   - "SaaS", "software" → "Technology"
   - "hospital", "clinic" → "Healthcare"  
   - "bank", "fintech" → "Finance"
   - "ecommerce", "retail" → "Retail"

7. **Temporal Expression Parsing** (calculate from current date: ${new Date().toISOString().split('T')[0]}):
   - "past month" → organizationJobPostedAtMin: "${new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]}"
   - "past 3 months" → organizationJobPostedAtMin: "${new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0]}"
   - "recently" → organizationJobPostedAtMin: "${new Date(Date.now() - 14*24*60*60*1000).toISOString().split('T')[0]}"
   - "last week" → organizationJobPostedAtMin: "${new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]}"

8. **Activity Signal Detection**:
   - Mentions of "hiring", "recruiting", "job openings" → jobPostings: true
   - Mentions of "growing", "expanding", "scaling" → newsEvents: true, jobPostings: true
   - Mentions of "popular", "high traffic", "well-known" → webTraffic: true

9. **Generic Decision Maker Mapping**:
   - "decision makers", "key stakeholders" in small companies → ["CEO", "Founder", "Owner"]
   - Context mentions "marketing" → add ["CMO", "Head of Marketing", "Marketing Director"]
   - Context mentions "sales" → add ["VP Sales", "Head of Sales", "Sales Director"]
   - Context mentions "technology" → add ["CTO", "Head of Engineering", "VP Engineering"]

10. **Filter Validation**:
    - Ensure all arrays contain valid, non-empty strings
    - Set null for unused numeric fields rather than 0
    - Use proper date format (YYYY-MM-DD) for date fields
    - Confidence should reflect specificity and clarity of the description

Respond ONLY with valid JSON. Be thorough in extracting ALL relevant filters from the description.`

    console.log('Sending ICP parsing request to OpenAI...')
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert B2B lead generation analyst. Respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    console.log('OpenAI response received:', responseContent)

    // Clean the response content (remove markdown formatting if present)
    let cleanedContent = responseContent.trim()
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    // Remove any leading/trailing backticks
    cleanedContent = cleanedContent.replace(/^`+|`+$/g, '')

    try {
      const parsedData = JSON.parse(cleanedContent)
      const validatedICP = ParsedICPSchema.parse(parsedData)

      // Heuristic fix: replace generic "Decision Maker" terms with concrete titles if LLM missed it
      const normalizeJobTitles = (titles: string[], companySizeArr: string[]): string[] => {
        const lowerTitles = titles.map(t => t.toLowerCase())
        const hasGeneric = lowerTitles.some(t => t.includes('decision maker') || t.includes('key stakeholder'))
        if (!hasGeneric) return titles

        const isSmallCompany = companySizeArr.some(size => {
          const [min] = size.split('-')
          return parseInt(min) <= 200 || size.includes('1-10') || size.includes('11-50') || size.includes('51-200')
        })

        const extraTitles: string[] = []
        if (isSmallCompany) {
          extraTitles.push('CEO', 'Founder', 'Owner')
        } else {
          extraTitles.push('CEO', 'COO', 'CTO')
        }
        // Ensure uniqueness
        return Array.from(new Set([...titles.filter(t => !hasGeneric || !t.toLowerCase().includes('decision maker') && !t.toLowerCase().includes('key stakeholder')), ...extraTitles]))
      }

      const normalizedJobTitles = normalizeJobTitles(validatedICP.jobTitles, validatedICP.companySize)

      const validatedICPNormalized = {
        ...validatedICP,
        jobTitles: normalizedJobTitles
      }
      
      console.log('ICP parsing successful:', validatedICPNormalized)
      
      // Perform provider-specific validation and autocomplete refinement
      let validationResults: any = null
      let refinedICP = validatedICPNormalized
      
      // Convert to unified format for validation
      const unifiedFilters = {
        searchType: validatedICPNormalized.searchType,
        industries: validatedICPNormalized.industries,
        // Combine person and organization locations for legacy validation
        locations: [...(validatedICPNormalized.personLocations || []), ...(validatedICPNormalized.organizationLocations || [])],
        jobTitles: validatedICPNormalized.jobTitles,
        seniorities: validatedICPNormalized.seniorities,
        companySize: validatedICPNormalized.companySize,
        technologies: validatedICPNormalized.technologies,
        keywords: validatedICPNormalized.keywords
      }
      
      try {
        console.log(`Starting ${currentProvider} validation...`)
        
        validationResults = await dataProviderManager.validateFilters(unifiedFilters)
        
        // Refine the ICP based on validation results
        if (validationResults.isValid) {
          refinedICP = {
            ...validatedICP,
            // Update with cleaned filters from validation
            ...(validationResults.cleanedFilters && {
              industries: validationResults.cleanedFilters.industries || validatedICP.industries,
              // Map cleaned locations back to both person and organization locations
              personLocations: validationResults.cleanedFilters.locations || validatedICP.personLocations || [],
              organizationLocations: validationResults.cleanedFilters.locations || validatedICP.organizationLocations || [],
              jobTitles: validationResults.cleanedFilters.jobTitles || validatedICP.jobTitles,
              seniorities: validationResults.cleanedFilters.seniorities || validatedICP.seniorities,
              companySize: validationResults.cleanedFilters.companyHeadcount || validatedICP.companySize,
              technologies: validationResults.cleanedFilters.technologies || validatedICP.technologies,
              keywords: validationResults.cleanedFilters.keywords || validatedICP.keywords
            })
          }
          
          console.log(`ICP refined with ${currentProvider} validation:`, refinedICP)
        } else {
          console.warn(`${currentProvider} validation failed:`, validationResults.errors)
        }
      } catch (validationError) {
        console.error(`${currentProvider} validation error:`, validationError)
        // Continue without validation if provider fails
        validationResults = {
          isValid: false,
          errors: [validationError instanceof Error ? validationError.message : 'Validation service unavailable'],
          warnings: [],
          cleanedFilters: unifiedFilters
        }
      }
      
      return NextResponse.json({
        success: true,
        parsedICP: refinedICP,
        originalICP: validatedICP,
        validation: validationResults,
        provider: currentProvider,
        meta: {
          provider: currentProvider,
          filterOptions: filterOptions,
          providerFeatures: dataProviderManager.getProviderInfo().features
        }
      })

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      console.error('Raw response:', cleanedContent)
      
      return NextResponse.json(
        { error: 'Failed to parse ICP description. Please try rephrasing your request.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error parsing ICP:', error)
    
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 500 }
        )
      } else if (error.status === 429) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze ICP description' },
      { status: 500 }
    )
  }
} 