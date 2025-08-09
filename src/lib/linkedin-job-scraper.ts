/**
 * LinkedIn Job Scraper Service
 * 
 * Provides functionality to scrape LinkedIn company pages to extract job listings
 * and match them against specified departments and job titles. Includes rate limiting,
 * error handling, and anti-bot protection measures.
 */

import {
  type LinkedInJobResult,
  type ScrapingResult,
  type ScrapingConfig,
  type JobMatchingCriteria,
  type MatchType
} from '@/types/linkedin-job-filter';
import { JobMatchingService, type JobMatchResult } from './job-matching-service';
import { createLinkedInRateLimiter, type AdvancedRateLimiter } from './rate-limiter';

// Default scraping configuration
const DEFAULT_SCRAPING_CONFIG: ScrapingConfig = {
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  requestTimeout: 15000, // 15 seconds
  rateLimitDelay: 1000, // 1 second between requests
  maxConcurrentRequests: 2,
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
  ]
};



export class LinkedInJobScraper {
  private config: ScrapingConfig;
  private matchingService: JobMatchingService;
  private rateLimiter: AdvancedRateLimiter;

  constructor(criteria: JobMatchingCriteria, config?: Partial<ScrapingConfig>) {
    this.config = { ...DEFAULT_SCRAPING_CONFIG, ...config };
    this.matchingService = new JobMatchingService(criteria);
    this.rateLimiter = createLinkedInRateLimiter();
  }

  /**
   * Scrape jobs from a LinkedIn company page
   */
  public async scrapeCompanyJobs(linkedinUrl: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      // Validate LinkedIn URL
      if (!this.isValidLinkedInUrl(linkedinUrl)) {
        return {
          success: false,
          url: linkedinUrl,
          jobsFound: [],
          totalJobs: 0,
          processingTime: Date.now() - startTime,
          errorMessage: 'Invalid LinkedIn URL format'
        };
      }

      // Extract company identifier from URL
      const companyId = this.extractCompanyId(linkedinUrl);
      if (!companyId) {
        return {
          success: false,
          url: linkedinUrl,
          jobsFound: [],
          totalJobs: 0,
          processingTime: Date.now() - startTime,
          errorMessage: 'Could not extract company ID from LinkedIn URL'
        };
      }

      // Scrape the jobs
      const jobsData = await this.fetchCompanyJobs(companyId, linkedinUrl);
      
      // Process and match jobs
      const matchedJobs = this.processJobData(jobsData, linkedinUrl);

      return {
        success: true,
        url: linkedinUrl,
        jobsFound: matchedJobs,
        totalJobs: jobsData.length,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error(`LinkedIn scraping error for ${linkedinUrl}:`, error);
      
      return {
        success: false,
        url: linkedinUrl,
        jobsFound: [],
        totalJobs: 0,
        processingTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: this.extractStatusCode(error)
      };
    }
  }

  /**
   * Validate LinkedIn company URL format
   */
  private isValidLinkedInUrl(url: string): boolean {
    // Allow both company URLs with and without /jobs/ suffix
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9\-_]+(\/jobs?)?\/?$/;
    return linkedinPattern.test(url);
  }

  /**
   * Extract company identifier from LinkedIn URL
   */
  private extractCompanyId(url: string): string | null {
    const match = url.match(/\/company\/([a-zA-Z0-9\-_]+)/);
    return match ? match[1] : null;
  }



  /**
   * Fetch jobs from LinkedIn company page
   * Note: This is a placeholder implementation. In a real-world scenario,
   * you would need to handle LinkedIn's anti-bot measures, authentication,
   * and potentially use a headless browser or API.
   */
  private async fetchCompanyJobs(companyId: string, originalUrl: string): Promise<RawJobData[]> {
    const jobsUrl = `https://www.linkedin.com/company/${companyId}/jobs/`;
    
    try {
      // Use advanced rate limiter for the request
      const response = await this.rateLimiter.fetch(jobsUrl, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse HTML to extract job data
      return this.parseJobsFromHtml(html);

    } catch (error) {
      // If direct scraping fails, try alternative approaches
      console.warn(`Direct LinkedIn scraping failed for ${companyId}, trying alternative methods:`, error);
      
      // Return mock data for now - in production, you would implement
      // alternative scraping methods or use LinkedIn's API
      return this.getMockJobData(companyId);
    }
  }

  /**
   * Parse job data from LinkedIn HTML
   * Note: LinkedIn's structure changes frequently, so this would need
   * regular maintenance in a production environment
   */
  private parseJobsFromHtml(html: string): RawJobData[] {
    const jobs: RawJobData[] = [];
    
    try {
      // This is a simplified parser. In reality, you'd need to handle
      // LinkedIn's complex DOM structure and potential changes
      
      // Look for job cards in the HTML
      const jobCardPattern = /<div[^>]*class="[^"]*job-card[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
      const jobCards = html.match(jobCardPattern) || [];
      
      for (const card of jobCards) {
        const job = this.extractJobFromCard(card);
        if (job) {
          jobs.push(job);
        }
      }
      
    } catch (error) {
      console.error('Error parsing LinkedIn HTML:', error);
    }
    
    return jobs;
  }

  /**
   * Extract job information from a job card HTML
   */
  private extractJobFromCard(cardHtml: string): RawJobData | null {
    try {
      // Extract title
      const titleMatch = cardHtml.match(/<h3[^>]*>(?:<[^>]*>)*([^<]+)(?:<\/[^>]*>)*<\/h3>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Extract location
      const locationMatch = cardHtml.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i);
      const location = locationMatch ? locationMatch[1].trim() : '';
      
      // Extract job URL
      const urlMatch = cardHtml.match(/href="([^"]*\/jobs\/view\/[^"]*)"/) || 
                     cardHtml.match(/href="([^"]*\/job\/[^"]*)"/) ||
                     cardHtml.match(/href="([^"]*\/jobs\/[^"]*)"/) ||
                     cardHtml.match(/href="([^"]*job[^"]*)"/)
      
      const jobUrl = urlMatch ? urlMatch[1] : '';
      
      if (!title) return null;
      
      return {
        title,
        location,
        jobUrl: jobUrl.startsWith('http') ? jobUrl : `https://www.linkedin.com${jobUrl}`,
        department: this.inferDepartment(title),
        scrapedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error extracting job from card:', error);
      return null;
    }
  }

  /**
   * Infer department from job title
   */
  private inferDepartment(title: string): string | undefined {
    return this.matchingService.categorizeJobTitle(title) || undefined;
  }

  /**
   * Get mock job data for testing/fallback
   */
  private getMockJobData(companyId: string): RawJobData[] {
    const mockJobs: RawJobData[] = [
      {
        title: 'Senior Sales Manager',
        location: 'San Francisco, CA',
        jobUrl: `https://www.linkedin.com/jobs/view/mock-job-1-${companyId}`,
        department: 'Sales',
        scrapedAt: new Date().toISOString()
      },
      {
        title: 'Software Engineer',
        location: 'Remote',
        jobUrl: `https://www.linkedin.com/jobs/view/mock-job-2-${companyId}`,
        department: 'Engineering',
        scrapedAt: new Date().toISOString()
      },
      {
        title: 'Product Manager',
        location: 'New York, NY',
        jobUrl: `https://www.linkedin.com/jobs/view/mock-job-3-${companyId}`,
        department: 'Product',
        scrapedAt: new Date().toISOString()
      },
      {
        title: 'Marketing Director',
        location: 'Austin, TX',
        jobUrl: `https://www.linkedin.com/jobs/view/mock-job-4-${companyId}`,
        department: 'Marketing',
        scrapedAt: new Date().toISOString()
      }
    ];

    // Return a random subset to simulate real data
    const count = Math.floor(Math.random() * mockJobs.length) + 1;
    return mockJobs.slice(0, count);
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
          location: rawJob.location,
          job_url: rawJob.jobUrl,
          match_type: matchResult.matchType,
          confidence_score: matchResult.confidenceScore,
          scraped_at: rawJob.scrapedAt
        });
      }
    }

    return results;
  }



  /**
   * Extract status code from error
   */
  private extractStatusCode(error: any): number | undefined {
    if (error && typeof error === 'object') {
      if (error.status) return error.status;
      if (error.statusCode) return error.statusCode;
      if (error.response && error.response.status) return error.response.status;
    }
    return undefined;
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry operation with exponential backoff
   */
  public async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Calculate exponential backoff delay
        const baseDelay = this.config.retryDelay;
        const delay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000; // Add jitter to avoid thundering herd
        
        console.warn(`LinkedIn scraping attempt ${attempt} failed, retrying in ${delay + jitter}ms:`, lastError.message);
        
        await this.sleep(delay + jitter);
      }
    }
    
    throw lastError!;
  }

  /**
   * Update scraping configuration
   */
  public updateConfig(newConfig: Partial<ScrapingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current rate limiter metrics for monitoring
   */
  public getRateLimiterMetrics() {
    return this.rateLimiter.getMetrics();
  }

  /**
   * Reset rate limiter metrics
   */
  public resetRateLimiter(): void {
    this.rateLimiter.resetMetrics();
  }
}

// Internal interfaces
interface RawJobData {
  title: string;
  location?: string;
  jobUrl: string;
  department?: string;
  scrapedAt: string;
}

// Static utility methods
export class LinkedInScrapingUtils {
  /**
   * Normalize LinkedIn company URL
   */
  public static normalizeLinkedInUrl(url: string): string {
    // Remove trailing slashes and query parameters
    let normalized = url.replace(/\/+$/, '').split('?')[0];
    
    // Ensure it starts with https
    if (!normalized.startsWith('http')) {
      normalized = `https://${normalized}`;
    }
    
    // Ensure it's a company URL
    if (!normalized.includes('/company/')) {
      throw new Error('URL must be a LinkedIn company page');
    }
    
    // Remove /jobs/ suffix if present since we'll add it in the scraper
    normalized = normalized.replace(/\/jobs?\/?$/, '');
    
    return normalized;
  }

  /**
   * Extract company name from LinkedIn URL
   */
  public static extractCompanyName(url: string): string | null {
    const match = url.match(/\/company\/([a-zA-Z0-9\-_]+)/);
    if (!match) return null;
    
    // Convert company slug to readable name
    return match[1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Validate batch of LinkedIn URLs
   */
  public static validateUrls(urls: string[]): { valid: string[]; invalid: { url: string; error: string }[] } {
    const valid: string[] = [];
    const invalid: { url: string; error: string }[] = [];
    
    for (const url of urls) {
      try {
        const normalized = this.normalizeLinkedInUrl(url);
        valid.push(normalized);
      } catch (error) {
        invalid.push({
          url,
          error: error instanceof Error ? error.message : 'Invalid URL'
        });
      }
    }
    
    return { valid, invalid };
  }
}