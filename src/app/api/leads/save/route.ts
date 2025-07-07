import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { LeadSearchResult } from '@/types/apollo'

interface LeadSaveRequest {
  leads: LeadSearchResult[]
  campaignId?: string
  source?: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to normalize lead data for enhanced database schema
function normalizeLeadForDatabase(lead: LeadSearchResult) {
  // Generate external_id if not provided
  const externalId = lead.external_id || 
    lead.id || 
    `apollo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  return {
    external_id: externalId,
    first_name: lead.first_name || undefined,
    last_name: lead.last_name || undefined,
    full_name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
    email: lead.email,
    phone: lead.phone || undefined,
    headline: lead.headline || undefined,
    photo_url: lead.photo_url || undefined,
    title: lead.title || undefined,
    company: lead.company || 'Unknown',
    industry: lead.industry || undefined,
    location: lead.location || undefined,
    city: lead.city || undefined,
    state: lead.state || undefined,
    country: lead.country || undefined,
    linkedin_url: lead.linkedin_url || undefined,
    twitter_url: lead.twitter_url || undefined,
    facebook_url: lead.facebook_url || undefined,
    github_url: lead.github_url || undefined,
    employee_count: lead.company_size || undefined,
    revenue: lead.company_revenue || undefined,
    company_id: lead.company_id || undefined,
    company_website: lead.company_website || undefined,
    company_linkedin: lead.company_linkedin || undefined,
    company_founded_year: lead.company_founded_year || undefined,
    company_logo_url: lead.company_logo_url || undefined,
    company_phone: lead.company_phone || undefined,
    company_alexa_ranking: lead.company_alexa_ranking || undefined,
    company_primary_domain: lead.company_primary_domain || undefined,
    company_headcount_six_month_growth: lead.company_headcount_six_month_growth || undefined,
    company_headcount_twelve_month_growth: lead.company_headcount_twelve_month_growth || undefined,
    company_headcount_twenty_four_month_growth: lead.company_headcount_twenty_four_month_growth || undefined,
    departments: lead.departments || [],
    subdepartments: lead.subdepartments || [],
    seniority: lead.seniority || undefined,
    functions: lead.functions || [],
    years_experience: lead.years_experience || undefined,
    time_in_current_role: lead.time_in_current_role || undefined,
    employment_history: lead.employment_history || [],
    email_status: lead.email_status || undefined,
    source: lead.data_source || 'apollo',
    verified: true, // Default to true for Apollo data
    confidence: lead.confidence || 1.0,
    technologies: lead.technologies || [],
    keywords: lead.keywords || []
  }
}

// Helper function to validate lead data
function validateLead(lead: LeadSearchResult): string[] {
  const errors: string[] = []
  
  if (!lead.email || !lead.email.trim()) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    errors.push('Invalid email format')
  }
  
  if (!lead.company?.trim() && !lead.first_name?.trim() && !lead.last_name?.trim()) {
    errors.push('Either company name or personal name is required')
  }
  
  return errors
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: LeadSaveRequest = await request.json()
    const { leads, campaignId } = body

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
    }

    // Validate all leads first
    const validationErrors: Array<{index: number, errors: string[]}> = []
    leads.forEach((lead, index) => {
      const errors = validateLead(lead)
      if (errors.length > 0) {
        validationErrors.push({ index, errors })
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 })
    }

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Normalize leads data for enhanced schema
    const normalizedLeads = leads.map(normalizeLeadForDatabase)

    // Use the enhanced upsert function for batch insertion
    const insertedLeads: Array<{id: string, external_id: string}> = []
    const errors: Array<{lead: any, error: string}> = []

    for (const lead of normalizedLeads) {
      try {
        const { data: leadId, error: leadError } = await supabase
          .rpc('upsert_lead_enhanced', {
            p_external_id: lead.external_id,
            p_first_name: lead.first_name,
            p_last_name: lead.last_name,
            p_full_name: lead.full_name,
            p_email: lead.email,
            p_phone: lead.phone,
            p_headline: lead.headline,
            p_photo_url: lead.photo_url,
            p_title: lead.title,
            p_company: lead.company,
            p_industry: lead.industry,
            p_location: lead.location,
            p_city: lead.city,
            p_state: lead.state,
            p_country: lead.country,
            p_linkedin_url: lead.linkedin_url,
            p_twitter_url: lead.twitter_url,
            p_facebook_url: lead.facebook_url,
            p_github_url: lead.github_url,
            p_employee_count: lead.employee_count,
            p_revenue: lead.revenue,
            p_company_id: lead.company_id,
            p_company_website: lead.company_website,
            p_company_linkedin: lead.company_linkedin,
            p_company_founded_year: lead.company_founded_year,
            p_company_logo_url: lead.company_logo_url,
            p_company_phone: lead.company_phone,
            p_company_alexa_ranking: lead.company_alexa_ranking,
            p_company_primary_domain: lead.company_primary_domain,
            p_company_headcount_six_month_growth: lead.company_headcount_six_month_growth,
            p_company_headcount_twelve_month_growth: lead.company_headcount_twelve_month_growth,
            p_company_headcount_twenty_four_month_growth: lead.company_headcount_twenty_four_month_growth,
            p_departments: lead.departments,
            p_subdepartments: lead.subdepartments,
            p_seniority: lead.seniority,
            p_functions: lead.functions,
            p_years_experience: lead.years_experience,
            p_time_in_current_role: lead.time_in_current_role,
            p_employment_history: lead.employment_history,
            p_email_status: lead.email_status,
            p_source: lead.source,
            p_verified: lead.verified,
            p_confidence: lead.confidence,
            p_technologies: lead.technologies,
            p_keywords: lead.keywords
          })

        if (leadError) {
          console.error('Error upserting lead:', leadError)
          errors.push({ lead: lead.external_id, error: leadError.message })
        } else {
          insertedLeads.push({ id: leadId, external_id: lead.external_id })
        }
      } catch (error) {
        console.error('Error processing lead:', error)
        errors.push({ 
          lead: lead.external_id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    // If campaignId is provided, create campaign_leads associations
    if (campaignId && insertedLeads.length > 0) {
      // Get organization ID from campaign
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('organization_id')
        .eq('id', campaignId)
        .single()
      
      const campaignLeadInserts = insertedLeads.map(lead => ({
        campaign_id: campaignId,
        lead_id: lead.id,
        assigned_by: userId,
        assigned_at: new Date().toISOString(),
        status: 'pending' as const,
        organization_id: campaignData?.organization_id || null
      }))

      const { error: campaignError } = await supabase
        .from('campaign_leads')
        .insert(campaignLeadInserts)
        .select()

      if (campaignError) {
        console.error('Error creating campaign lead associations:', campaignError)
        // Don't fail the entire operation, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${insertedLeads.length} leads${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
      inserted: insertedLeads.length,
      errors: errors.length,
      errorDetails: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error in leads save API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all leads that this user has saved
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('source', 'apollo')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('source', 'apollo')

    if (countError) {
      console.error('Error fetching leads count:', countError)
    }

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in leads save API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 