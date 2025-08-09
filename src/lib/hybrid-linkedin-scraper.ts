/**
 * Hybrid LinkedIn Job Scraper
 * 
 * This scraper uses Firecrawl as the primary method for robust LinkedIn job scraping,
 * with fallback to the existing custom scraper for reliability.
 * 
 * Based on the Firecrawl Node SDK: https://docs.firecrawl.dev/sdks/node
 */

import { EnhancedFirecrawlScraper } from './enhanced-firecrawl-scraper';
import { LinkedInJobScraper } from './linkedin-job-scraper';
import {
  type ScrapingResult,
  type JobMatchingCriteria,
} from '@/types/linkedin-job-filter';

export class HybridLinkedInScraper {
  private enhancedFirecrawlScraper: EnhancedFirecrawlScraper | null = null;
  private fallbackScraper: LinkedInJobScraper;
  private criteria: JobMatchingCriteria;
  private isLinkedInBlocked: boolean = false;

  constructor(criteria: JobMatchingCriteria) {
    this.criteria = criteria;
    this.fallbackScraper = new LinkedInJobScraper(criteria);

    // Initialize Enhanced Firecrawl scraper if API key is available
    try {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (apiKey && apiKey !== 'fc-YOUR_FIRECRAWL_API_KEY_HERE' && apiKey.startsWith('fc-')) {
        this.enhancedFirecrawlScraper = new EnhancedFirecrawlScraper(criteria);
        console.log('🔥 Enhanced Firecrawl scraper initialized successfully');
      } else {
        console.log('⚠️ Firecrawl API key not configured or invalid format (should start with "fc-"), will use fallback scraper only');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize Enhanced Firecrawl scraper, will use fallback:', error);
    }
  }

  /**
   * Scrape LinkedIn jobs using Firecrawl first, then fallback if needed
   */
  public async scrapeCompanyJobs(linkedinUrl: string): Promise<ScrapingResult> {
    console.log(`🚀 Starting hybrid scraping for: ${linkedinUrl}`);
    
    // Try Enhanced Firecrawl first if available and LinkedIn isn't blocked
    if (this.enhancedFirecrawlScraper && !this.isLinkedInBlocked) {
      try {
        console.log(`🔥 Attempting Enhanced Firecrawl scraping...`);
        const firecrawlResult = await this.enhancedFirecrawlScraper.scrapeLinkedInJobs(linkedinUrl);
        
        // If Enhanced Firecrawl succeeds and finds jobs, return the result
        if (firecrawlResult.success && firecrawlResult.jobsFound.length > 0) {
          console.log(`✅ Enhanced Firecrawl scraping successful: ${firecrawlResult.jobsFound.length} jobs found`);
          return {
            ...firecrawlResult,
            metadata: {
              ...firecrawlResult.metadata,
              scrapingMethod: 'enhanced-firecrawl-primary',
              fallbackUsed: false
            }
          };
        }
        
        // If Enhanced Firecrawl succeeds but finds no jobs, log and try fallback
        if (firecrawlResult.success && firecrawlResult.jobsFound.length === 0) {
          console.log(`⚠️ Enhanced Firecrawl found no jobs, trying fallback scraper...`);
        } else {
          console.log(`⚠️ Enhanced Firecrawl failed, trying fallback scraper...`);
        }
        
      } catch (error: any) {
        console.error(`❌ Enhanced Firecrawl scraping error, trying fallback:`, error);
        
        // Check if LinkedIn is blocked (403 with specific message)
        if (error?.statusCode === 403 && error?.message?.includes('no longer supported')) {
          console.log('🚫 LinkedIn domain is blocked on this Firecrawl account - switching to fallback-only mode');
          this.isLinkedInBlocked = true;
        }
      }
    } else if (this.isLinkedInBlocked) {
      console.log('🚫 Skipping Firecrawl (LinkedIn blocked) - using fallback directly');
    }

    // Use fallback scraper
    console.log(`🔄 Using fallback scraper for: ${linkedinUrl}`);
    try {
      const fallbackResult = await this.fallbackScraper.scrapeCompanyJobs(linkedinUrl);
      
      return {
        ...fallbackResult,
        metadata: {
          ...fallbackResult.metadata,
          scrapingMethod: this.enhancedFirecrawlScraper ? 'fallback-after-enhanced-firecrawl' : 'fallback-only',
          fallbackUsed: true,
          firecrawlAvailable: !!this.enhancedFirecrawlScraper
        }
      };
      
    } catch (error) {
      console.error(`❌ Both Firecrawl and fallback scraping failed for ${linkedinUrl}:`, error);
      
      return {
        success: false,
        url: linkedinUrl,
        jobsFound: [],
        totalJobs: 0,
        processingTime: 0,
        errorMessage: `All scraping methods failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          scrapingMethod: 'hybrid-failed',
          fallbackUsed: true,
          firecrawlAvailable: !!this.enhancedFirecrawlScraper,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get metrics from both scrapers
   */
  public getMetrics() {
    return {
      enhancedFirecrawlAvailable: !!this.enhancedFirecrawlScraper,
      enhancedFirecrawlMetrics: this.enhancedFirecrawlScraper?.getMetrics() || null,
      fallbackMetrics: this.fallbackScraper.getRateLimiterMetrics(),
      scrapingStrategy: 'hybrid-enhanced'
    };
  }

  /**
   * Check if Enhanced Firecrawl is available and configured
   */
  public isFirecrawlAvailable(): boolean {
    return !!this.enhancedFirecrawlScraper;
  }

  public isLinkedInBlockedOnFirecrawl(): boolean {
    return this.isLinkedInBlocked;
  }
}

export default HybridLinkedInScraper;