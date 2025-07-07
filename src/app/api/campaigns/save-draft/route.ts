import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
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

    let result
    if (existingDraft && !fetchError) {
      // Update existing draft
      const { data, error } = await supabase
        .from('campaign_drafts')
        .update(draftData)
        .eq('id', existingDraft.id)
        .select()
        .single()
      
      result = { data, error }
    } else {
      // Create new draft
      const { data, error } = await supabase
        .from('campaign_drafts')
        .insert([{ ...draftData, created_at: new Date().toISOString() }])
        .select()
        .single()
      
      result = { data, error }
    }

    if (result.error) {
      console.error('Error saving campaign draft:', result.error)
      return NextResponse.json(
        { error: 'Failed to save campaign draft' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      draft: result.data,
      message: 'Campaign draft saved successfully'
    })

  } catch (error) {
    console.error('Error in save-draft API:', error)
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