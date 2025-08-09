import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/console/campaigns/[id]
 * Get campaign data for email personalization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: campaignId } = await params;

    // Try to fetch from campaigns table first
    let { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // If not found in campaigns, try campaign_drafts
    if (campaignError || !campaignData) {
      const { data: draftData, error: draftError } = await supabase
        .from('campaign_drafts')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (draftError || !draftData) {
        console.error(`Campaign not found in campaigns or drafts: ${campaignId}`, { campaignError, draftError });
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }

      // Transform draft data to campaign format
      campaignData = {
        id: draftData.id,
        user_id: draftData.user_id,
        name: draftData.campaign_name,
        description: draftData.offering_description,
        status: 'draft',
        sequence_template: 'email_first',
        settings: {
          pitch: {
            websiteUrl: draftData.website_url,
            websiteAnalysis: draftData.website_analysis,
            offeringDescription: draftData.offering_description,
            painPoints: draftData.pain_points || [],
            proofPoints: draftData.proof_points || [],
            coachingPoints: draftData.coaching_points || [],
            emailCoachingPoints: draftData.email_body_coaching || []
          },
          targeting: {
            filters: draftData.filters || {}
          },
          selectedLeads: draftData.selected_leads || []
        },
        created_at: draftData.created_at,
        updated_at: draftData.updated_at,
        organization_id: null // Drafts don't have organization_id in the schema
      };
    }

    // Get associated website analysis if available
    let websiteAnalysis: any = null;
    if (campaignData.user_id) {
      const { data: analysisData } = await supabase
        .from('website_analysis')
        .select('*')
        .eq('user_id', campaignData.user_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      websiteAnalysis = analysisData;
    }

    // Transform database campaign to expected format
    const settings = campaignData.settings || {};
    const transformedCampaignData = {
      id: campaignData.id,
      name: campaignData.name,
      description: campaignData.description || "Campaign description not available",
      status: campaignData.status,
      settings: {
        pitch: {
          painPoints: settings.pitch?.painPoints || [],
          proofPoints: settings.pitch?.proofPoints || [],
          coachingPoints: settings.pitch?.coachingPoints || [
            {
              id: "default_1",
              editable: false,
              instruction: "Use professional tone and personalize with company information"
            }
          ],
          emailCoachingPoints: settings.pitch?.emailCoachingPoints || [
            {
              id: "default_email_1",
              editable: true,
              instruction: "Keep subject lines under 50 characters for better open rates"
            },
            {
              id: "default_email_2",
              editable: true,
              instruction: "End with a single, clear call-to-action"
            }
          ],
          offeringDescription: settings.pitch?.offeringDescription || "Professional services offering",
          websiteUrl: settings.pitch?.websiteUrl,
          websiteAnalysis: websiteAnalysis ? {
            id: websiteAnalysis.id,
            status: websiteAnalysis.status,
            industry: websiteAnalysis.industry || "Technology",
            coreOffer: websiteAnalysis.core_offer || "Professional services",
            techStack: websiteAnalysis.tech_stack || [],
            icpSummary: websiteAnalysis.icp_summary || "Target market summary not available",
            businessModel: websiteAnalysis.business_model || "Service-based business model",
            competitiveAdvantages: websiteAnalysis.competitive_advantages || [],
            leadMagnets: websiteAnalysis.lead_magnets || [],
            socialProof: websiteAnalysis.social_proof || {
              metrics: [],
              clientLogos: [],
              testimonials: []
            },
            caseStudies: websiteAnalysis.case_studies || [],
            targetPersonas: websiteAnalysis.target_personas || [],
            analysisStatus: websiteAnalysis.analysis_status,
            confidenceScore: websiteAnalysis.confidence_score,
            pagesAnalyzed: websiteAnalysis.pages_analyzed,
            totalPagesFound: websiteAnalysis.total_pages_found,
            analysisDurationSeconds: websiteAnalysis.analysis_duration_seconds,
            completedAt: websiteAnalysis.completed_at,
            startedAt: websiteAnalysis.started_at
          } : null
        },
        outreach: {
          signOffs: settings.outreach?.signOffs || ["Best regards", "Thanks"],
          toneOfVoice: settings.outreach?.toneOfVoice || "Professional",
          callsToAction: settings.outreach?.callsToAction || [
            "Would you be interested in learning more?",
            "Are you available for a brief call to discuss this?"
          ],
          maxResourceAge: settings.outreach?.maxResourceAge || 30,
          campaignLanguage: settings.outreach?.campaignLanguage || "English",
          messagePersonalization: settings.outreach?.messagePersonalization ?? true,
          personalizationSources: settings.outreach?.personalizationSources || [
            "Website",
            "LinkedIn Profile"
          ]
        },
        workflow: settings.workflow || {},
        targeting: settings.targeting || {},
        autopilot: settings.autopilot || false,
        startDate: settings.startDate,
        startedAt: settings.startedAt,
        dailyLimit: settings.dailyLimit || 50,
        campaignType: settings.campaignType || "email",
        doNotContact: settings.doNotContact || [],
        reviewRequired: settings.reviewRequired || false,
        trackingEnabled: settings.trackingEnabled ?? true
      }
    };

    return NextResponse.json({ 
      success: true,
      campaignData: transformedCampaignData 
    });

  } catch (error) {
    console.error("Campaign fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign data" },
      { status: 500 }
    );
  }
}