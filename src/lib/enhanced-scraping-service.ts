import { load } from "cheerio";
import type { EnhancedCompanyEnrichment } from "@/types/email-personalization";

// Enhanced scraping service with comprehensive error logging
export class EnhancedScrapingService {
  private cache = new Map<string, EnhancedCompanyEnrichment>();
  private rateLimiter = new Map<string, number>();
  private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between requests to same domain

  // Simple rate limiting
  private async waitForRateLimit(domain: string): Promise<void> {
    const lastRequest = this.rateLimiter.get(domain);
    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - lastRequest;
      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        await new Promise(resolve => 
          setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
        );
      }
    }
    this.rateLimiter.set(domain, Date.now());
  }

  // Enhanced company enrichment with error logging
  async enrichCompanyData(
    websiteUrl: string,
    linkedinCompanyUrl?: string,
    opts: { refresh?: boolean } = {}
  ): Promise<EnhancedCompanyEnrichment> {
    const cacheKey = `${websiteUrl}|${linkedinCompanyUrl || ''}`;
    
    if (!opts.refresh && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const enrichment: EnhancedCompanyEnrichment = {
      scrapingErrors: {},
      scrapedAt: {}
    };

    // 1. Scrape company website
    try {
      await this.scrapeCompanyWebsite(websiteUrl, enrichment);
    } catch (error) {
      console.error(`Failed to scrape company website ${websiteUrl}:`, error);
      enrichment.scrapingErrors!.companyWebsite = error instanceof Error ? error.message : 'Unknown error';
    }

    // 2. Scrape LinkedIn company page if provided
    if (linkedinCompanyUrl) {
      try {
        await this.scrapeLinkedInCompany(linkedinCompanyUrl, enrichment);
      } catch (error) {
        console.error(`Failed to scrape LinkedIn company ${linkedinCompanyUrl}:`, error);
        enrichment.scrapingErrors!.linkedInCompany = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // 3. Get news headlines (existing functionality)
    await this.scrapeNewsHeadlines(websiteUrl, enrichment);

    this.cache.set(cacheKey, enrichment);
    return enrichment;
  }

  // Enhanced LinkedIn profile scraping with comprehensive error logging
  async scrapeLinkedInProfile(
    linkedinProfileUrl: string,
    leadName: string
  ): Promise<EnhancedCompanyEnrichment['leadLinkedInData']> {
    try {
      const domain = new URL(linkedinProfileUrl).hostname;
      await this.waitForRateLimit(domain);

      const res = await fetch(linkedinProfileUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow"
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const html = await res.text();
      const $ = load(html);

      // Check for LinkedIn anti-bot protection
      if (html.includes('challenge-page') || html.includes('security-challenge')) {
        throw new Error('LinkedIn security challenge detected - profile scraping blocked');
      }

      if (html.includes('Page not found') || html.includes('This profile was not found')) {
        throw new Error('LinkedIn profile not found or private');
      }

      // Extract profile data with error handling for each section
      const profileData: any = {};
      const recentActivity: any[] = [];

      try {
        // Basic profile info
        profileData.headline = $('div.top-card-layout__headline').text().trim() ||
                              $('h2.top-card-layout__headline').text().trim() ||
                              $('.pv-text-details__left-panel h1').next('div').text().trim();

        profileData.summary = $('.pv-about__summary-text').text().trim() ||
                             $('.summary-section .pv-about-empty-state').text().trim();

        // Experience
        const experience: any[] = [];
        $('.experience-section .pv-entity__summary-info').each((i, elem) => {
          const title = $(elem).find('.pv-entity__summary-info-v2 h3').text().trim();
          const company = $(elem).find('.pv-entity__secondary-title').text().trim();
          const duration = $(elem).find('.pv-entity__bullet-item-v2').text().trim();
          
          if (title && company) {
            experience.push({ title, company, duration });
          }
        });
        profileData.experience = experience;

        // Skills (often limited without login)
        const skills: string[] = [];
        $('.skills-section .pv-skill-category-entity__name span').each((i, elem) => {
          const skill = $(elem).text().trim();
          if (skill) skills.push(skill);
        });
        profileData.skills = skills;

        // Recent activity/posts (very limited without login)
        $('.feed-shared-update-v2').each((i, elem) => {
          if (i < 3) { // Limit to 3 recent posts
            const content = $(elem).find('.feed-shared-text').text().trim();
            const timeElement = $(elem).find('time');
            const date = timeElement.attr('datetime') || timeElement.text().trim();
            
            if (content) {
              recentActivity.push({
                type: 'post' as const,
                content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
                date,
                engagement: 0 // Engagement data usually requires login
              });
            }
          }
        });

      } catch (parseError) {
        console.warn(`Error parsing LinkedIn profile sections for ${leadName}:`, parseError);
      }

      const result = {
        profileData: Object.keys(profileData).length > 0 ? profileData : undefined,
        recentActivity: recentActivity.length > 0 ? recentActivity : undefined,
        mutualConnections: [] // Usually requires login to see
      };

      console.log(`✅ Successfully scraped LinkedIn profile for ${leadName}`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to scrape LinkedIn profile for ${leadName}:`, errorMessage);
      
      // Log specific error types for better debugging
      if (errorMessage.includes('security-challenge')) {
        console.warn(`🔒 LinkedIn anti-bot protection triggered for ${leadName}`);
      } else if (errorMessage.includes('not found')) {
        console.warn(`🔍 LinkedIn profile not found or private for ${leadName}`);
      } else if (errorMessage.includes('HTTP 429')) {
        console.warn(`⏰ Rate limited by LinkedIn for ${leadName}`);
      } else {
        console.warn(`🌐 Network or parsing error for ${leadName}: ${errorMessage}`);
      }

      throw error;
    }
  }

  // Company website scraping
  private async scrapeCompanyWebsite(
    websiteUrl: string,
    enrichment: EnhancedCompanyEnrichment
  ): Promise<void> {
    const domain = new URL(websiteUrl).hostname;
    await this.waitForRateLimit(domain);

    const res = await fetch(websiteUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CompanyBot/1.0)" },
      redirect: "follow"
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    const $ = load(html);

    // Extract basic company info
    enrichment.description = 
      $("meta[name='description']").attr("content")?.trim() ||
      $("meta[property='og:description']").attr("content")?.trim() ||
      $("title").first().text().trim();

    // Enhanced tech stack detection
    const techHints: string[] = [];
    const htmlLower = html.toLowerCase();
    
    // CMS and frameworks
    if (htmlLower.includes("wp-content") || htmlLower.includes("wordpress")) techHints.push("WordPress");
    if (htmlLower.includes("shopify")) techHints.push("Shopify");
    if (htmlLower.includes("react")) techHints.push("React");
    if (htmlLower.includes("angular")) techHints.push("Angular");
    if (htmlLower.includes("vue")) techHints.push("Vue.js");
    if (htmlLower.includes("gatsby")) techHints.push("Gatsby");
    if (htmlLower.includes("next")) techHints.push("Next.js");
    if (htmlLower.includes("hubspot")) techHints.push("HubSpot");
    if (htmlLower.includes("salesforce")) techHints.push("Salesforce");
    if (htmlLower.includes("stripe")) techHints.push("Stripe");
    if (htmlLower.includes("paypal")) techHints.push("PayPal");
    if (htmlLower.includes("google-analytics") || htmlLower.includes("gtag")) techHints.push("Google Analytics");
    if (htmlLower.includes("intercom")) techHints.push("Intercom");
    if (htmlLower.includes("zendesk")) techHints.push("Zendesk");

    if (techHints.length) {
      enrichment.techStackHints = techHints;
    }

    enrichment.scrapedAt.companyWebsite = new Date();
    console.log(`✅ Successfully scraped company website: ${domain}`);
  }

  // LinkedIn company page scraping
  private async scrapeLinkedInCompany(
    linkedinCompanyUrl: string,
    enrichment: EnhancedCompanyEnrichment
  ): Promise<void> {
    const domain = new URL(linkedinCompanyUrl).hostname;
    await this.waitForRateLimit(domain);

    const res = await fetch(linkedinCompanyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      redirect: "follow"
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    const $ = load(html);

    // Check for LinkedIn protection
    if (html.includes('challenge-page')) {
      throw new Error('LinkedIn company page access blocked');
    }

    const linkedInData: any = {};

    try {
      // Company followers
      const followersText = $('.org-top-card-summary-info-list__info-item').text();
      const followersMatch = followersText.match(/([\d,]+)\s+followers/i);
      if (followersMatch) {
        linkedInData.followers = parseInt(followersMatch[1].replace(/,/g, ''));
      }

      // Industry
      linkedInData.industry = $('.org-top-card-summary__industry').text().trim();

      // Company size
      linkedInData.companySize = $('.org-about-us-organization-description__text').text().trim();

      // Recent posts (limited without login)
      const recentPosts: any[] = [];
      $('.feed-shared-update-v2').each((i, elem) => {
        if (i < 2) { // Limit to 2 recent posts
          const content = $(elem).find('.feed-shared-text').text().trim();
          if (content) {
            recentPosts.push({
              content: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
              date: new Date().toISOString(), // Approximate date
              engagement: 0
            });
          }
        }
      });

      if (recentPosts.length > 0) {
        linkedInData.recentPosts = recentPosts;
      }

    } catch (parseError) {
      console.warn('Error parsing LinkedIn company data:', parseError);
    }

    if (Object.keys(linkedInData).length > 0) {
      enrichment.linkedInData = linkedInData;
    }

    enrichment.scrapedAt.linkedInCompany = new Date();
    console.log(`✅ Successfully scraped LinkedIn company page`);
  }

  // News headlines scraping (existing functionality)
  private async scrapeNewsHeadlines(
    websiteUrl: string,
    enrichment: EnhancedCompanyEnrichment
  ): Promise<void> {
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    if (!NEWS_API_KEY) return;

    try {
      const domain = new URL(websiteUrl).hostname.replace(/^www\./, "");
      const newsRes = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(domain)}&pageSize=3&apiKey=${NEWS_API_KEY}`
      );
      
      if (newsRes.ok) {
        const json = await newsRes.json();
        if (json.articles) {
          enrichment.headlines = json.articles.map((a: any) => ({ 
            title: a.title, 
            url: a.url 
          }));
        }
      }
    } catch (error) {
      console.warn('Error fetching news headlines:', error);
    }
  }

  // Batch processing with comprehensive error tracking
  async processBatch(
    leads: Array<{ websiteUrl: string; linkedinUrl: string; name: string }>,
    onProgress?: (processed: number, total: number, errors: number) => void
  ): Promise<{
    results: Array<{ lead: any; enrichment: EnhancedCompanyEnrichment | null; error?: string }>;
    stats: {
      total: number;
      successful: number;
      failed: number;
      companyWebsiteSuccess: number;
      companyWebsiteFailures: number;
      linkedInCompanySuccess: number;
      linkedInCompanyFailures: number;
      linkedInProfileSuccess: number;
      linkedInProfileFailures: number;
    };
  }> {
    const results: any[] = [];
    const stats = {
      total: leads.length,
      successful: 0,
      failed: 0,
      companyWebsiteSuccess: 0,
      companyWebsiteFailures: 0,
      linkedInCompanySuccess: 0,
      linkedInCompanyFailures: 0,
      linkedInProfileSuccess: 0,
      linkedInProfileFailures: 0
    };

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      try {
        // Company enrichment
        const enrichment = await this.enrichCompanyData(lead.websiteUrl);
        
        // LinkedIn profile enrichment
        try {
          const linkedInProfileData = await this.scrapeLinkedInProfile(lead.linkedinUrl, lead.name);
          enrichment.leadLinkedInData = linkedInProfileData;
          stats.linkedInProfileSuccess++;
        } catch (profileError) {
          console.warn(`LinkedIn profile scraping failed for ${lead.name}:`, profileError);
          stats.linkedInProfileFailures++;
          if (!enrichment.scrapingErrors) enrichment.scrapingErrors = {};
          enrichment.scrapingErrors.linkedInProfile = profileError instanceof Error ? profileError.message : 'Unknown error';
        }

        // Update stats based on enrichment results
        if (!enrichment.scrapingErrors?.companyWebsite) {
          stats.companyWebsiteSuccess++;
        } else {
          stats.companyWebsiteFailures++;
        }

        if (!enrichment.scrapingErrors?.linkedInCompany) {
          stats.linkedInCompanySuccess++;
        } else {
          stats.linkedInCompanyFailures++;
        }

        results.push({ lead, enrichment });
        stats.successful++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Complete enrichment failed for ${lead.name}:`, errorMessage);
        
        results.push({ 
          lead, 
          enrichment: null, 
          error: errorMessage 
        });
        stats.failed++;
        stats.companyWebsiteFailures++;
        stats.linkedInProfileFailures++;
      }

      if (onProgress) {
        onProgress(i + 1, leads.length, stats.failed);
      }

      // Small delay between leads to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`📊 Batch processing complete:`, stats);
    return { results, stats };
  }

  // Get scraping statistics
  getStats() {
    return {
      cacheSize: this.cache.size,
      rateLimitEntries: this.rateLimiter.size
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Scraping cache cleared');
  }
}

// Export singleton instance
export const enhancedScrapingService = new EnhancedScrapingService();