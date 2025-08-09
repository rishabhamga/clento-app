import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { JobFilterStatusResponse } from "@/types/linkedin-job-filter";

/**
 * Get job filter processing status
 * 
 * GET /api/linkedin-job-filter/[jobId]/status
 * 
 * Returns the current processing status of a job filtering request,
 * including progress information and completion details.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    // Get authenticated user
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's organization from database
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', orgId)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get job filter request
    const { data: jobRequest, error: requestError } = await supabaseAdmin
      .from('job_filter_requests')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', userData.id)
      .eq('organization_id', orgData.id)
      .single();

    if (requestError || !jobRequest) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Calculate progress percentage
    const percentageComplete = jobRequest.total_companies > 0 
      ? Math.round((jobRequest.processed_companies / jobRequest.total_companies) * 100)
      : 0;

    // Estimate remaining time
    let estimatedTimeRemaining: number | undefined;
    if (jobRequest.processing_status === 'processing' && jobRequest.started_at) {
      const startTime = new Date(jobRequest.started_at).getTime();
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const avgTimePerCompany = elapsedTime / Math.max(jobRequest.processed_companies, 1);
      const remainingCompanies = jobRequest.total_companies - jobRequest.processed_companies;
      estimatedTimeRemaining = Math.ceil(remainingCompanies * avgTimePerCompany / 1000); // in seconds
    }

    // Get current company being processed (if available)
    let currentCompany: string | undefined;
    if (jobRequest.processing_status === 'processing') {
      const { data: currentCompanyData } = await supabaseAdmin
        .from('company_active_jobs')
        .select('company_name')
        .eq('job_id', jobId)
        .eq('processing_status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      currentCompany = currentCompanyData?.company_name;
    }

    // Prepare response
    const response: JobFilterStatusResponse = {
      jobId,
      status: jobRequest.processing_status as any,
      progress: {
        totalCompanies: jobRequest.total_companies,
        processedCompanies: jobRequest.processed_companies,
        successfulCompanies: jobRequest.successful_companies,
        failedCompanies: jobRequest.failed_companies,
        percentageComplete
      },
      currentCompany,
      estimatedTimeRemaining,
      errorMessage: jobRequest.error_message || undefined,
      completedAt: jobRequest.completed_at || undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`/api/linkedin-job-filter/${(await params).jobId}/status error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}