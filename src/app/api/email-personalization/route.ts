import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
import { currentUser } from "@clerk/nextjs/server";
import type {
  EmailLeadRow,
  EmailPersonalizationJob,
  CampaignContext
} from "@/types/email-personalization";
import { enhancedScrapingService } from "@/lib/enhanced-scraping-service";
import { emailGenerationService } from "@/lib/email-generation-service";
import pLimit from "p-limit";
import { Blob } from 'buffer';

// Global store for jobs (in production, use Redis or database)
declare global {
  var __EMAIL_PERSONALIZATION_JOBS__: Record<string, EmailPersonalizationJob> | undefined;
}

/**
 * POST /api/email-personalization
 *
 * Expected multipart/form-data fields:
 *   - file: CSV file upload
 *   - campaignId: Campaign ID for context loading
 *   - customContext: Optional JSON string for additional context
 *
 * Response: { jobId: string, rowCount: number, estimatedCompletionTime: number }
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the incoming multipart form
    const formData = await request.formData();
    const file = formData.get("file");
    const campaignId = formData.get("campaignId");
    const customContextRaw = formData.get("customContext");

    // Validate required fields
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "CSV file is required under 'file' field" },
        { status: 400 }
      );
    }

    if (!campaignId || typeof campaignId !== "string") {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Read and parse CSV file
    const csvText = await file.text();
    const records: Record<string, string>[] = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    });

    if (records.length === 0) {
      return NextResponse.json(
        { error: "Uploaded CSV appears to be empty" },
        { status: 400 }
      );
    }

    if (records.length > 5000) {
      return NextResponse.json(
        { error: "CSV exceeds maximum 5,000 rows" },
        { status: 400 }
      );
    }

    // Validate CSV headers
    const REQUIRED_HEADERS = [
      "First name",
      "Last name",
      "Title",
      "Company",
      "Location",
      "Linkedin url",
      "Company website",
    ];

    const headerCheck = REQUIRED_HEADERS.every((h) =>
      Object.keys(records[0]).some((k) => k.toLowerCase() === h.toLowerCase())
    );

    if (!headerCheck) {
      return NextResponse.json(
        { error: `CSV missing required columns. Required: ${REQUIRED_HEADERS.join(", ")}` },
        { status: 400 }
      );
    }

    // Load campaign context
    const campaignContext = await loadCampaignContext(campaignId, user.id);
    if (!campaignContext) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    // Parse custom context if provided
    const customContext = customContextRaw ? JSON.parse(String(customContextRaw)) : {};

    // Create job
    const jobId = uuidv4();
    const leads = records as EmailLeadRow[];
    const estimatedCompletionTime = Math.ceil(leads.length * 8); // ~8 seconds per lead

    // Initialize job in global store
    globalThis.__EMAIL_PERSONALIZATION_JOBS__ = globalThis.__EMAIL_PERSONALIZATION_JOBS__ || {};
    globalThis.__EMAIL_PERSONALIZATION_JOBS__[jobId] = {
      jobId,
      campaignId,
      rowCount: leads.length,
      processed: 0,
      status: "processing",
      startedAt: new Date(),
      errors: []
    };

    // Process leads asynchronously
    processEmailPersonalizationJob(jobId, leads, campaignContext, customContext)
      .catch(error => {
        console.error(`Job ${jobId} failed:`, error);
        if (globalThis.__EMAIL_PERSONALIZATION_JOBS__) {
          globalThis.__EMAIL_PERSONALIZATION_JOBS__[jobId].status = "failed";
        }
      });

    return NextResponse.json({
      jobId,
      rowCount: leads.length,
      estimatedCompletionTime
    });

  } catch (error: any) {
    console.error("/api/email-personalization error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email-personalization/sample-csv
 * Download sample CSV format
 */
export async function GET() {
  try {
    const sampleCSV = emailGenerationService.generateSampleCSV();

    return new Response(sampleCSV, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": "attachment; filename=email-personalization-sample.csv",
      },
    });
  } catch (error) {
    console.error("Sample CSV generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate sample CSV" },
      { status: 500 }
    );
  }
}

/**
 * Load campaign context from database
 */
async function loadCampaignContext(
  campaignId: string,
  userId: string
): Promise<CampaignContext | null> {
  try {
    // Import supabase here to avoid circular dependencies
    const { supabase } = await import("@/lib/supabase");

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
        console.error(`Campaign not found: ${campaignId}`, { campaignError, draftError });
        return null;
      }

      // Transform draft data to campaign format
      campaignData = {
        id: draftData.id,
        user_id: draftData.user_id,
        name: draftData.campaign_name,
        description: draftData.offering_description,
        status: 'draft',
        settings: {
          pitch: {
            websiteUrl: draftData.website_url,
            websiteAnalysis: draftData.website_analysis,
            offeringDescription: draftData.offering_description,
            painPoints: draftData.pain_points || [],
            proofPoints: draftData.proof_points || [],
            coachingPoints: draftData.coaching_points || [],
            emailCoachingPoints: draftData.email_body_coaching || []
          }
        }
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

    // Transform campaign data to CampaignContext format
    const settings = campaignData.settings || {};
    const context: CampaignContext = {
      campaignId: campaignData.id,
      campaignName: campaignData.name,
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
      websiteAnalysis: websiteAnalysis ? {
        coreOffer: websiteAnalysis.core_offer || "Professional services",
        industry: websiteAnalysis.industry || "Technology",
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
        targetPersonas: websiteAnalysis.target_personas || []
      } : undefined
    };

    return context;

  } catch (error) {
    console.error(`Error loading campaign context for ${campaignId}:`, error);
    return null;
  }
}

/**
 * Process email personalization job asynchronously
 */
async function processEmailPersonalizationJob(
  jobId: string,
  leads: EmailLeadRow[],
  campaignContext: CampaignContext,
  customContext: any
) {
  const job = globalThis.__EMAIL_PERSONALIZATION_JOBS__?.[jobId];
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const limit = pLimit(3); // Process 3 leads concurrently
  const processedRows: any[] = [];
  const scrapingStats = {
    companyWebsiteSuccess: 0,
    companyWebsiteFailures: 0,
    linkedInCompanySuccess: 0,
    linkedInCompanyFailures: 0,
    linkedInProfileSuccess: 0,
    linkedInProfileFailures: 0
  };

  console.log(`🚀 Starting email personalization job ${jobId} with ${leads.length} leads`);

  // Process leads with enhanced scraping and email generation
  await Promise.all(
    leads.map((lead, index) =>
      limit(async () => {
        try {
          console.log(`📧 Processing lead ${index + 1}/${leads.length}: ${lead["First name"]} ${lead["Last name"]} at ${lead.Company}`);

          // Enhanced company and profile scraping
          const enrichment = await enhancedScrapingService.enrichCompanyData(
            lead["Company website"],
            undefined, // LinkedIn company URL not provided in CSV
            { refresh: false }
          );

          // LinkedIn profile scraping
          try {
            const linkedInProfileData = await enhancedScrapingService.scrapeLinkedInProfile(
              lead["Linkedin url"],
              `${lead["First name"]} ${lead["Last name"]}`
            );
            enrichment.leadLinkedInData = linkedInProfileData;
            scrapingStats.linkedInProfileSuccess++;
          } catch (profileError) {
            scrapingStats.linkedInProfileFailures++;
            console.warn(`LinkedIn profile scraping failed for ${lead["First name"]} ${lead["Last name"]}: ${profileError}`);
          }

          // Update scraping stats
          if (!enrichment.scrapingErrors?.companyWebsite) {
            scrapingStats.companyWebsiteSuccess++;
          } else {
            scrapingStats.companyWebsiteFailures++;
          }

          // Generate email sequence
          const emailSequence = await emailGenerationService.generateEmailSequence(
            lead,
            campaignContext,
            enrichment
          );

          // Combine lead data with generated emails
          processedRows.push({
            ...lead,
            // Email sequence
            initial_email: emailSequence.initial_email,
            initial_email_subject: emailSequence.subject_lines.initial,
            follow_up_email_1: emailSequence.follow_up_email_1,
            follow_up_email_1_subject: emailSequence.subject_lines.followUp1,
            follow_up_email_2: emailSequence.follow_up_email_2,
            follow_up_email_2_subject: emailSequence.subject_lines.followUp2,
            follow_up_email_3: emailSequence.follow_up_email_3,
            follow_up_email_3_subject: emailSequence.subject_lines.followUp3,
            follow_up_email_4: emailSequence.follow_up_email_4,
            follow_up_email_4_subject: emailSequence.subject_lines.followUp4,
            // Metadata
            personalization_score: emailSequence.personalization_score,
            campaign_id: campaignContext.campaignId,
            campaign_name: campaignContext.campaignName,
            processed_at: new Date().toISOString(),
            // Scraping status
            company_scraping_status: enrichment.scrapingErrors?.companyWebsite ? 'failed' : 'success',
            linkedin_profile_status: enrichment.scrapingErrors?.linkedInProfile ? 'failed' : 'success',
            scraping_errors: Object.values(enrichment.scrapingErrors || {}).filter(Boolean).join('; ') || 'none'
          });

          console.log(`✅ Successfully processed ${lead["First name"]} ${lead["Last name"]}`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Failed to process lead ${lead["First name"]} ${lead["Last name"]}:`, errorMessage);

          // Add error to job
          job.errors?.push({
            row: index + 1,
            leadName: `${lead["First name"]} ${lead["Last name"]}`,
            error: errorMessage,
            timestamp: new Date()
          });

          scrapingStats.companyWebsiteFailures++;
          scrapingStats.linkedInProfileFailures++;
        } finally {
          // Update progress
          job.processed += 1;
          console.log(`📊 Progress: ${job.processed}/${job.rowCount} (${Math.round((job.processed / job.rowCount) * 100)}%)`);
        }
      })
    )
  );

  // Generate final CSV
  const csvOutput = Papa.unparse(processedRows);

  // Update job status
  job.status = "completed";
  job.completedAt = new Date();
  job.results = {
    csv: csvOutput,
    successCount: processedRows.length,
    errorCount: job.errors?.length || 0,
    scrapingStats
  };

  console.log(`🎉 Job ${jobId} completed successfully:`, {
    processed: processedRows.length,
    errors: job.errors?.length || 0,
    scrapingStats
  });
}