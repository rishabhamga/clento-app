import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeWebsiteICP, ComprehensiveICPAnalysis } from '@/lib/ai-icp-service'
import { getOrCreateUserByClerkId } from '@/lib/user-sync'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 Processing analyze-site request for Clerk user:', userId)

    const body = await request.json()
    // Accept both 'url' and 'website_url' for compatibility
    const website_url = body.website_url || body.url
    const force = body.force !== false // Default to true, only false if explicitly set to false

    if (!website_url) {
      console.error('❌ Missing website URL in request body')
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
    }

    console.log('📋 Request details:', { website_url, force: force ? 'FORCED REFRESH' : 'ALLOW CACHE', userId })

    // Validate URL format
    try {
      new URL(website_url)
      console.log('✅ URL format validation passed')
    } catch {
      console.error('❌ Invalid URL format:', website_url)
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    console.log('🔄 Attempting to sync user to Supabase...')

    // Get or create user in Supabase (auto-sync)
    const userData = await getOrCreateUserByClerkId(userId)
    
    if (!userData) {
      console.error('❌ Failed to sync user account for Clerk ID:', userId)
      return NextResponse.json({ 
        error: 'Failed to sync user account',
        details: 'Could not create or find user in database'
      }, { status: 500 })
    }

    console.log('✅ User synced successfully. User ID:', userData.id)

    // Double-check that the user actually exists in the database
    const { data: userVerification, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id')
      .eq('id', userData.id)
      .single()

    if (verifyError || !userVerification) {
      console.error('❌ User verification failed after sync:', verifyError)
      return NextResponse.json({ 
        error: 'User verification failed',
        details: 'User was created but cannot be found in database'
      }, { status: 500 })
    }

    console.log('✅ User verification successful:', userVerification.id)

    // Check for existing analysis for this URL only if not forcing refresh
    if (!force) {
      console.log('🔍 Checking for existing analysis (cache)...')
      const { data: existingAnalysis, error: existingError } = await supabaseAdmin
        .from('website_analysis')
        .select('*')
        .eq('user_id', userData.id)
        .eq('website_url', website_url)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingAnalysis && !existingError) {
        console.log('📄 Found existing analysis:', {
          id: existingAnalysis.id,
          status: existingAnalysis.analysis_status,
          confidence_score: existingAnalysis.confidence_score,
          core_offer: existingAnalysis.core_offer?.substring(0, 100) + '...',
          created_at: existingAnalysis.created_at
        })

        // If analysis exists and is completed, return it
        if (existingAnalysis.analysis_status === 'completed') {
          console.log('✅ Returning existing completed analysis (cached result)')
          console.log('🔍 Cached analysis details:', {
            confidence_score: existingAnalysis.confidence_score,
            icp_summary_preview: existingAnalysis.icp_summary?.substring(0, 200) + '...',
            target_personas_count: Array.isArray(existingAnalysis.target_personas) ? existingAnalysis.target_personas.length : 'invalid_format',
            analysis_status: existingAnalysis.analysis_status
          })
          
          // Check if this looks like a fallback analysis (low confidence or minimal content)
          if (existingAnalysis.confidence_score < 0.3 || 
              existingAnalysis.icp_summary?.includes('based on URL and page structure only') ||
              existingAnalysis.icp_summary?.includes('content fetching limitations')) {
            console.warn('⚠️ WARNING: Returning cached FALLBACK analysis with low confidence!')
            console.warn('💡 TIP: Use force=true to regenerate with fresh analysis')
          }

          return NextResponse.json({
            success: true,
            message: 'Analysis already exists',
            analysisId: existingAnalysis.id,
            status: 'completed',
            cached: true,
            confidence_score: existingAnalysis.confidence_score,
            analysis: {
              id: existingAnalysis.id,
              website_url: existingAnalysis.website_url,
              core_offer: existingAnalysis.core_offer,
              industry: existingAnalysis.industry,
              business_model: existingAnalysis.business_model,
              icp_summary: existingAnalysis.icp_summary,
              target_personas: existingAnalysis.target_personas,
              case_studies: existingAnalysis.case_studies,
              lead_magnets: existingAnalysis.lead_magnets,
              competitive_advantages: existingAnalysis.competitive_advantages,
              tech_stack: existingAnalysis.tech_stack,
              social_proof: existingAnalysis.social_proof,
              confidence_score: existingAnalysis.confidence_score,
              pages_analyzed: existingAnalysis.pages_analyzed,
              completed_at: existingAnalysis.completed_at
            }
          })
        } else {
          console.log(`📊 Found existing analysis but status is "${existingAnalysis.analysis_status}", not returning cached result`)
        }
      } else {
        console.log('🔍 No existing analysis found, will create new one')
        if (existingError) {
          console.log('🔍 Existing analysis query error (not critical):', existingError.message)
        }
      }
    } else {
      console.log('🔄 Force refresh requested - bypassing cache and deleting existing records')
      
      // Delete existing analysis records for this URL to start fresh
      const { error: deleteError } = await supabaseAdmin
        .from('website_analysis')
        .delete()
        .eq('user_id', userData.id)
        .eq('website_url', website_url)
      
      if (deleteError) {
        console.error('❌ Error deleting existing analysis:', deleteError)
        // Continue anyway, this is not critical
      } else {
        console.log('✅ Deleted existing analysis records for fresh analysis')
      }
    }

    console.log('🆕 Creating new analysis record for URL:', website_url, 'User ID:', userData.id)

    // Create new analysis record
    const analysisData = {
      user_id: userData.id,
      website_url,
      analysis_status: 'analyzing',
      started_at: new Date().toISOString()
    }

    console.log('📝 Analysis data to insert:', analysisData)

    const { data: analysisRecord, error: insertError } = await supabaseAdmin
      .from('website_analysis')
      .insert(analysisData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating analysis record:', insertError)
      
      // Special handling for foreign key constraint errors
      if (insertError.code === '23503') {
        console.error('❌ Foreign key constraint violation - user_id does not exist in users table')
        
        // Try to re-fetch the user to diagnose the issue
        const { data: userRecheck, error: recheckError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', userData.id)
          .single()
        
        console.log('🔍 User recheck result:', userRecheck, 'Error:', recheckError)
        
        return NextResponse.json({ 
          error: 'Database consistency error',
          details: 'User exists in function but not in database table',
          debug: {
            userId: userData.id,
            clerkId: userId,
            userRecheck: userRecheck,
            recheckError: recheckError
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to start analysis', 
        details: insertError.message || 'Unknown database error',
        code: insertError.code
      }, { status: 500 })
    }

    if (!analysisRecord) {
      console.error('❌ Analysis record creation returned no data')
      return NextResponse.json({ 
        error: 'Failed to start analysis',
        details: 'Database insert returned no data'
      }, { status: 500 })
    }

    console.log('✅ Analysis record created successfully:', analysisRecord.id)

    // Return immediate response indicating analysis has started
    const response = NextResponse.json({
      success: true,
      message: 'Website analysis started',
      analysisId: analysisRecord.id,
      status: 'analyzing',
      cached: false
    })

    console.log('🎯 Starting background analysis for:', website_url)
    // Start the analysis in the background (don't await)
    performAnalysisInBackground(analysisRecord.id, website_url, userData.id)

    return response

  } catch (error) {
    console.error('💥 Website analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze website', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check analysis status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const analysisId = url.searchParams.get('id')
    const websiteUrl = url.searchParams.get('url')

    console.log('📊 Getting analysis status:', { analysisId, websiteUrl, userId })

    const supabase = supabaseAdmin

    // Get or create user in Supabase (auto-sync)
    const userData = await getOrCreateUserByClerkId(userId)
    
    if (!userData) {
      return NextResponse.json({ error: 'Failed to sync user account' }, { status: 500 })
    }

    let query = supabase
      .from('website_analysis')
      .select('*')
      .eq('user_id', userData.id)

    if (analysisId) {
      query = query.eq('id', analysisId)
    } else if (websiteUrl) {
      query = query.eq('website_url', websiteUrl)
    } else {
      return NextResponse.json({ error: 'Either analysis ID or website URL is required' }, { status: 400 })
    }

    const { data: analysis, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !analysis) {
      console.log('❌ Analysis not found:', { error, analysisId, websiteUrl })
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    console.log('📊 Analysis status retrieved:', {
      id: analysis.id,
      status: analysis.analysis_status,
      confidence_score: analysis.confidence_score
    })

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        status: analysis.analysis_status,
        website_url: analysis.website_url,
        started_at: analysis.started_at,
        completed_at: analysis.completed_at,
        core_offer: analysis.core_offer,
        industry: analysis.industry,
        business_model: analysis.business_model,
        icp_summary: analysis.icp_summary,
        target_personas: analysis.target_personas,
        case_studies: analysis.case_studies,
        lead_magnets: analysis.lead_magnets,
        competitive_advantages: analysis.competitive_advantages,
        tech_stack: analysis.tech_stack,
        social_proof: analysis.social_proof,
        confidence_score: analysis.confidence_score,
        pages_analyzed: analysis.pages_analyzed,
        total_pages_found: analysis.total_pages_found,
        analysis_duration_seconds: analysis.analysis_duration_seconds
      }
    })

  } catch (error) {
    console.error('💥 Get analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to get analysis status' },
      { status: 500 }
    )
  }
}

// Background analysis function
async function performAnalysisInBackground(analysisId: string, websiteUrl: string, userId: string) {
  const supabase = supabaseAdmin
  
  try {
    console.log(`🎯 Starting background analysis for ${websiteUrl} (Analysis ID: ${analysisId})`)
    
    // Perform the comprehensive analysis
    const startTime = Date.now()
    console.log('⚡ Calling analyzeWebsiteICP...')
    const analysis: ComprehensiveICPAnalysis = await analyzeWebsiteICP(websiteUrl)
    const endTime = Date.now()
    const durationSeconds = Math.round((endTime - startTime) / 1000)

    console.log(`✅ Analysis completed in ${durationSeconds} seconds`)
    console.log('📊 Analysis summary:', {
      core_offer: analysis.core_offer?.substring(0, 100) + '...',
      industry: analysis.industry,
      confidence_score: analysis.confidence_score,
      personas_count: analysis.target_personas?.length || 0,
      case_studies_count: analysis.case_studies?.length || 0,
      competitive_advantages_count: analysis.competitive_advantages?.length || 0
    })

    // Check if this is a fallback result
    if (analysis.confidence_score < 0.3) {
      console.warn('⚠️ WARNING: Analysis returned low confidence score:', analysis.confidence_score)
      console.warn('📝 This may indicate a fallback analysis was used')
    }

    // Update the analysis record with results
    console.log('💾 Saving analysis results to database...')
    const { error: updateError } = await supabase
      .from('website_analysis')
      .update({
        analysis_status: 'completed',
        completed_at: new Date().toISOString(),
        
        // Core business intelligence
        core_offer: analysis.core_offer,
        industry: analysis.industry,
        business_model: analysis.business_model,
        target_market_summary: analysis.icp_summary,
        
        // ICP Analysis Results
        icp_summary: analysis.icp_summary,
        target_personas: analysis.target_personas,
        case_studies: analysis.case_studies,
        lead_magnets: analysis.lead_magnets,
        competitive_advantages: analysis.competitive_advantages,
        
        // Technical and social proof
        tech_stack: analysis.tech_stack,
        social_proof: analysis.social_proof,
        
        // Analysis metadata
        analysis_duration_seconds: durationSeconds,
        ai_model_used: 'gpt-4o',
        confidence_score: analysis.confidence_score,
        
        pages_analyzed: 0, // Will be updated when we track individual pages
        total_pages_found: 0
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('❌ Error updating analysis record:', updateError)
      
      // Mark as failed
      await supabase
        .from('website_analysis')
        .update({
          analysis_status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: updateError.message
        })
        .eq('id', analysisId)
    } else {
      console.log('✅ Analysis completed and saved successfully')
      
      // Also update the user profile with the latest analysis
      console.log('🔄 Updating user profile...')
      const { error: profileError } = await supabase
        .from('user_profile')
        .upsert({
          user_id: userId,
          website_url: websiteUrl,
          core_offer: analysis.core_offer,
          industry_details: { industry: analysis.industry, business_model: analysis.business_model },
          target_personas: analysis.target_personas,
          case_studies: analysis.case_studies,
          lead_magnets: analysis.lead_magnets,
          competitive_advantages: analysis.competitive_advantages,
          tech_stack: analysis.tech_stack,
          social_proof: analysis.social_proof,
          ai_analysis_metadata: {
            confidence_score: analysis.confidence_score,
            analysis_completed_at: new Date().toISOString(),
            analysis_duration_seconds: durationSeconds
          },
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('⚠️ Warning: Error updating user profile (not critical):', profileError)
      } else {
        console.log('✅ User profile updated successfully')
      }
    }

  } catch (error) {
    console.error('💥 Background analysis failed:', error)
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 1000)
      })
    }

    // Mark analysis as failed
    const { error: failedUpdateError } = await supabase
      .from('website_analysis')
      .update({
        analysis_status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error during analysis'
      })
      .eq('id', analysisId)

    if (failedUpdateError) {
      console.error('❌ Error updating failed analysis status:', failedUpdateError)
    }
  }
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