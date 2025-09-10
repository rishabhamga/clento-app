/**
 * Career Page Scraper Service
 * 
 * Provides functionality to scrape company career pages to find job listings
 * that complement LinkedIn data. Handles various career page formats and
 * extracts relevant job information.
 */

import {
  type CareerPageJobResult,
  type ScrapingResult,
  type ScrapingConfig,
  type JobMatchingCriteria
} from '@/types/linkedin-job-filter';
import { JobMatchingService } from './job-matching-service';
import { createCareerPageRateLimiter, type AdvancedRateLimiter } from './rate-limiter';

// Common career page URL patterns
const CAREER_PAGE_PATTERNS = [
  '/careers',
  '/careers/',
  '/jobs',
  '/jobs/',
  '/opportunities',
  '/opportunities/',
  '/work-with-us',
  '/work-with-us/',
  '/join-us',
  '/join-us/',
  '/employment',
  '/employment/',
  '/hiring',
  '/hiring/'
];

// Common career page selectors for different platforms
const JOB_SELECTORS = {
  // Generic selectors
  generic: [
    '.job-listing',
    '.job-item',
    '.career-item',
    '.position',
    '.opening',
    '[data-job]',
    '[data-position]'
  ],
  
  // Platform-specific selectors
  greenhouse: [
    '.opening',
    '.opening-link',
    '[data-mapped="true"]'
  ],
  lever: [
    '.posting',
    '.posting-btn-submit'
  ],
  workday: [
    '[data-automation-id="jobTitle"]',
    '.job-title'
  ],
  bamboohr: [
    '.BambooHR-ATS-Jobs-Item',
    '.job-board-item'
  ],
  jobvite: [
    '.jv-job-list-item',
    '.job-title'
  ],
  smartrecruiters: [
    '.job-item',
    '.opening-job'
  ]
};

// Common title selectors
const TITLE_SELECTORS = [
  'h1', 'h2', 'h3', 'h4',
  '.title', '.job-title', '.position-title',
  '.name', '.job-name', '.position-name',
  '[data-job-title]', '[data-title]'
];

// Location selectors
const LOCATION_SELECTORS = [
  '.location', '.job-location', '.position-location',
  '.office', '.city', '.address',
  '[data-location]', '[data-city]'
];

export class CareerPageScraper {
  private config: ScrapingConfig;
  private matchingService: JobMatchingService;
  private rateLimiter: AdvancedRateLimiter;

  constructor(criteria: JobMatchingCriteria, config?: Partial<ScrapingConfig>) {
    const defaultConfig: ScrapingConfig = {
      maxRetries: 3,
      retryDelay: 2000,
      requestTimeout: 10000,
      rateLimitDelay: 1500, // Slightly longer delay for career pages
      maxConcurrentRequests: 3,
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    };

    this.config = { ...defaultConfig, ...config };
    this.matchingService = new JobMatchingService(criteria);
    this.rateLimiter = createCareerPageRateLimiter();
  }

  /**
   * Scrape jobs from a company career page
   */
  public async scrapeCareerPage(websiteUrl: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      // Find career page URLs
      const careerUrls = await this.findCareerPageUrls(websiteUrl);
      
      if (careerUrls.length === 0) {
        return {
          success: false,
          url: websiteUrl,
          jobsFound: [],
          totalJobs: 0,
          processingTime: Date.now() - startTime,
          errorMessage: 'No career pages found'
        };
      }

      let allJobs: CareerPageJobResult[] = [];
      let totalJobsFound = 0;

      // Scrape each career page
      for (const careerUrl of careerUrls) {
        try {
          const pageJobs = await this.scrapeJobsFromPage(careerUrl);
          allJobs = allJobs.concat(pageJobs);
          totalJobsFound += pageJobs.length;
        } catch (error) {
          console.warn(`Failed to scrape career page ${careerUrl}:`, error);
          // Continue with other pages
        }
      }

      return {
        success: true,
        url: websiteUrl,
        jobsFound: allJobs,
        totalJobs: totalJobsFound,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error(`Career page scraping error for ${websiteUrl}:`, error);
      
      return {
        success: false,
        url: websiteUrl,
        jobsFound: [],
        totalJobs: 0,
        processingTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: this.extractStatusCode(error)
      };
    }
  }

  /**
   * Find potential career page URLs for a website
   */
  private async findCareerPageUrls(websiteUrl: string): Promise<string[]> {
    const baseUrl = this.normalizeWebsiteUrl(websiteUrl);
    const careerUrls: string[] = [];

    // Generate potential career page URLs
    for (const pattern of CAREER_PAGE_PATTERNS) {
      const fullUrl = `${baseUrl}${pattern}`;
      careerUrls.push(fullUrl);
    }

    // Also try to fetch the main page and look for career links
    try {
      const mainPageUrls = await this.extractCareerLinksFromMainPage(baseUrl);
      careerUrls.push(...mainPageUrls);
    } catch (error) {
      console.warn(`Could not extract career links from main page ${baseUrl}:`, error);
    }

    // Remove duplicates and validate
    const uniqueUrls = [...new Set(careerUrls)];
    const validUrls: string[] = [];

    for (const url of uniqueUrls) {
      if (await this.isValidCareerPage(url)) {
        validUrls.push(url);
      }
    }

    return validUrls;
  }

  /**
   * Extract career page links from the main website
   */
  private async extractCareerLinksFromMainPage(baseUrl: string): Promise<string[]> {
    try {
      const response = await this.fetchWithRetry(baseUrl);
      const html = await response.text();
      
      const careerLinks: string[] = [];
      
      // Look for links containing career-related keywords
      const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*(?:career|job|hiring|work|join|opportunity)[^<]*)<\/a>/gi;
      let match;
      
      while ((match = linkPattern.exec(html)) !== null) {
        const href = match[1];
        const linkText = match[2].toLowerCase();
        
        if (this.isCareerRelatedLink(linkText, href)) {
          const fullUrl = this.resolveUrl(baseUrl, href);
          if (fullUrl) {
            careerLinks.push(fullUrl);
          }
        }
      }
      
      return careerLinks;
    } catch (error) {
      console.warn(`Failed to extract career links from ${baseUrl}:`, error);
      return [];
    }
  }

  /**
   * Check if a link is career-related
   */
  private isCareerRelatedLink(linkText: string, href: string): boolean {
    const careerKeywords = ['career', 'job', 'hiring', 'work', 'join', 'opportunity', 'employment'];
    const lowerText = linkText.toLowerCase();
    const lowerHref = href.toLowerCase();
    
    return careerKeywords.some(keyword => 
      lowerText.includes(keyword) || lowerHref.includes(keyword)
    );
  }

  /**
   * Check if a URL is a valid career page
   */
  private async isValidCareerPage(url: string): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      return response.ok && (contentType?.includes('text/html') ?? false);
    } catch (error) {
      return false;
    }
  }

  /**
   * Scrape jobs from a specific career page
   */
  private async scrapeJobsFromPage(careerUrl: string): Promise<CareerPageJobResult[]> {
    const response = await this.fetchWithRetry(careerUrl);
    const html = await response.text();
    
    // Detect the career platform
    const platform = this.detectCareerPlatform(html);
    
    // Extract job data based on platform
    const rawJobs = await this.extractJobsFromHtml(html, platform, careerUrl);
    
    // Process and match jobs
    return this.processCareerPageJobs(rawJobs, careerUrl);
  }

  /**
   * Detect the career platform being used
   */
  private detectCareerPlatform(html: string): string {
    const platformIndicators = {
      greenhouse: ['greenhouse.io', 'greenhouse-app', 'grnhse'],
      lever: ['lever.co', 'lever-app', 'postings-page'],
      workday: ['workday.com', 'wd-app'],
      bamboohr: ['bamboohr.com', 'BambooHR'],
      jobvite: ['jobvite.com', 'jv-'],
      smartrecruiters: ['smartrecruiters.com', 'sr-app']
    };

    for (const [platform, indicators] of Object.entries(platformIndicators)) {
      if (indicators.some(indicator => html.includes(indicator))) {
        return platform;
      }
    }

    return 'generic';
  }

  /**
   * Extract job listings from HTML
   */
  private async extractJobsFromHtml(html: string, platform: string, sourceUrl: string): Promise<RawCareerJob[]> {
    const jobs: RawCareerJob[] = [];
    
    try {
      // Get appropriate selectors for the platform
      const selectors = JOB_SELECTORS[platform as keyof typeof JOB_SELECTORS] || JOB_SELECTORS.generic;
      
      // For now, we'll use a simplified approach with regex
      // In a real implementation, you'd want to use a proper HTML parser like jsdom
      
      for (const selector of selectors) {
        const jobElements = this.extractElementsBySelector(html, selector);
        
        for (const element of jobElements) {
          const job = this.extractJobFromElement(element, sourceUrl);
          if (job) {
            jobs.push(job);
          }
        }
      }
      
      // If no jobs found with specific selectors, try generic extraction
      if (jobs.length === 0) {
        return this.extractJobsGeneric(html, sourceUrl);
      }
      
    } catch (error) {
      console.error('Error extracting jobs from HTML:', error);
    }
    
    return jobs;
  }

  /**
   * Generic job extraction when platform-specific selectors fail
   */
  private extractJobsGeneric(html: string, sourceUrl: string): RawCareerJob[] {
    const jobs: RawCareerJob[] = [];
    
    // Look for patterns that commonly indicate job titles
    const titlePatterns = [
      /<h[1-6][^>]*>([^<]*(?:engineer|manager|director|analyst|developer|designer|specialist|coordinator|assistant|lead|senior|junior)[^<]*)<\/h[1-6]>/gi,
      /<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/gi,
      /<span[^>]*class="[^"]*job[^"]*"[^>]*>([^<]+)<\/span>/gi
    ];

    for (const pattern of titlePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const title = this.cleanText(match[1]);
        if (this.isValidJobTitle(title)) {
          jobs.push({
            title,
            location: undefined,
            jobUrl: sourceUrl,
            department: this.matchingService.categorizeJobTitle(title) || undefined,
            scrapedAt: new Date().toISOString(),
            sourcePage: sourceUrl
          });
        }
      }
    }

    return jobs;
  }

  /**
   * Extract elements by CSS selector (simplified implementation)
   */
  private extractElementsBySelector(html: string, selector: string): string[] {
    const elements: string[] = [];
    
    // This is a very simplified selector implementation
    // In production, you'd want to use a proper HTML parser
    
    if (selector.startsWith('.')) {
      // Class selector
      const className = selector.slice(1);
      const pattern = new RegExp(`<[^>]+class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\/[^>]+>`, 'gi');
      let match;
      while ((match = pattern.exec(html)) !== null) {
        elements.push(match[0]);
      }
    } else if (selector.startsWith('[')) {
      // Attribute selector
      const attrMatch = selector.match(/\[([^=]+)(?:="([^"]*)")?\]/);
      if (attrMatch) {
        const attrName = attrMatch[1];
        const attrValue = attrMatch[2];
        const pattern = attrValue 
          ? new RegExp(`<[^>]+${attrName}="[^"]*\\b${attrValue}\\b[^"]*"[^>]*>([\\s\\S]*?)<\/[^>]+>`, 'gi')
          : new RegExp(`<[^>]+${attrName}="[^"]*"[^>]*>([\\s\\S]*?)<\/[^>]+>`, 'gi');
        
        let match;
        while ((match = pattern.exec(html)) !== null) {
          elements.push(match[0]);
        }
      }
    }
    
    return elements;
  }

  /**
   * Extract job information from an HTML element
   */
  private extractJobFromElement(elementHtml: string, sourceUrl: string): RawCareerJob | null {
    try {
      // Extract title
      let title = '';
      for (const titleSelector of TITLE_SELECTORS) {
        const titleMatch = this.extractTextBySelector(elementHtml, titleSelector);
        if (titleMatch) {
          title = titleMatch;
          break;
        }
      }

      // Extract location
      let location = '';
      for (const locationSelector of LOCATION_SELECTORS) {
        const locationMatch = this.extractTextBySelector(elementHtml, locationSelector);
        if (locationMatch) {
          location = locationMatch;
          break;
        }
      }

      // Extract job URL
      const urlMatch = elementHtml.match(/href="([^"]+)"/);
      const jobUrl = urlMatch ? this.resolveUrl(sourceUrl, urlMatch[1]) : sourceUrl;

      if (!title || !this.isValidJobTitle(title)) {
        return null;
      }

      return {
        title: this.cleanText(title),
        location: location ? this.cleanText(location) : undefined,
        jobUrl: jobUrl || sourceUrl,
        department: this.matchingService.categorizeJobTitle(title) || undefined,
        scrapedAt: new Date().toISOString(),
        sourcePage: sourceUrl
      };

    } catch (error) {
      console.error('Error extracting job from element:', error);
      return null;
    }
  }

  /**
   * Extract text content by selector
   */
  private extractTextBySelector(html: string, selector: string): string | null {
    if (selector.startsWith('.')) {
      const className = selector.slice(1);
      const pattern = new RegExp(`<[^>]+class="[^"]*\\b${className}\\b[^"]*"[^>]*>([^<]+)<`, 'i');
      const match = html.match(pattern);
      return match ? this.cleanText(match[1]) : null;
    } else {
      const pattern = new RegExp(`<${selector}[^>]*>([^<]+)<\/${selector}>`, 'i');
      const match = html.match(pattern);
      return match ? this.cleanText(match[1]) : null;
    }
  }

  /**
   * Process career page jobs and match against criteria
   */
  private processCareerPageJobs(rawJobs: RawCareerJob[], sourceUrl: string): CareerPageJobResult[] {
    const results: CareerPageJobResult[] = [];

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
          scraped_at: rawJob.scrapedAt,
          source_page: rawJob.sourcePage
        });
      }
    }

    return results;
  }

  /**
   * Utility methods
   */
  private normalizeWebsiteUrl(url: string): string {
    let normalized = url.trim();
    
    // Add protocol if missing
    if (!normalized.startsWith('http')) {
      normalized = `https://${normalized}`;
    }
    
    // Remove trailing slash
    normalized = normalized.replace(/\/+$/, '');
    
    return normalized;
  }

  private resolveUrl(baseUrl: string, relativeUrl: string): string | null {
    try {
      if (relativeUrl.startsWith('http')) {
        return relativeUrl;
      }
      
      const base = new URL(baseUrl);
      const resolved = new URL(relativeUrl, base);
      return resolved.toString();
    } catch (error) {
      return null;
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .trim();
  }

  private isValidJobTitle(title: string): boolean {
    const cleaned = this.cleanText(title);
    
    // Filter out common non-job title text
    const excludePatterns = [
      /^(view|apply|learn|read|see|click|more|details)$/i,
      /^(job|position|role|opportunity)$/i,
      /^[0-9]+$/,
      /^.{1,2}$/,
      /^.{100,}$/
    ];

    return cleaned.length > 2 && 
           cleaned.length < 100 && 
           !excludePatterns.some(pattern => pattern.test(cleaned));
  }

  private async fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
    const response = await this.rateLimiter.fetch(url, options);
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }



  private extractStatusCode(error: any): number | undefined {
    if (error && typeof error === 'object') {
      if (error.status) return error.status;
      if (error.statusCode) return error.statusCode;
      if (error.response && error.response.status) return error.response.status;
    }
    return undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limiter metrics for monitoring
   */
  public getRateLimiterMetrics() {
    return this.rateLimiter.getMetrics();
  }
}

// Internal interfaces
interface RawCareerJob {
  title: string;
  location?: string;
  jobUrl: string;
  department?: string;
  scrapedAt: string;
  sourcePage: string;
}

// Export utility functions
export class CareerPageUtils {
  /**
   * Generate potential career page URLs for a website
   */
  public static generateCareerUrls(websiteUrl: string): string[] {
    const baseUrl = websiteUrl.replace(/\/+$/, '');
    return CAREER_PAGE_PATTERNS.map(pattern => `${baseUrl}${pattern}`);
  }

  /**
   * Validate website URL format
   */
  public static isValidWebsiteUrl(url: string): boolean {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract domain from website URL
   */
  public static extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }
}