import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { getCurrentProvider, getDataProviderManager } from '@/lib/data-providers/provider-manager'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Schema for validating the parsed ICP
const ParsedICPSchema = z.object({
  searchType: z.enum(['people', 'company']),
  industries: z.array(z.string()),
  locations: z.array(z.string()),
  jobTitles: z.array(z.string()),
  seniorities: z.array(z.string()),
  companySize: z.array(z.string()),
  technologies: z.array(z.string()),
  keywords: z.array(z.string()),
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
  "industries": [array of industries mentioned or inferred, e.g., "Technology", "Healthcare", "Finance", "SaaS", "Manufacturing"],
  "locations": [array of locations mentioned, e.g., "United States", "California", "New York", "San Francisco", "Europe"],
  "jobTitles": [array of job titles and roles mentioned, e.g., "CEO", "CTO", "Marketing Director", "Head of Engineering"],
  "seniorities": [array of seniority levels inferred from titles - use ${currentProvider === 'apollo' ? 'Apollo format: "owner", "founder", "c_suite", "vp", "director", "manager", "senior", "entry"' : 'Explorium format: "cxo", "vp", "director", "manager", "senior", "entry"'}],
  "companySize": [array of employee count ranges, e.g., "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"],
  "technologies": [array of technologies or tools mentioned, e.g., "Salesforce", "AWS", "React", "Workday"],
  "keywords": [array of other relevant keywords for filtering],
  "confidence": number between 0-100 indicating confidence in the analysis,
  "reasoning": "Brief explanation of how you interpreted the ICP description"
}

Guidelines for parsing:
1. If job titles are mentioned, set searchType to "people"
2. If only company characteristics are mentioned, set searchType to "company"
3. Map common company size descriptions:
   - "startup" or "small" → ["1-10", "11-50"]
   - "mid-size" or "medium" → ["51-200", "201-500"]
   - "large" or "enterprise" → ["501-1000", "1001-5000", "5001-10000", "10001+"]
4. Map seniority from job titles according to ${currentProvider} format:
   ${currentProvider === 'apollo' ? `
   - CEO, CTO, CFO, etc. → "founder" or "c_suite"
   - VP, Vice President → "vp"
   - Director, Head of → "director"
   - Manager → "manager"
   - Senior Engineer, Senior Manager → "senior"
   - Entry level → "entry"
   - Owner → "owner"` : `
   - CEO, CTO, CFO, etc. → "cxo"
   - VP, Vice President → "vp"
   - Director, Head of → "director"
   - Manager → "manager"
   - Senior Engineer, Senior Manager → "senior"
   - Entry level → "entry"`}
5. Include both exact locations mentioned and reasonable geographic expansions
6. Extract industry from context clues (e.g., "SaaS" → "Technology", "hospitals" → "Healthcare")
7. Be generous with keyword extraction to catch edge cases
8. Confidence should reflect how specific and clear the description is
9. Use ${currentProvider} compatible values for all fields

Respond ONLY with valid JSON.`

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
      
      console.log('ICP parsing successful:', validatedICP)
      
      // Perform provider-specific validation and autocomplete refinement
      let validationResults: any = null
      let refinedICP = validatedICP
      
      // Convert to unified format for validation
      const unifiedFilters = {
        searchType: validatedICP.searchType,
        industries: validatedICP.industries,
        locations: validatedICP.locations,
        jobTitles: validatedICP.jobTitles,
        seniorities: validatedICP.seniorities,
        companyHeadcount: validatedICP.companySize,
        technologies: validatedICP.technologies,
        keywords: validatedICP.keywords
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
              locations: validationResults.cleanedFilters.locations || validatedICP.locations,
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