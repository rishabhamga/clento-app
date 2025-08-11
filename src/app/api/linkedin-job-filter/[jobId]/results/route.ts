import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import Papa from "papaparse";
import type { 
  JobFilterResultsResponse, 
  CompanyJobResult 
} from "@/types/linkedin-job-filter";

/**
 * Get job filter results
 * 
 * GET /api/linkedin-job-filter/[jobId]/results
 * 
 * Returns the complete results of a job filtering request,
 * including job matches and downloadable CSV data.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format'); // 'csv' or 'json'
    
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

    // Check if job is completed
    if (jobRequest.processing_status !== 'completed') {
      return NextResponse.json(
        { error: "Job is not yet completed", status: jobRequest.processing_status },
        { status: 400 }
      );
    }

    // Get all company job results
    const { data: companyJobs, error: jobsError } = await supabaseAdmin
      .from('company_active_jobs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (jobsError) {
      return NextResponse.json(
        { error: "Failed to fetch job results" },
        { status: 500 }
      );
    }

    // Process results
    const results: CompanyJobResult[] = companyJobs.map(job => ({
      companyName: job.company_name,
      companyWebsite: job.company_website || undefined,
      linkedinUrl: job.linkedin_url,
      department: job.department,
      matchCount: job.match_count,
      jobData: job.job_data as any,
      processingStatus: job.processing_status as any,
      errorMessage: job.error_message || undefined
    }));

    // Calculate summary statistics
    const totalJobsFound = results.reduce((sum, result) => sum + result.matchCount, 0);
    const companiesWithJobs = results.filter(result => result.matchCount > 0).length;
    const averageMatchesPerCompany = totalJobsFound / Math.max(results.length, 1);
    
    // Calculate total processing time
    const processingTimes = companyJobs
      .map(job => job.job_data?.processing_time_ms || 0)
      .filter(time => time > 0);
    const totalProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0);

    // If CSV format is requested, return CSV file
    if (format === 'csv') {
      return generateCSVResponse(results, jobRequest.original_filename);
    }

    // Prepare JSON response
    const response: JobFilterResultsResponse = {
      jobId,
      status: jobRequest.processing_status as any,
      results,
      summary: {
        totalCompanies: results.length,
        companiesWithJobs,
        totalJobsFound,
        averageMatchesPerCompany: Math.round(averageMatchesPerCompany * 100) / 100,
        processingTime: totalProcessingTime
      },
      errorMessage: jobRequest.error_message || undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`/api/linkedin-job-filter/${(await params).jobId}/results error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV response for download
 */
function generateCSVResponse(results: CompanyJobResult[], originalFilename: string): Response {
  // Prepare CSV data
  const csvData = results.map(result => ({
    'Company Name': result.companyName,
    'Company Website': result.companyWebsite || '',
    'LinkedIn URL': result.linkedinUrl,
    'Department': result.department,
    'Job Matches Found': result.matchCount,
    'LinkedIn Jobs': result.jobData.linkedin_matches || 0,
    'Career Page Jobs': result.jobData.career_page_matches || 0,
    'Exact Matches': result.jobData.exact_matches || 0,
    'Fuzzy Matches': result.jobData.fuzzy_matches || 0,
    'Confidence Score': Math.round((result.jobData.confidence_score || 0) * 100) / 100,
    'Processing Status': result.processingStatus,
    'Error Message': result.errorMessage || '',
    'Processing Time (ms)': result.jobData.processing_time_ms || 0
  }));

  // Generate CSV content
  const csvContent = Papa.unparse(csvData);
  
  // Create filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = originalFilename.replace(/\.[^/.]+$/, ''); // Remove extension
  const filename = `${baseFilename}_job_results_${timestamp}.csv`;

  // Return CSV response
  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': csvContent.length.toString()
    }
  });
}

/**
 * Delete job results (cleanup)
 * 
 * DELETE /api/linkedin-job-filter/[jobId]/results
 */
export async function DELETE(
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

    // Delete company job results
    const { error: deleteJobsError } = await supabaseAdmin
      .from('company_active_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', userData.id);

    if (deleteJobsError) {
      return NextResponse.json(
        { error: "Failed to delete job results" },
        { status: 500 }
      );
    }

    // Delete job filter request
    const { error: deleteRequestError } = await supabaseAdmin
      .from('job_filter_requests')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', userData.id);

    if (deleteRequestError) {
      return NextResponse.json(
        { error: "Failed to delete job request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Job results deleted successfully" 
    });

  } catch (error) {
    console.error(`DELETE /api/linkedin-job-filter/${(await params).jobId}/results error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}