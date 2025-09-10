/**
 * Enhanced LinkedIn Job Scraper using Firecrawl
 * 
 * This scraper leverages Firecrawl's advanced capabilities to handle:
 * - JavaScript-rendered content
 * - Anti-bot protections
 * - Dynamic content loading
 * - Structured data extraction
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import {
  type LinkedInJobResult,
  type ScrapingResult,
  type JobMatchingCriteria,
} from '@/types/linkedin-job-filter';
import { JobMatchingService } from './job-matching-service';

// Firecrawl configuration
const FIRECRAWL_CONFIG = {
  apiKey: process.env.FIRECRAWL_API_KEY || '',
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  rateLimitDelay: 2000, // 2 seconds between requests
};

// Job extraction schema for structured data
const JOB_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    jobs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Job title or position name"
          },
          department: {
            type: "string", 
            description: "Department or team (Sales, Engineering, Marketing, etc.)"
          },
          location: {
            type: "string",
            description: "Job location (city, state, country, or Remote)"
          },
          jobUrl: {
            type: "string",
            description: "Direct link to the job posting"
          },
          company: {
            type: "string",
            description: "Company name"
          },
          postedDate: {
            type: "string",
            description: "When the job was posted"
          }
        },
        required: ["title"]
      }
    },
    totalJobsFound: {
      type: "number",
      description: "Total number of job listings found on the page"
    },
    companyName: {
      type: "string", 
      description: "Name of the company"
    }
  },
  required: ["jobs", "totalJobsFound"]
};

export class FirecrawlLinkedInScraper {
  private firecrawl: FirecrawlApp;
  private matchingService: JobMatchingService;
  private config: typeof FIRECRAWL_CONFIG;

  constructor(criteria: JobMatchingCriteria, config?: Partial<typeof FIRECRAWL_CONFIG>) {
    this.config = { ...FIRECRAWL_CONFIG, ...config };
    
    if (!this.config.apiKey) {
      throw new Error('Firecrawl API key is required. Set FIRECRAWL_API_KEY environment variable.');
    }
    
    this.firecrawl = new FirecrawlApp({ apiKey: this.config.apiKey });
    this.matchingService = new JobMatchingService(criteria);
  }

  /**
   * Scrape jobs from LinkedIn company page using Firecrawl
   */
  public async scrapeCompanyJobs(linkedinUrl: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 FireCrawl scraping LinkedIn jobs for: ${linkedinUrl}`);
      
      // Normalize URL to ensure we're hitting the jobs page
      const jobsUrl = this.normalizeToJobsUrl(linkedinUrl);
      console.log(`📍 Normalized jobs URL: ${jobsUrl}`);

      // Use Firecrawl to scrape with structured extraction
      const scrapeResult = await this.firecrawl.scrapeUrl(jobsUrl, {
        formats: ['markdown', 'html'],
        actions: [
          { type: 'wait', milliseconds: 3000 },
          { type: 'scroll', direction: 'down', amount: 3 },
          { type: 'wait', milliseconds: 2000 }
        ],
        location: {
          country: 'US',
          languages: ['en-US']
        }
      });

      if (!scrapeResult.success) {
        throw new Error(`Firecrawl scraping failed: ${scrapeResult.error || 'Unknown error'}`);
      }

      console.log(`✅ Firecrawl scraping successful for ${jobsUrl}`);
      
      // Extract jobs using AI-powered extraction
      const markdownContent = scrapeResult.markdown || '';
      const jobsData = await this.extractJobsWithAI(jobsUrl, markdownContent);
      
      // Process and match jobs against criteria
      const matchedJobs = this.processJobData(jobsData, linkedinUrl);

      const result: ScrapingResult = {
        success: true,
        url: linkedinUrl,
        jobsFound: matchedJobs,
        totalJobs: jobsData.length,
        processingTime: Date.now() - startTime,
        metadata: {
          scrapingMethod: 'firecrawl',
          extractedJobsCount: jobsData.length,
          matchedJobsCount: matchedJobs.length,
          firecrawlMetadata: scrapeResult.metadata || {}
        }
      };

      console.log(`🎯 Firecrawl scraping completed: ${matchedJobs.length} matched jobs found (${jobsData.length} total)`);
      return result;

    } catch (error) {
      console.error(`❌ Firecrawl LinkedIn scraping error for ${linkedinUrl}:`, error);
      
      return {
        success: false,
        url: linkedinUrl,
        jobsFound: [],
        totalJobs: 0,
        processingTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          scrapingMethod: 'firecrawl',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract job data using Firecrawl's AI-powered extraction
   */
  private async extractJobsWithAI(url: string, markdownContent: string): Promise<RawJobData[]> {
    try {
      console.log(`🤖 Extracting jobs with AI from ${url}...`);
      
      // Use Firecrawl's structured extraction with a specialized prompt
      const extractResult = await this.firecrawl.scrapeUrl(url, {
        formats: ['json'],
        jsonOptions: {
          prompt: `
            Extract all job listings from this LinkedIn company jobs page. For each job, provide:
            - title: The exact job title
            - department: Infer the department (Sales, Engineering, Marketing, Product, Customer Support, Operations, etc.) from the job title
            - location: Job location (city, state/country or "Remote")
            - jobUrl: Direct link to the job posting if available
            - company: Company name
            - postedDate: When posted (if available)
            
            Focus on identifying the department accurately based on job titles like:
            - Sales: Account Executive, Sales Manager, Business Development, Account Manager
            - Engineering: Software Engineer, Developer, Technical Lead, DevOps Engineer  
            - Marketing: Marketing Manager, Digital Marketing, Brand Manager, Content Marketing
            - Product: Product Manager, Product Designer, UX Designer
            - Operations: Operations Manager, Program Manager, Project Manager
            - Customer Support: Customer Success, Support Engineer, Customer Experience
            
            Return all jobs found, even if some fields are missing.
          `
        },
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'scroll', direction: 'down', amount: 5 },
          { type: 'wait', milliseconds: 3000 }
        ]
      });

      if (!extractResult.success || !extractResult.json) {
        console.warn('⚠️ AI extraction failed, falling back to markdown parsing');
        return this.fallbackParseMarkdown(markdownContent);
      }

      const extractedData = extractResult.json as any;
      const jobs = extractedData.jobs || [];
      
      console.log(`🎯 AI extracted ${jobs.length} jobs`);
      
      return jobs.map((job: any) => ({
        title: job.title || '',
        location: job.location || '',
        jobUrl: job.jobUrl || '',
        department: job.department || this.inferDepartmentFromTitle(job.title || ''),
        company: job.company || '',
        postedDate: job.postedDate || '',
        scrapedAt: new Date().toISOString()
      }));

    } catch (error) {
      console.warn('⚠️ AI extraction failed, falling back to markdown parsing:', error);
      return this.fallbackParseMarkdown(markdownContent);
    }
  }

  /**
   * Fallback: Parse job information from markdown content
   */
  private fallbackParseMarkdown(markdown: string): RawJobData[] {
    const jobs: RawJobData[] = [];
    
    try {
      // Look for job-related patterns in markdown
      const lines = markdown.split('\n');
      let currentJob: Partial<RawJobData> = {};
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Look for job titles (typically in headings or strong emphasis)
        if (line.match(/^#{1,3}\s+(.+)/) || line.match(/^\*\*(.+)\*\*$/)) {
          // Save previous job if it has a title
          if (currentJob.title) {
            jobs.push(this.finalizeRawJob(currentJob));
          }
          
          // Start new job
          const titleMatch = line.match(/^#{1,3}\s+(.+)/) || line.match(/^\*\*(.+)\*\*$/);
          currentJob = {
            title: titleMatch ? titleMatch[1].trim() : '',
            scrapedAt: new Date().toISOString()
          };
        }
        
        // Look for location indicators
        if (line.toLowerCase().includes('location') || 
            line.match(/\b(remote|hybrid|on-site)\b/i) ||
            line.match(/\b[A-Z][a-z]+,\s*[A-Z]{2}\b/)) {
          currentJob.location = line.replace(/location:?\s*/i, '').trim();
        }
        
        // Look for LinkedIn job URLs
        if (line.includes('linkedin.com/jobs/view/') || line.includes('/jobs/')) {
          const urlMatch = line.match(/https?:\/\/[^\s)]+/);
          if (urlMatch) {
            currentJob.jobUrl = urlMatch[0];
          }
        }
      }
      
      // Don't forget the last job
      if (currentJob.title) {
        jobs.push(this.finalizeRawJob(currentJob));
      }
      
    } catch (error) {
      console.error('Error parsing markdown for jobs:', error);
    }
    
    return jobs;
  }

  /**
   * Finalize raw job data with missing fields
   */
  private finalizeRawJob(job: Partial<RawJobData>): RawJobData {
    return {
      title: job.title || 'Unknown Position',
      location: job.location || '',
      jobUrl: job.jobUrl || '',
      department: job.department || this.inferDepartmentFromTitle(job.title || ''),
      company: job.company || '',
      postedDate: job.postedDate || '',
      scrapedAt: job.scrapedAt || new Date().toISOString()
    };
  }

  /**
   * Infer department from job title
   */
  private inferDepartmentFromTitle(title: string): string {
    return this.matchingService.categorizeJobTitle(title) || 'Other';
  }

  /**
   * Process raw job data and match against criteria
   */
  private processJobData(rawJobs: RawJobData[], sourceUrl: string): LinkedInJobResult[] {
    const results: LinkedInJobResult[] = [];

    for (const rawJob of rawJobs) {
      const matchResult = this.matchingService.matchJobTitle(rawJob.title);
      
      if (matchResult) {
        results.push({
          title: rawJob.title,
          department: matchResult.department || rawJob.department,
          location: rawJob.location || '',
          job_url: rawJob.jobUrl || '',
          match_type: matchResult.matchType,
          confidence_score: matchResult.confidenceScore,
          scraped_at: rawJob.scrapedAt
        });
      }
    }

    return results;
  }

  /**
   * Normalize LinkedIn URL to ensure we're hitting the jobs page
   */
  private normalizeToJobsUrl(url: string): string {
    // Remove trailing slashes and query parameters
    let normalized = url.replace(/\/+$/, '').split('?')[0];
    
    // Ensure it starts with https
    if (!normalized.startsWith('http')) {
      normalized = `https://${normalized}`;
    }
    
    // Add /jobs/ if not present
    if (!normalized.includes('/jobs')) {
      normalized = normalized.replace(/\/company\/([^\/]+)\/?$/, '/company/$1/jobs/');
    }
    
    return normalized;
  }

  /**
   * Get rate limiter metrics for monitoring
   */
  public getMetrics() {
    return {
      scrapingMethod: 'firecrawl',
      apiKey: !!this.config.apiKey,
      timeout: this.config.timeout,
      rateLimitDelay: this.config.rateLimitDelay
    };
  }
}

// Internal interfaces
interface RawJobData {
  title: string;
  location?: string;
  jobUrl?: string;
  department?: string;
  company?: string;
  postedDate?: string;
  scrapedAt: string;
}

// Export for use in hybrid scraper
export type { RawJobData };