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

    console.log('✅ User verification successful:', userData.id)

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
        const analysis = existingAnalysis as any; // Type assertion to avoid TypeScript issues
        console.log('📄 Found existing analysis:', {
          id: analysis.id,
          status: analysis.analysis_status,
          confidence_score: analysis.confidence_score,
          core_offer: analysis.core_offer?.substring(0, 100) + '...',
          created_at: analysis.created_at
        })

        // If analysis exists and is completed, return it
        if (analysis.analysis_status === 'completed') {
          console.log('✅ Returning existing completed analysis (cached result)')
          console.log('🔍 Cached analysis details:', {
            confidence_score: analysis.confidence_score,
            icp_summary_preview: analysis.icp_summary?.substring(0, 200) + '...',
            target_personas_count: Array.isArray(analysis.target_personas) ? analysis.target_personas.length : 'invalid_format',
            analysis_status: analysis.analysis_status
          })
          
          // Check if this looks like a fallback analysis (low confidence or minimal content)
          if ((analysis.confidence_score || 0) < 0.3 || 
              analysis.icp_summary?.includes('based on URL and page structure only') ||
              analysis.icp_summary?.includes('content fetching limitations')) {
            console.warn('⚠️ WARNING: Returning cached FALLBACK analysis with low confidence!')
            console.warn('💡 TIP: Use force=true to regenerate with fresh analysis')
          }

          return NextResponse.json({
            success: true,
            message: 'Analysis already exists',
            analysisId: analysis.id,
            status: 'completed',
            cached: true,
            confidence_score: analysis.confidence_score,
            analysis: {
              id: analysis.id,
              website_url: analysis.website_url,
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
              completed_at: analysis.completed_at
            }
          })
        } else {
          console.log(`📊 Found existing analysis but status is "${analysis.analysis_status}", not returning cached result`)
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
      .insert(analysisData as any) // Type assertion to avoid TypeScript issues
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

    console.log('✅ Analysis record created successfully:', (analysisRecord as any)?.id)

    // Return immediate response indicating analysis has started
    const response = NextResponse.json({
      success: true,
      message: 'Website analysis started',
      analysisId: (analysisRecord as any)?.id,
      status: 'analyzing',
      cached: false
    })

    console.log('🎯 Starting background analysis for:', website_url)
    // Start the analysis in the background (don't await)
    performAnalysisInBackground((analysisRecord as any)?.id, website_url, userData.id)

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

    const analysisData = analysis as any; // Type assertion to avoid TypeScript issues
    console.log('📊 Analysis status retrieved:', {
      id: analysisData.id,
      status: analysisData.analysis_status,
      confidence_score: analysisData.confidence_score
    })

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysisData.id,
        status: analysisData.analysis_status,
        website_url: analysisData.website_url,
        started_at: analysisData.started_at,
        completed_at: analysisData.completed_at,
        core_offer: analysisData.core_offer,
        industry: analysisData.industry,
        business_model: analysisData.business_model,
        icp_summary: analysisData.icp_summary,
        target_personas: analysisData.target_personas,
        case_studies: analysisData.case_studies,
        lead_magnets: analysisData.lead_magnets,
        competitive_advantages: analysisData.competitive_advantages,
        tech_stack: analysisData.tech_stack,
        social_proof: analysisData.social_proof,
        confidence_score: analysisData.confidence_score,
        pages_analyzed: analysisData.pages_analyzed,
        total_pages_found: analysisData.total_pages_found,
        analysis_duration_seconds: analysisData.analysis_duration_seconds
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
    
    // Determine analysis method based on environment
    const forceBrowserFree = process.env.FORCE_BROWSER_FREE_ANALYSIS === 'true'
    const disableBrowser = process.env.DISABLE_BROWSER_AUTOMATION === 'true'
    const isCloudEnvironment = process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.GOOGLE_CLOUD_PROJECT
    const shouldUseBrowserFree = forceBrowserFree || disableBrowser || isCloudEnvironment
    
    let analysis: ComprehensiveICPAnalysis
    
    if (shouldUseBrowserFree) {
      console.log('☁️ Using browser-free analysis (Cloud environment or forced)')
      const { AIICPService } = await import('@/lib/ai-icp-service')
      
      // Use memory-optimized settings for cloud environments
      const maxPages = 6  // Reduced from 15 to prevent memory issues
      const timeout = 20000 // Reduced timeout
      const service = new AIICPService(maxPages, timeout)
      
      // Force garbage collection if available
      if (global.gc) {
        console.log('🧹 Running garbage collection before analysis')
        global.gc()
      }
      
      try {
        analysis = await service.analyzeWebsiteNoBrowser(websiteUrl)
        
        // Force cleanup after analysis
        if (global.gc) {
          console.log('🧹 Running garbage collection after analysis')
          global.gc()
        }
      } catch (browserFreeError) {
        console.error('❌ Browser-free analysis failed:', browserFreeError)
        console.log('🔄 Attempting minimal fallback analysis...')
        try {
          // Try with even more conservative settings
          const minimalService = new AIICPService(3, 15000)
          analysis = await minimalService.analyzeWebsiteNoBrowser(websiteUrl)
        } catch (minimalError) {
          console.error('❌ Minimal analysis failed, trying fast standard analysis:', minimalError)
          try {
            analysis = await analyzeWebsiteICP(websiteUrl, true) // Use fast mode as last resort
          } catch (standardError) {
            console.error('❌ All analysis methods failed:', standardError)
            const errorMessage = browserFreeError instanceof Error ? browserFreeError.message : 'Unknown browser-free analysis error'
            throw new Error(`Website analysis failed: ${errorMessage}`)
          }
        }
      }
    } else {
      console.log('💻 Local environment - using standard analysis')
      analysis = await analyzeWebsiteICP(websiteUrl)
    }
    
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
    
    const updateData: any = {
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
    };
    
    const { error: updateError } = await (supabaseAdmin as any)
      .from('website_analysis')
      .update(updateData)
      .eq('id', analysisId)

    if (updateError) {
      console.error('❌ Error updating analysis record:', updateError)
      
      // Mark as failed
      await (supabase as any)
        .from('website_analysis')
        .update({
          analysis_status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: updateError.message
        })
        .eq('id', analysisId)
    } else {
      console.log('✅ Analysis completed and saved successfully')
      
      // REMOVED: No longer updating user_profile with analysis data
      // Analysis data is stored only in website_analysis table (single source of truth)
      console.log('✅ Analysis data stored in website_analysis table only (cleaned up architecture)')
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
    
    // Enhanced cloud debugging information
    console.error('🔧 Environment debug info:', {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      hasVercel: !!process.env.VERCEL,
      hasGCP: !!process.env.GOOGLE_CLOUD_PROJECT,
      forceBrowserFree: process.env.FORCE_BROWSER_FREE_ANALYSIS,
      disableBrowser: process.env.DISABLE_BROWSER_AUTOMATION,
      analysisUrl: websiteUrl,
      analysisId: analysisId
    })

    // Mark analysis as failed with enhanced metadata
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during analysis'
    const { error: failedUpdateError } = await (supabase as any)
      .from('website_analysis')
      .update({
        analysis_status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
        analysis_metadata: {
          error_type: error instanceof Error ? error.name : 'UnknownError',
          error_details: error instanceof Error ? error.message : String(error),
          environment: {
            isCloudRun: !!process.env.GOOGLE_CLOUD_PROJECT,
            isProduction: process.env.NODE_ENV === 'production',
            platform: process.platform,
            nodeVersion: process.version,
            forcedBrowserFree: process.env.FORCE_BROWSER_FREE_ANALYSIS === 'true'
          },
          failed_at: new Date().toISOString()
        }
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