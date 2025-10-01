import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { HybridLinkedInScraper } from "@/lib/hybrid-linkedin-scraper";
import { HybridCareerPageScraper } from "@/lib/hybrid-career-page-scraper";
import { JobMatchingService } from "@/lib/job-matching-service";
import type {
  CSVJobFilterData,
  JobFilterAPIRequest,
  JobFilterAPIResponse,
  JobMatchingCriteria,
  CompanyActiveJob,
  JobFilterRequest,
  JobMatchingResult
} from "@/types/linkedin-job-filter";

/**
 * LinkedIn Job Filter API Endpoint
 * 
 * Accepts CSV file uploads with LinkedIn company URLs and job filtering criteria,
 * processes companies using scraping services, stores results in database,
 * and returns job match counts.
 * 
 * Expected multipart/form-data fields:
 *   - file: CSV file upload with LinkedIn URLs and Company Websites
 *   - departments: JSON array of departments to search for
 *   - jobTitles: Optional JSON array of specific job titles
 *   - includeCareerPages: Boolean to include career page scraping
 *   - fuzzyMatching: Boolean to enable fuzzy matching
 *   - confidenceThreshold: Number for minimum confidence score
 */

/**
 * GET - API endpoint information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "LinkedIn Job Filter API",
    description: "Upload CSV files with LinkedIn company URLs to filter and count job matches",
    method: "POST",
    contentType: "multipart/form-data",
    requiredFields: {
      file: "CSV file with 'LinkedIn URL' and 'Company Website' columns",
      departments: "JSON array of departments to search (e.g., ['Sales', 'Engineering'])"
    },
    optionalFields: {
      jobTitles: "JSON array of specific job titles to match",
      includeCareerPages: "Boolean to include career page scraping (default: false)",
      fuzzyMatching: "Boolean to enable fuzzy matching (default: true)",
      confidenceThreshold: "Number between 0-1 for minimum confidence (default: 0.7)"
    },
    statusEndpoint: "/api/linkedin-job-filter/[jobId]/status",
    resultsEndpoint: "/api/linkedin-job-filter/[jobId]/results",
    csvFormat: {
      requiredColumns: ["LinkedIn URL", "Company Website"],
      optionalColumns: ["Company Name"],
      example: "https://www.linkedin.com/company/example,https://example.com,Example Company"
    },
    supportedDepartments: [
      "Sales", "Engineering", "Product", "Marketing", "Operations", 
      "Customer Support", "Human Resources", "Finance", "Legal"
    ],
    limits: {
      maxRows: 1000,
      maxFileSize: "10MB",
      processing: "Background processing with status tracking"
    }
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function POST(request: Request) {
  console.log('🚀 LinkedIn Job Filter API - POST request started');
  console.log('📝 Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Get authenticated user
    console.log('🔐 Checking authentication...');
    const { userId, orgId } = await auth();
    console.log('✅ Auth result:', { 
      userId: userId ? `${userId.substring(0, 8)}...` : 'missing', 
      orgId: orgId ? `${orgId.substring(0, 8)}...` : 'missing' 
    });
    
    if (!userId) {
      console.log('❌ No userId found - returning 401');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's organization from database
    console.log('🏢 Fetching organization data...');
    const { data: orgData, error: orgError } = await (supabaseAdmin as any)
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', orgId!)
      .single();

    console.log('🏢 Organization query result:', { orgData, orgError });

    if (orgError || !orgData) {
      console.log('❌ Organization not found - returning 404');
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get user data
    console.log('👤 Fetching user data...');
    const { data: userData, error: userError } = await (supabaseAdmin as any)
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    console.log('👤 User query result:', { userData, userError });

    if (userError || !userData) {
      console.log('❌ User not found - returning 404');
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse the incoming multipart form
    console.log('📋 Parsing form data...');
    const formData = await request.formData();
    
    const file = formData.get("file");
    const departmentsRaw = formData.get("departments");
    const jobTitlesRaw = formData.get("jobTitles");
    const includeCareerPages = formData.get("includeCareerPages") === "true";
    const fuzzyMatching = formData.get("fuzzyMatching") === "true";
    const confidenceThreshold = parseFloat(formData.get("confidenceThreshold") as string) || 0.7;

    console.log('📋 Form data parsed:', {
      file: file ? `File: ${(file as File).name} (${(file as File).size} bytes)` : 'missing',
      departmentsRaw: departmentsRaw ? 'present' : 'missing',
      jobTitlesRaw: jobTitlesRaw ? 'present' : 'missing',
      includeCareerPages,
      fuzzyMatching,
      confidenceThreshold
    });

    // Validate required fields
    console.log('✅ Validating required fields...');
    if (!file || !(file instanceof File)) {
      console.log('❌ File validation failed:', { file: file ? typeof file : 'null' });
      return NextResponse.json(
        { error: "CSV file is required under 'file' field" },
        { status: 400 }
      );
    }

    if (!departmentsRaw) {
      console.log('❌ Departments validation failed - missing departmentsRaw');
      return NextResponse.json(
        { error: "Departments are required" },
        { status: 400 }
      );
    }

    // Parse departments and job titles
    console.log('🔄 Parsing JSON data...');
    let departments: string[];
    let jobTitles: string[] | undefined;

    try {
      console.log('🔄 Parsing departments:', departmentsRaw);
      departments = JSON.parse(departmentsRaw as string);
      if (jobTitlesRaw) {
        console.log('🔄 Parsing job titles:', jobTitlesRaw);
        jobTitles = JSON.parse(jobTitlesRaw as string);
      }
      console.log('✅ JSON parsing successful:', { departments, jobTitles });
    } catch (error) {
      console.log('❌ JSON parsing failed:', error);
      return NextResponse.json(
        { error: "Invalid JSON format for departments or jobTitles" },
        { status: 400 }
      );
    }

    if (!Array.isArray(departments) || departments.length === 0) {
      console.log('❌ Departments validation failed - not array or empty:', { departments });
      return NextResponse.json(
        { error: "At least one department must be specified" },
        { status: 400 }
      );
    }

    // Read and parse CSV file
    console.log('📄 Reading CSV file...');
    const csvText = await file.text();
    console.log('📄 CSV file read successfully, length:', csvText.length, 'characters');
    console.log('📄 First 500 characters:', csvText.substring(0, 500));
    
    let records: Record<string, string>[];

    try {
      console.log('📄 Parsing CSV with csv-parse...');
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        trim: true,
        quote: '"',
        escape: '"',
        relax_quotes: true,
        relax_column_count: true,
        skip_records_with_error: true
      });
      console.log('✅ CSV parsed successfully, found', records.length, 'records');
      console.log('📄 First record sample:', records[0]);
      console.log('📄 Available columns:', Object.keys(records[0] || {}));
    } catch (error) {
      console.log('❌ CSV parsing failed:', error);
      return NextResponse.json(
        { error: "Invalid CSV format" },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      console.log('❌ CSV file is empty');
      return NextResponse.json(
        { error: "CSV file appears to be empty" },
        { status: 400 }
      );
    }

    if (records.length > 1000) {
      console.log('❌ CSV exceeds maximum rows:', records.length);
      return NextResponse.json(
        { error: "CSV exceeds maximum 1,000 rows" },
        { status: 400 }
      );
    }

    // Validate CSV format and required columns
    console.log('✅ Validating CSV format...');
    const validationResult = validateCSVFormat(records);
    console.log('📊 Validation result:', {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      validRowsCount: validationResult.validRows.length
    });
    
    if (!validationResult.isValid) {
      console.log('❌ CSV validation failed:', validationResult.errors);
      return NextResponse.json(
        { 
          error: "CSV validation failed", 
          details: validationResult.errors 
        },
        { status: 400 }
      );
    }

    // Generate unique job ID
    const jobId = uuidv4();
    console.log('🆔 Generated job ID:', jobId);

    // Create job matching criteria
    const criteria: JobMatchingCriteria = {
      departments,
      jobTitles,
      exactMatch: true,
      fuzzyMatch: fuzzyMatching,
      confidenceThreshold,
      includeCareerPages
    };
    console.log('🎯 Job matching criteria:', criteria);

    // Validate criteria (temporarily skip for debugging)
    console.log('✅ Validating job matching criteria...');
    try {
      const criteriaErrors = JobMatchingService.validateCriteria(criteria);
      console.log('📋 Criteria validation result:', { errors: criteriaErrors });
      
      if (criteriaErrors.length > 0) {
        console.log('❌ Criteria validation failed:', criteriaErrors);
        return NextResponse.json(
          { error: "Invalid job matching criteria", details: criteriaErrors },
          { status: 400 }
        );
      }
    } catch (validationError) {
      console.log('⚠️ Criteria validation error (skipping):', validationError);
      // Continue anyway for debugging
    }

    // Create job filter request record
    console.log('💾 Creating job filter request in database...');
    const insertData = {
      user_id: (userData as any).id,
      organization_id: (orgData as any).id,
      job_id: jobId,
      original_filename: file.name,
      total_companies: validationResult.validRows.length,
      departments,
      job_titles: jobTitles || null,
      processing_status: 'pending',
      started_at: new Date().toISOString()
    };
    console.log('💾 Insert data:', insertData);

    const { data: insertResult, error: requestError } = await (supabaseAdmin as any)
      .from('job_filter_requests')
      .insert(insertData as any);

    console.log('💾 Database insert result:', { insertResult, requestError });

    if (requestError) {
      console.error('❌ Failed to create job filter request:', requestError);
      return NextResponse.json(
        { error: "Failed to create job processing request", details: requestError },
        { status: 500 }
      );
    }

    // Start background processing
    processJobFilterRequest(
      jobId,
      (userData as any).id,
      (orgData as any).id,
      validationResult.validRows,
      criteria
    );

    // Return immediate response
    const response: JobFilterAPIResponse = {
      jobId,
      totalCompanies: validationResult.validRows.length,
      estimatedCompletionTime: estimateCompletionTime(validationResult.validRows.length),
      message: "Job filtering request submitted successfully. Processing has started."
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("💥 /api/linkedin-job-filter MAIN ERROR:", error);
    console.error("💥 Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Validate CSV format and extract valid rows
 */
function validateCSVFormat(records: Record<string, string>[]): {
  isValid: boolean;
  errors: string[];
  validRows: CSVJobFilterData[];
} {
  const errors: string[] = [];
  const validRows: CSVJobFilterData[] = [];

  // Check for required columns (case-insensitive)
  const firstRecord = records[0];
  const headers = Object.keys(firstRecord).map(h => h.toLowerCase());
  
  const hasLinkedInUrl = headers.some(h => 
    h.includes('linkedin') && h.includes('url') ||
    h === 'linkedin url' ||
    h === 'linkedin_url'
  );
  
  const hasCompanyWebsite = headers.some(h => 
    h.includes('company') && h.includes('website') ||
    h === 'company website' ||
    h === 'company_website' ||
    h === 'website' ||
    h === 'domain' ||
    h.includes('domain')
  );

  if (!hasLinkedInUrl) {
    errors.push("Missing required column: 'LinkedIn URL' (or similar)");
  }

  if (!hasCompanyWebsite) {
    errors.push("Missing required column: 'Company Website' (or similar)");
  }

  if (errors.length > 0) {
    return { isValid: false, errors, validRows: [] };
  }

  // Find the actual column names
  let linkedinUrlColumn = '';
  let websiteColumn = '';
  let companyNameColumn = '';

  for (const header of Object.keys(firstRecord)) {
    const lowerHeader = header.toLowerCase();
    if (!linkedinUrlColumn && (
      lowerHeader.includes('linkedin') && lowerHeader.includes('url') ||
      lowerHeader === 'linkedin url' ||
      lowerHeader === 'linkedin_url'
    )) {
      linkedinUrlColumn = header;
    }
    if (!websiteColumn && (
      lowerHeader.includes('company') && lowerHeader.includes('website') ||
      lowerHeader === 'company website' ||
      lowerHeader === 'company_website' ||
      lowerHeader === 'website' ||
      lowerHeader === 'domain' ||
      lowerHeader.includes('domain')
    )) {
      websiteColumn = header;
    }
    if (!companyNameColumn && (
      lowerHeader === 'company name' ||
      lowerHeader === 'company' ||
      lowerHeader === 'company_name' ||
      lowerHeader === 'name'
    )) {
      companyNameColumn = header;
    }
  }

  // Validate each row
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const linkedinUrl = record[linkedinUrlColumn]?.trim();
    const website = record[websiteColumn]?.trim();
    const companyName = companyNameColumn ? record[companyNameColumn]?.trim() : '';

    if (!linkedinUrl || !website) {
      errors.push(`Row ${i + 1}: Missing required LinkedIn URL or Company Website`);
      continue;
    }

    if (!isValidLinkedInUrl(linkedinUrl)) {
      errors.push(`Row ${i + 1}: Invalid LinkedIn URL format`);
      continue;
    }

    if (!isValidWebsiteUrl(website)) {
      errors.push(`Row ${i + 1}: Invalid website URL format`);
      continue;
    }

    validRows.push({
      'LinkedIn URL': linkedinUrl,
      'Company Website': website,
      'Company Name': companyName,
      source: 'csv_upload',
      upload_date: new Date().toISOString(),
      validation_status: 'valid'
    });
  }

  return {
    isValid: errors.length === 0 || validRows.length > 0,
    errors,
    validRows
  };
}

/**
 * Validate LinkedIn URL format
 */
function isValidLinkedInUrl(url: string): boolean {
  const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9\-_]+\/?$/;
  return linkedinPattern.test(url);
}

/**
 * Validate website URL format
 */
function isValidWebsiteUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Estimate completion time based on number of companies
 */
function estimateCompletionTime(companyCount: number): number {
  // Estimate ~30 seconds per company (including rate limiting)
  return Math.ceil(companyCount * 30);
}

/**
 * Background processing function for job filtering
 */
async function processJobFilterRequest(
  jobId: string,
  userId: string,
  organizationId: string,
  companies: CSVJobFilterData[],
  criteria: JobMatchingCriteria
): Promise<void> {
  try {
    // Update status to processing
    await ((supabaseAdmin as any) as any)
      .from('job_filter_requests')
      .update({ 
        processing_status: 'processing',
        started_at: new Date().toISOString()
      } as any)
      .eq('job_id', jobId);

    let processedCount = 0;
    let successfulCount = 0;
    let failedCount = 0;

    // Initialize scrapers
    const linkedinScraper = new HybridLinkedInScraper(criteria);
    const careerPageScraper = criteria.includeCareerPages 
      ? new HybridCareerPageScraper(criteria) 
      : null;

    console.log(`🚀 Starting to process ${companies.length} companies for job ${jobId}`);
    console.log(`📋 Companies to process:`, companies.map(c => ({
      name: c['Company Name'] || c['Name'] || 'Unknown',
      linkedin: c['LinkedIn URL'],
      website: c['Company Website'] || c['Domain']
    })));

    // Process each company
    for (const company of companies) {
      const companyName = company['Company Name'] || company['Name'] || 'Unknown';
      
      console.log(`\n🏢 Processing company ${processedCount + 1}/${companies.length}: ${companyName}`);
      console.log(`🔗 LinkedIn URL: ${company['LinkedIn URL']}`);
      console.log(`🌐 Website: ${company['Company Website'] || company['Domain']}`);
      
      try {
        const result = await processCompanyJobs(
          company,
          linkedinScraper,
          careerPageScraper,
          jobId,
          userId,
          organizationId,
          criteria
        );

        if (result.success) {
          successfulCount++;
          console.log(`✅ Company ${companyName} processed successfully`);
        } else {
          failedCount++;
          console.log(`❌ Company ${companyName} failed: ${result.error}`);
        }

      } catch (error) {
        console.error(`💥 Failed to process company ${companyName}:`, error);
        failedCount++;
      }

      processedCount++;

      console.log(`📊 Progress: ${successfulCount} successful, ${failedCount} failed, ${processedCount}/${companies.length} processed`);

      // Update progress
      console.log(`💾 Updating progress in database...`);
      const { error: updateError } = await (supabaseAdmin as any)
        .from('job_filter_requests')
        .update({
          processed_companies: processedCount,
          successful_companies: successfulCount,
          failed_companies: failedCount
        })
        .eq('job_id', jobId);
      
      if (updateError) {
        console.error(`❌ Failed to update progress:`, updateError);
      } else {
        console.log(`✅ Progress updated successfully`);
      }

      // Add delay to prevent rate limiting
      console.log(`⏱️ Waiting 2 seconds before next company...`);
      await sleep(2000);
    }

    // Mark as completed
    await ((supabaseAdmin as any) as any)
      .from('job_filter_requests')
      .update({
        processing_status: 'completed',
        processed_companies: companies.length,
        successful_companies: successfulCount,
        failed_companies: failedCount,
        completed_at: new Date().toISOString()
      })
      .eq('job_id', jobId);

    console.log(`Job ${jobId} completed: ${successfulCount} successful, ${failedCount} failed`);

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    
    // Mark as failed
    await ((supabaseAdmin as any) as any)
      .from('job_filter_requests')
      .update({
        processing_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('job_id', jobId);
  }
}

/**
 * Process jobs for a single company
 */
async function processCompanyJobs(
  company: CSVJobFilterData,
  linkedinScraper: HybridLinkedInScraper,
  careerPageScraper: HybridCareerPageScraper | null,
  jobId: string,
  userId: string,
  organizationId: string,
  criteria: JobMatchingCriteria
): Promise<{ success: boolean; error?: string }> {
  try {
    const startTime = Date.now();
    let totalMatches = 0;
    let linkedinJobs: any[] = [];
    let careerPageJobs: any[] = [];
    let errorMessage: string | null = null;

    const companyName = company['Company Name'] || company['Name'] || 'Unknown';
    
    // Scrape LinkedIn jobs
    console.log(`🔍 Starting LinkedIn job scraping for ${companyName}...`);
    try {
      const linkedinResult = await linkedinScraper.scrapeCompanyJobs(company['LinkedIn URL']);
      if (linkedinResult.success) {
        linkedinJobs = linkedinResult.jobsFound;
        totalMatches += linkedinJobs.length;
        console.log(`✅ LinkedIn scraping successful for ${companyName}: found ${linkedinJobs.length} jobs`);
      } else {
        console.warn(`⚠️ LinkedIn scraping failed for ${companyName}: ${linkedinResult.errorMessage}`);
      }
    } catch (error) {
      console.error(`💥 LinkedIn scraping error for ${companyName}:`, error);
    }

    // Scrape career page jobs if enabled and circuit breaker allows
    if (careerPageScraper && company['Company Website']) {
      const website = company['Company Website'] || company['Domain'];
      
      // Check if career page scraper circuit breaker has reached its limit
      const isCircuitBreakerExhausted = careerPageScraper.isCircuitBreakerExhausted();
      
      if (isCircuitBreakerExhausted) {
        console.log(`⚠️ Career page scraping circuit breaker exhausted for ${companyName}, skipping to avoid delays`);
      } else {
        console.log(`🌐 Starting career page scraping for ${companyName} at ${website}...`);
        try {
          const careerResult = await careerPageScraper.scrapeCareerPage(website);
          if (careerResult.success) {
            careerPageJobs = careerResult.jobsFound;
            totalMatches += careerPageJobs.length;
            console.log(`✅ Career page scraping successful for ${companyName}: found ${careerPageJobs.length} jobs`);
          } else {
            console.warn(`⚠️ Career page scraping failed for ${companyName}: ${careerResult.errorMessage}`);
          }
        } catch (error) {
          console.error(`💥 Career page scraping error for ${companyName}:`, error);
        }
      }
    } else if (careerPageScraper) {
      console.log(`⏭️ Skipping career page scraping for ${companyName}: no website provided`);
    } else {
      console.log(`⏭️ Career page scraping disabled for ${companyName}`);
    }

    // Prepare job data
    const jobData: JobMatchingResult = {
      total_matches: totalMatches,
      linkedin_matches: linkedinJobs.length,
      career_page_matches: careerPageJobs.length,
      exact_matches: linkedinJobs.filter(j => j.match_type === 'exact').length + 
                    careerPageJobs.filter(j => j.match_type === 'exact').length,
      fuzzy_matches: linkedinJobs.filter(j => j.match_type === 'fuzzy').length + 
                    careerPageJobs.filter(j => j.match_type === 'fuzzy').length,
      department_matches: criteria.departments.reduce((acc, dept) => {
        acc[dept] = linkedinJobs.filter(j => j.department === dept).length + 
                   careerPageJobs.filter(j => j.department === dept).length;
        return acc;
      }, {} as {[department: string]: number}),
      confidence_score: totalMatches > 0 
        ? [...linkedinJobs, ...careerPageJobs].reduce((sum, job) => sum + job.confidence_score, 0) / totalMatches
        : 0,
      processing_time_ms: Date.now() - startTime,
      scraped_urls: [
        company['LinkedIn URL'],
        ...(company['Company Website'] ? [company['Company Website']] : [])
      ],
      error_urls: []
    };

    // Store in database with duplicate check
    const { data: existingData, error: checkError } = await (supabaseAdmin as any)
      .from('company_active_jobs')
      .select('id')
      .eq('job_id', jobId)
      .eq('linkedin_url', company['LinkedIn URL'])
      .single();

    let insertError: any = null;
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking for existing record:', checkError);
      insertError = checkError;
    } else if (!existingData) {
      // Record doesn't exist, insert new one
      const { error } = await (supabaseAdmin as any)
        .from('company_active_jobs')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          job_id: jobId,
          company_name: company['Company Name'] || 'Unknown Company',
          company_website: company['Company Website'],
          linkedin_url: company['LinkedIn URL'],
          department: criteria.departments[0], // Primary department
          job_titles: criteria.jobTitles || null,
          match_count: totalMatches,
          job_data: jobData,
          linkedin_jobs: linkedinJobs,
          career_page_jobs: careerPageJobs,
          processing_status: 'completed',
          scraped_at: new Date().toISOString()
        });
      insertError = error;
    } else {
      // Record exists, update it
      const { error } = await (supabaseAdmin as any)
        .from('company_active_jobs')
        .update({
          match_count: totalMatches,
          job_data: jobData,
          linkedin_jobs: linkedinJobs,
          career_page_jobs: careerPageJobs,
          processing_status: 'completed',
          scraped_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
      insertError = error;
    }

    if (insertError) {
      console.error('Failed to insert company job data:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    // Store failed result with duplicate check
    const { data: existingData, error: checkError } = await (supabaseAdmin as any)
      .from('company_active_jobs')
      .select('id')
      .eq('job_id', jobId)
      .eq('linkedin_url', company['LinkedIn URL'])
      .single();

    if (!checkError || checkError.code === 'PGRST116') { // PGRST116 = no rows found
      if (!existingData) {
        // Record doesn't exist, insert new one
        await ((supabaseAdmin as any) as any)
          .from('company_active_jobs')
          .insert({
            user_id: userId,
            organization_id: organizationId,
            job_id: jobId,
            company_name: company['Company Name'] || 'Unknown Company',
            company_website: company['Company Website'],
            linkedin_url: company['LinkedIn URL'],
            department: criteria.departments[0],
            job_titles: criteria.jobTitles || null,
            match_count: 0,
            job_data: {
              total_matches: 0,
              linkedin_matches: 0,
              career_page_matches: 0,
              exact_matches: 0,
              fuzzy_matches: 0,
              department_matches: {},
              confidence_score: 0,
              processing_time_ms: 0,
              scraped_urls: [],
              error_urls: [company['LinkedIn URL']]
            },
            linkedin_jobs: [],
            career_page_jobs: [],
            processing_status: 'failed',
            error_message: errorMsg
          });
      } else {
        // Record exists, update it
        await ((supabaseAdmin as any) as any)
          .from('company_active_jobs')
          .update({
            match_count: 0,
            job_data: {
              total_matches: 0,
              linkedin_matches: 0,
              career_page_matches: 0,
              exact_matches: 0,
              fuzzy_matches: 0,
              department_matches: {},
              confidence_score: 0,
              processing_time_ms: 0,
              scraped_urls: [],
              error_urls: [company['LinkedIn URL']]
            },
            linkedin_jobs: [],
            career_page_jobs: [],
            processing_status: 'failed',
            error_message: errorMsg
          })
          .eq('id', existingData.id);
      }
    }

    return { success: false, error: errorMsg };
  }
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}