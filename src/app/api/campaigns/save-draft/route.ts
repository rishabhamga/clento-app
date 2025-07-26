import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📝 [SAVE DRAFT] Request body keys:', Object.keys(body))
    console.log('📝 [SAVE DRAFT] User ID:', userId)
    
    const {
      campaignName,
      websiteUrl,
      websiteAnalysis,
      offeringDescription,
      painPoints,
      proofPoints,
      coachingPoints,
      emailBodyCoaching,
      filters,
      selectedLeads,
      step
    } = body

    // Save or update campaign draft
    const { data: existingDraft, error: fetchError } = await supabase
      .from('campaign_drafts')
      .select('*')
      .eq('user_id', userId)
      .eq('campaign_name', campaignName || 'Untitled Campaign')
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [SAVE DRAFT] Error fetching existing draft:', fetchError)
    }

    const draftData = {
      user_id: userId,
      campaign_name: campaignName || 'Untitled Campaign',
      website_url: websiteUrl,
      website_analysis: websiteAnalysis,
      offering_description: offeringDescription,
      pain_points: painPoints || [],
      proof_points: proofPoints || [],
      coaching_points: coachingPoints || [],
      email_body_coaching: emailBodyCoaching || [],
      filters: filters || {},
      selected_leads: selectedLeads || [],
      current_step: step || 'targeting',
      updated_at: new Date().toISOString()
    }

    console.log('💾 [SAVE DRAFT] Draft data prepared:', {
      hasWebsiteAnalysis: !!draftData.website_analysis,
      painPointsCount: draftData.pain_points.length,
      proofPointsCount: draftData.proof_points.length,
      currentStep: draftData.current_step
    })

    let result
    if (existingDraft && !fetchError) {
      console.log('🔄 [SAVE DRAFT] Updating existing draft:', existingDraft.id)
      // Update existing draft
      const { data, error } = await supabase
        .from('campaign_drafts')
        .update(draftData)
        .eq('id', existingDraft.id)
        .select()
        .single()
      
      result = { data, error }
    } else {
      console.log('✨ [SAVE DRAFT] Creating new draft')
      // Create new draft
      const { data, error } = await supabase
        .from('campaign_drafts')
        .insert([{ ...draftData, created_at: new Date().toISOString() }])
        .select()
        .single()
      
      result = { data, error }
    }

    if (result.error) {
      console.error('❌ [SAVE DRAFT] Database error:', {
        error: result.error,
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint
      })
      return NextResponse.json(
        { 
          error: 'Failed to save campaign draft',
          details: result.error.message,
          code: result.error.code
        },
        { status: 500 }
      )
    }

    console.log('✅ [SAVE DRAFT] Successfully saved draft:', result.data?.id)
    return NextResponse.json({
      success: true,
      draft: result.data,
      message: 'Campaign draft saved successfully'
    })

  } catch (error) {
    console.error('💥 [SAVE DRAFT] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
    const campaignName = searchParams.get('campaignName')

    let query = supabase
      .from('campaign_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (campaignName) {
      query = query.eq('campaign_name', campaignName)
    }

    const { data: drafts, error } = await query

    if (error) {
      console.error('Error fetching campaign drafts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campaign drafts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      drafts: campaignName ? (drafts[0] || null) : drafts
    })

  } catch (error) {
    console.error('Error in save-draft GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 