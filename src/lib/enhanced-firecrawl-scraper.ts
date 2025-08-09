/**
 * Enhanced Firecrawl LinkedIn Job Scraper
 * 
 * Optimized implementation based on Firecrawl best practices:
 * - Single API call with structured extraction
 * - Advanced actions for LinkedIn's dynamic content
 * - Stealth mode for anti-bot protection
 * - Proper JSON schema for consistent extraction
 * 
 * Based on: https://docs.firecrawl.dev/
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
import {
  type LinkedInJobResult,
  type ScrapingResult,
  type JobMatchingCriteria,
} from '@/types/linkedin-job-filter';
import { JobMatchingService } from './job-matching-service';
import { validateFirecrawlConfig, logFirecrawlStatus } from './firecrawl-config-validator';

// Enhanced Firecrawl configuration with stealth mode
const ENHANCED_FIRECRAWL_CONFIG = {
  apiKey: process.env.FIRECRAWL_API_KEY || '',
  maxRetries: 3,
  timeout: 60000, // 60 seconds for complex pages
  rateLimitDelay: 1000, // 1 second between requests
};

// Structured schema for job extraction using Zod
const JobSchema = z.object({
  title: z.string().describe('Exact job title as displayed'),
  department: z.string().describe('Department/team (Engineering, Sales, Marketing, Product, Operations, Customer Support, etc.)'),
  location: z.string().describe('Job location - city, state/country, or "Remote"'),
  jobUrl: z.string().optional().describe('Direct URL to the job posting'),
  company: z.string().describe('Company name'),
  employmentType: z.string().optional().describe('Full-time, Part-time, Contract, Internship'),
  experience: z.string().optional().describe('Experience level required'),
  postedDate: z.string().optional().describe('When the job was posted'),
  description: z.string().optional().describe('Brief job description or requirements')
});

const JobsExtractionSchema = z.object({
  jobs: z.array(JobSchema).describe('Array of all job listings found on the page'),
  totalJobsFound: z.number().describe('Total number of job postings found'),
  companyName: z.string().describe('Name of the company'),
  pageType: z.string().describe('Type of page scraped (company_jobs_page, career_page, etc.)'),
  lastUpdated: z.string().optional().describe('When the jobs page was last updated')
});

export class EnhancedFirecrawlScraper {
  private firecrawl: FirecrawlApp;
  private matchingService: JobMatchingService;
  private config: typeof ENHANCED_FIRECRAWL_CONFIG;

  constructor(criteria: JobMatchingCriteria, config?: Partial<typeof ENHANCED_FIRECRAWL_CONFIG>) {
    this.config = { ...ENHANCED_FIRECRAWL_CONFIG, ...config };
    
    // Validate Firecrawl API key configuration
    const validation = validateFirecrawlConfig(this.config.apiKey);
    
    if (!validation.isValid) {
      logFirecrawlStatus(this.config.apiKey);
      throw new Error(`Firecrawl configuration error: ${validation.errorMessage}`);
    }
    
    logFirecrawlStatus(this.config.apiKey);
    
    this.firecrawl = new FirecrawlApp({ 
      apiKey: this.config.apiKey,
      // The SDK automatically formats the Authorization header as:
      // Authorization: Bearer fc-YOUR_API_KEY
    });
    this.matchingService = new JobMatchingService(criteria);
  }

  /**
   * Enhanced LinkedIn company jobs scraping with single API call
   */
  public async scrapeLinkedInJobs(linkedinUrl: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔥 Enhanced Firecrawl scraping LinkedIn jobs: ${linkedinUrl}`);
      
      const jobsUrl = this.normalizeToJobsUrl(linkedinUrl);
      console.log(`📍 Targeting jobs URL: ${jobsUrl}`);

      // Single comprehensive scrape with structured extraction
      const result = await this.firecrawl.scrapeUrl(jobsUrl, {
        formats: ['json'], // Only need JSON with structured extraction
        jsonOptions: {
          schema: JobsExtractionSchema,
          prompt: `
            You are analyzing a LinkedIn company jobs page. Extract ALL job listings with complete information.
            
            CRITICAL INSTRUCTIONS:
            1. Look for job cards, job titles, and employment opportunities
            2. For each job, extract the exact title as displayed
            3. Infer the department from job titles and context:
               - Engineering/Tech: Software Engineer, Developer, DevOps, Data Scientist, etc.
               - Sales: Account Executive, Sales Rep, Business Development, etc.
               - Marketing: Marketing Manager, Digital Marketing, Content Creator, etc.
               - Product: Product Manager, UX Designer, Product Designer, etc.
               - Operations: Operations Manager, Program Manager, Project Manager, etc.
               - Customer Support: Customer Success, Support Engineer, etc.
               - Finance: Financial Analyst, Accountant, Controller, etc.
               - HR: HR Manager, Recruiter, People Operations, etc.
            4. Extract location information (Remote, city/state, etc.)
            5. Find direct job posting URLs if available
            6. Note employment type (Full-time, Part-time, Contract, Internship)
            7. Extract experience level if mentioned (Entry, Mid, Senior, etc.)
            
            Return comprehensive data for ALL jobs found, even if some fields are missing.
          `
        },
        actions: [
          // Initial page load and LinkedIn-specific interactions
          { type: 'wait', milliseconds: 3000 },
          { type: 'screenshot', fullPage: false }, // Take initial screenshot
          
          // Handle potential LinkedIn login prompts or overlays
          { type: 'scroll', direction: 'down', amount: 2 },
          { type: 'wait', milliseconds: 2000 },
          
          // Load more jobs by scrolling (LinkedIn loads jobs dynamically)
          { type: 'scroll', direction: 'down', amount: 3 },
          { type: 'wait', milliseconds: 3000 },
          { type: 'scroll', direction: 'down', amount: 3 },
          { type: 'wait', milliseconds: 2000 },
          
          // Try to click "Show more jobs" button if it exists
          { type: 'scroll', direction: 'down', amount: 2 },
          { type: 'wait', milliseconds: 2000 },
          
          // Final screenshot to see what was loaded
          { type: 'screenshot', fullPage: false }
        ],
        // Use stealth mode for better anti-bot protection
        proxy: 'stealth',
        location: {
          country: 'US',
          languages: ['en-US']
        },
        // Advanced settings for LinkedIn
        timeout: this.config.timeout,
        waitFor: 5000, // Wait 5 seconds for dynamic content
        blockAds: true, // Block ads to focus on job content
        mobile: false, // Use desktop version for better job listings
        onlyMainContent: true // Focus on main content area
      });

      if (!result.success) {
        throw new Error(`Enhanced Firecrawl scraping failed: ${result.error || 'Unknown error'}`);
      }

      console.log(`✅ Enhanced Firecrawl scraping successful for ${jobsUrl}`);
      console.log(`📊 Raw extraction result:`, JSON.stringify(result.json, null, 2));

      // Process the structured data
      const extractedData = result.json as z.infer<typeof JobsExtractionSchema>;
      const matchedJobs = this.processStructuredJobData(extractedData, linkedinUrl);

      const scrapingResult: ScrapingResult = {
        success: true,
        url: linkedinUrl,
        jobsFound: matchedJobs,
        totalJobs: extractedData.totalJobsFound || extractedData.jobs.length,
        processingTime: Date.now() - startTime,
        metadata: {
          scrapingMethod: 'enhanced-firecrawl',
          extractedJobsCount: extractedData.jobs.length,
          matchedJobsCount: matchedJobs.length,
          companyName: extractedData.companyName,
          pageType: extractedData.pageType,
          firecrawlMetadata: result.metadata || {},
          hasScreenshots: !!result.screenshot,
          extractionTimestamp: new Date().toISOString()
        }
      };

      console.log(`🎯 Enhanced scraping completed: ${matchedJobs.length} matched jobs from ${extractedData.jobs.length} total jobs`);
      return scrapingResult;

    } catch (error) {
      console.error(`❌ Enhanced Firecrawl LinkedIn scraping error for ${linkedinUrl}:`, error);
      
      return {
        success: false,
        url: linkedinUrl,
        jobsFound: [],
        totalJobs: 0,
        processingTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          scrapingMethod: 'enhanced-firecrawl',
          error: error instanceof Error ? error.message : 'Unknown error',
          extractionTimestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Enhanced career page scraping with company-specific adaptations
   */
  public async scrapeCareerPage(careerUrl: string, companyName?: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔥 Enhanced Firecrawl scraping career page: ${careerUrl}`);

      const result = await this.firecrawl.scrapeUrl(careerUrl, {
        formats: ['json'],
        jsonOptions: {
          schema: JobsExtractionSchema,
          prompt: `
            You are analyzing a company career/jobs page. Extract ALL job opportunities available.
            
            This could be various formats:
            - Traditional careers page with job listings
            - Modern job board with filters
            - Simple page with job links
            - Greenhouse, Lever, or other ATS integration
            
            EXTRACT:
            1. All job titles (even if they're just links)
            2. Department/category for each role
            3. Location information
            4. Direct application links
            5. Employment type and experience level if available
            6. Any job descriptions or requirements shown
            
            DEPARTMENT MAPPING:
            - Engineering/Technical: Software, Developer, Engineering, DevOps, Data, QA, etc.
            - Sales: Sales, Account, Business Development, Revenue, etc.
            - Marketing: Marketing, Growth, Brand, Content, Social Media, etc.
            - Product: Product Manager, Designer, UX, UI, Research, etc.
            - Operations: Operations, Program, Project, Business Operations, etc.
            - Customer: Customer Success, Support, Experience, Service, etc.
            - Finance: Finance, Accounting, Business Analyst, etc.
            - People/HR: HR, Recruiting, People Operations, Talent, etc.
            - Legal: Legal, Compliance, Contracts, etc.
            - Executive: C-level, VP, Director, Leadership, etc.
            
            Return all opportunities found with as much detail as possible.
          `
        },
        actions: [
          { type: 'wait', milliseconds: 4000 }, // Longer wait for career pages
          { type: 'screenshot', fullPage: false },
          
          // Career pages often have filters or "View all jobs" buttons
          { type: 'scroll', direction: 'down', amount: 2 },
          { type: 'wait', milliseconds: 3000 },
          
          // Try to expand job listings
          { type: 'scroll', direction: 'down', amount: 4 },
          { type: 'wait', milliseconds: 3000 },
          
          // Some pages load more on scroll
          { type: 'scroll', direction: 'down', amount: 4 },
          { type: 'wait', milliseconds: 2000 },
          
          { type: 'screenshot', fullPage: false }
        ],
        proxy: 'stealth',
        timeout: this.config.timeout,
        waitFor: 3000,
        blockAds: true,
        onlyMainContent: true
      });

      if (!result.success) {
        throw new Error(`Career page scraping failed: ${result.error || 'Unknown error'}`);
      }

      console.log(`✅ Career page scraping successful for ${careerUrl}`);
      
      const extractedData = result.json as z.infer<typeof JobsExtractionSchema>;
      const matchedJobs = this.processStructuredJobData(extractedData, careerUrl, 'career_page');

      return {
        success: true,
        url: careerUrl,
        jobsFound: matchedJobs,
        totalJobs: extractedData.totalJobsFound || extractedData.jobs.length,
        processingTime: Date.now() - startTime,
        metadata: {
          scrapingMethod: 'enhanced-firecrawl-career',
          extractedJobsCount: extractedData.jobs.length,
          matchedJobsCount: matchedJobs.length,
          companyName: extractedData.companyName || companyName,
          pageType: 'career_page',
          firecrawlMetadata: result.metadata || {}
        }
      };

    } catch (error) {
      console.error(`❌ Enhanced career page scraping error for ${careerUrl}:`, error);
      
      return {
        success: false,
        url: careerUrl,
        jobsFound: [],
        totalJobs: 0,
        processingTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          scrapingMethod: 'enhanced-firecrawl-career',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Process structured job data from Firecrawl extraction
   */
  private processStructuredJobData(
    extractedData: z.infer<typeof JobsExtractionSchema>, 
    sourceUrl: string,
    sourceType: 'linkedin' | 'career_page' = 'linkedin'
  ): LinkedInJobResult[] {
    const results: LinkedInJobResult[] = [];

    for (const job of extractedData.jobs) {
      // Use our job matching service to validate and score the job
      const matchResult = this.matchingService.matchJobTitle(job.title);
      
      if (matchResult) {
        results.push({
          title: job.title,
          department: matchResult.department || job.department || 'Other',
          location: job.location || '',
          job_url: job.jobUrl || sourceUrl,
          match_type: matchResult.matchType,
          confidence_score: matchResult.confidenceScore,
          scraped_at: new Date().toISOString(),
          source_page: sourceType
        });
      }
    }

    return results;
  }

  /**
   * Normalize LinkedIn URL to ensure we're hitting the jobs page
   */
  private normalizeToJobsUrl(url: string): string {
    let normalized = url.replace(/\/+$/, '').split('?')[0];
    
    if (!normalized.startsWith('http')) {
      normalized = `https://${normalized}`;
    }
    
    // Convert to jobs page if not already
    if (!normalized.includes('/jobs')) {
      normalized = normalized.replace(/\/company\/([^\/]+)\/?$/, '/company/$1/jobs/');
    }
    
    return normalized;
  }

  /**
   * Get scraper metrics
   */
  public getMetrics() {
    return {
      scrapingMethod: 'enhanced-firecrawl',
      apiKey: !!this.config.apiKey,
      timeout: this.config.timeout,
      rateLimitDelay: this.config.rateLimitDelay,
      features: [
        'stealth-mode',
        'structured-extraction',
        'dynamic-actions',
        'anti-bot-protection',
        'schema-validation'
      ]
    };
  }
}

export default EnhancedFirecrawlScraper;