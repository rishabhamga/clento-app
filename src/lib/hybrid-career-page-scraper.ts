/**
 * Hybrid Career Page Scraper
 * 
 * Uses Enhanced Firecrawl for robust career page scraping with fallback
 * to the existing custom scraper for reliability. Handles various career
 * page formats including ATS systems (Greenhouse, Lever, Workday) and
 * custom implementations.
 * 
 * Based on Firecrawl's advanced capabilities for dynamic content loading.
 */

import { EnhancedFirecrawlScraper } from './enhanced-firecrawl-scraper';
import { CareerPageScraper } from './career-page-scraper';
import {
  type ScrapingResult,
  type JobMatchingCriteria,
} from '@/types/linkedin-job-filter';

export class HybridCareerPageScraper {
  private enhancedFirecrawlScraper: EnhancedFirecrawlScraper | null = null;
  private fallbackScraper: CareerPageScraper;
  private criteria: JobMatchingCriteria;

  constructor(criteria: JobMatchingCriteria) {
    this.criteria = criteria;
    this.fallbackScraper = new CareerPageScraper(criteria);

    // Initialize Enhanced Firecrawl scraper if API key is available
    try {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (apiKey && apiKey !== 'fc-YOUR_FIRECRAWL_API_KEY_HERE' && apiKey.startsWith('fc-')) {
        this.enhancedFirecrawlScraper = new EnhancedFirecrawlScraper(criteria);
        console.log('🔥 Enhanced Firecrawl career page scraper initialized successfully');
      } else {
        console.log('⚠️ Firecrawl API key not configured or invalid format (should start with "fc-"), will use fallback scraper only');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize Enhanced Firecrawl for career pages, will use fallback:', error);
    }
  }

  /**
   * Scrape career page jobs using Enhanced Firecrawl first, then fallback if needed
   */
  public async scrapeCareerPage(careerUrl: string, companyName?: string): Promise<ScrapingResult> {
    console.log(`🚀 Starting hybrid career page scraping for: ${careerUrl}`);
    
    // Try Enhanced Firecrawl first if available
    if (this.enhancedFirecrawlScraper) {
      try {
        console.log(`🔥 Attempting Enhanced Firecrawl career page scraping...`);
        const firecrawlResult = await this.enhancedFirecrawlScraper.scrapeCareerPage(careerUrl, companyName);
        
        // If Enhanced Firecrawl succeeds and finds jobs, return the result
        if (firecrawlResult.success && firecrawlResult.jobsFound.length > 0) {
          console.log(`✅ Enhanced Firecrawl career page scraping successful: ${firecrawlResult.jobsFound.length} jobs found`);
          return {
            ...firecrawlResult,
            metadata: {
              ...firecrawlResult.metadata,
              scrapingMethod: 'enhanced-firecrawl-career-primary',
              fallbackUsed: false
            }
          };
        }
        
        // If Enhanced Firecrawl succeeds but finds no jobs, log and try fallback
        if (firecrawlResult.success && firecrawlResult.jobsFound.length === 0) {
          console.log(`⚠️ Enhanced Firecrawl career page found no jobs, trying fallback scraper...`);
        } else {
          console.log(`⚠️ Enhanced Firecrawl career page failed, trying fallback scraper...`);
        }
        
      } catch (error) {
        console.error(`❌ Enhanced Firecrawl career page scraping error, trying fallback:`, error);
      }
    }

    // Use fallback scraper
    console.log(`🔄 Using fallback career page scraper for: ${careerUrl}`);
    try {
      const fallbackResult = await this.fallbackScraper.scrapeCareerPage(careerUrl);
      
      return {
        ...fallbackResult,
        metadata: {
          ...fallbackResult.metadata,
          scrapingMethod: this.enhancedFirecrawlScraper ? 'career-fallback-after-enhanced-firecrawl' : 'career-fallback-only',
          fallbackUsed: true,
          firecrawlAvailable: !!this.enhancedFirecrawlScraper
        }
      };
      
    } catch (error) {
      console.error(`❌ Both Enhanced Firecrawl and fallback career page scraping failed for ${careerUrl}:`, error);
      
      return {
        success: false,
        url: careerUrl,
        jobsFound: [],
        totalJobs: 0,
        processingTime: 0,
        errorMessage: `All career page scraping methods failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          scrapingMethod: 'career-hybrid-failed',
          fallbackUsed: true,
          firecrawlAvailable: !!this.enhancedFirecrawlScraper,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get rate limiter metrics for monitoring
   */
  public getRateLimiterMetrics() {
    return {
      enhancedFirecrawlAvailable: !!this.enhancedFirecrawlScraper,
      enhancedFirecrawlMetrics: this.enhancedFirecrawlScraper?.getMetrics() || null,
      fallbackMetrics: this.fallbackScraper.getRateLimiterMetrics(),
      scrapingStrategy: 'hybrid-career-enhanced'
    };
  }

  /**
   * Check if Enhanced Firecrawl is available and configured
   */
  public isFirecrawlAvailable(): boolean {
    return !!this.enhancedFirecrawlScraper;
  }

  /**
   * Check if the career page circuit breaker is exhausted
   */
  public isCircuitBreakerExhausted(): boolean {
    // Check if Enhanced Firecrawl is available and working
    if (this.enhancedFirecrawlScraper) {
      return false; // Firecrawl has better resilience
    }
    
    // Check fallback scraper's circuit breaker status
    const metrics = this.fallbackScraper.getRateLimiterMetrics();
    return metrics.circuitBreakerTrips >= 2; // Allow max 2 trips
  }
}

export default HybridCareerPageScraper;