import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { z } from 'zod';
import Url from 'url-parse';
import robotsParser from 'robots-parser';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if OpenAI API key is configured
const isOpenAIConfigured = !!process.env.OPENAI_API_KEY;
console.log('OpenAI configuration status:', { 
  hasApiKey: isOpenAIConfigured,
  keyLength: process.env.OPENAI_API_KEY?.length || 0,
  keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'none'
});

// Type definitions for ICP analysis
export interface PersonaData {
  title: string;
  company_size: string;
  industry: string;
  pain_points: string[];
  desired_outcomes: string[];
  challenges: string[];
  demographics: {
    seniority_level: string;
    department: string;
    decision_making_authority: string;
  };
}

export interface CaseStudy {
  title: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string[];
  metrics?: string;
  client_info?: string;
}

export interface LeadMagnet {
  title: string;
  type: string; // 'ebook', 'whitepaper', 'webinar', 'free_trial', 'demo', 'checklist'
  description: string;
  target_audience: string;
  call_to_action: string;
  url?: string;
}

export interface ComprehensiveICPAnalysis {
  core_offer: string;
  industry: string;
  business_model: string;
  icp_summary: string;
  target_personas: PersonaData[];
  case_studies: CaseStudy[];
  lead_magnets: LeadMagnet[];
  competitive_advantages: string[];
  tech_stack: string[];
  social_proof: {
    testimonials: Array<{
      quote: string;
      author: string;
      company?: string;
      position?: string;
    }>;
    client_logos: string[];
    metrics: Array<{
      metric: string;
      value: string;
    }>;
  };
  confidence_score: number;
}

// Zod schema for validation
const PersonaSchema = z.object({
  title: z.string(),
  company_size: z.string(),
  industry: z.string(),
  pain_points: z.array(z.string()),
  desired_outcomes: z.array(z.string()),
  challenges: z.array(z.string()),
  demographics: z.object({
    seniority_level: z.string(),
    department: z.string(),
    decision_making_authority: z.string(),
  }),
});

const ICPAnalysisSchema = z.object({
  core_offer: z.string(),
  industry: z.string(),
  business_model: z.string(),
  icp_summary: z.string(),
  target_personas: z.array(PersonaSchema),
  case_studies: z.array(z.object({
    title: z.string(),
    industry: z.string(),
    challenge: z.string(),
    solution: z.string(),
    results: z.array(z.string()),
    metrics: z.string().optional(),
    client_info: z.string().optional(),
  })),
  lead_magnets: z.array(z.object({
    title: z.string(),
    type: z.string(),
    description: z.string(),
    target_audience: z.string(),
    call_to_action: z.string(),
    url: z.string().optional(),
  })),
  competitive_advantages: z.array(z.string()),
  tech_stack: z.array(z.string()),
  social_proof: z.object({
    testimonials: z.array(z.object({
      quote: z.string(),
      author: z.string(),
      company: z.string().optional(),
      position: z.string().optional(),
    })),
    client_logos: z.array(z.string()),
    metrics: z.array(z.object({
      metric: z.string(),
      value: z.string(),
    })),
  }),
  confidence_score: z.number(),
});

export class AIICPService {
  private browser: Browser | null = null;
  private maxPages: number;
  private timeout: number;

  constructor(maxPages = 15, timeout = 30000) {
    // Ensure this service only runs on the server
    if (typeof window !== 'undefined') {
      throw new Error('AIICPService can only be used on the server side');
    }
    
    this.maxPages = maxPages;
    this.timeout = timeout;
  }

  async initBrowser(): Promise<Browser> {
    try {
      // Try Playwright first (better for modern sites)
      this.browser = await chromium.launch({
        headless: true,
        timeout: this.timeout,
      });
      return this.browser;
    } catch (error) {
      console.error('Playwright failed, falling back to Puppeteer:', error);
      try {
        // Dynamically import puppeteer to avoid build issues
        const puppeteer = await import('puppeteer-extra');
        const StealthPlugin = await import('puppeteer-extra-plugin-stealth');
        
        // Add stealth plugin
        puppeteer.default.use(StealthPlugin.default());
        
        // Fallback to Puppeteer with stealth
        const puppeteerBrowser = await puppeteer.default.launch({
          headless: true,
          timeout: this.timeout,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        // Type assertion since puppeteer and playwright have similar interfaces
        return puppeteerBrowser as unknown as Browser;
      } catch (puppeteerError) {
        console.error('Both Playwright and Puppeteer failed:', puppeteerError);
        throw new Error('Unable to initialize browser');
      }
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async discoverPages(websiteUrl: string): Promise<string[]> {
    const baseUrl = new Url(websiteUrl);
    const discoveredUrls = new Set<string>();
    
    // Add the main URL first (highest priority)
    discoveredUrls.add(websiteUrl);

    // Add high-priority pages immediately
    this.addHighPriorityPages(baseUrl, discoveredUrls);

    try {
      // 1. Check robots.txt and sitemap (but don't wait too long)
      await Promise.race([
        this.checkRobotsAndSitemap(baseUrl.origin, discoveredUrls),
        new Promise(resolve => setTimeout(resolve, 5000)) // Max 5 seconds for sitemap discovery
      ]);

      // 2. Crawl the homepage for links (but don't wait too long)
      await Promise.race([
        this.crawlForLinks(websiteUrl, baseUrl, discoveredUrls),
        new Promise(resolve => setTimeout(resolve, 5000)) // Max 5 seconds for crawling
      ]);

    } catch (error) {
      console.error('Error discovering pages:', error);
    }

    // Convert to array and prioritize
    const urlArray = Array.from(discoveredUrls);
    const prioritizedUrls = this.prioritizeUrls(urlArray, baseUrl);
    
    return prioritizedUrls.slice(0, this.maxPages);
  }

  private async checkRobotsAndSitemap(origin: string, discoveredUrls: Set<string>): Promise<void> {
    try {
      // Check robots.txt for sitemap
      const robotsUrl = `${origin}/robots.txt`;
      const robotsResponse = await fetch(robotsUrl);
      
      if (robotsResponse.ok) {
        const robotsText = await robotsResponse.text();
        const sitemapUrls = robotsText.match(/Sitemap:\s*(.*)/gi);
        
        if (sitemapUrls) {
          for (const sitemapLine of sitemapUrls) {
            const sitemapUrl = sitemapLine.replace(/Sitemap:\s*/i, '').trim();
            await this.parseSitemap(sitemapUrl, discoveredUrls);
          }
        }
      }

      // Try common sitemap locations
      const commonSitemaps = [
        `${origin}/sitemap.xml`,
        `${origin}/sitemap_index.xml`,
        `${origin}/sitemap1.xml`
      ];

      for (const sitemapUrl of commonSitemaps) {
        await this.parseSitemap(sitemapUrl, discoveredUrls);
      }
    } catch (error) {
      console.error('Error checking robots/sitemap:', error);
    }
  }

  private async parseSitemap(sitemapUrl: string, discoveredUrls: Set<string>): Promise<void> {
    try {
      const response = await fetch(sitemapUrl);
      if (response.ok) {
        const sitemapXml = await response.text();
        const $ = cheerio.load(sitemapXml);
        
        $('url loc').each((_, element) => {
          const urlText = $(element).text().trim();
          if (urlText && this.isRelevantPage(urlText)) {
            discoveredUrls.add(urlText);
          }
        });
      }
    } catch (error) {
      console.error(`Error parsing sitemap ${sitemapUrl}:`, error);
    }
  }

  private async crawlForLinks(websiteUrl: string, baseUrl: Url, discoveredUrls: Set<string>): Promise<void> {
    if (!this.browser) {
      await this.initBrowser();
    }

    try {
      const page = await this.browser!.newPage();
      await page.goto(websiteUrl, { waitUntil: 'networkidle', timeout: this.timeout });
      
      // Get all links
      const links = await page.$$eval('a[href]', (elements) => 
        elements.map(el => el.getAttribute('href')).filter(Boolean)
      );

      for (const link of links) {
        const fullUrl = this.resolveUrl(link!, baseUrl);
        if (fullUrl && this.isRelevantPage(fullUrl) && this.isSameDomain(fullUrl, baseUrl)) {
          discoveredUrls.add(fullUrl);
        }
      }

      await page.close();
    } catch (error) {
      console.error('Error crawling for links:', error);
    }
  }

  private addHighPriorityPages(baseUrl: Url, discoveredUrls: Set<string>): void {
    // Highest priority pages for business analysis
    const highPriorityPaths = [
      '/about', '/about-us', '/company',  // Company info
      '/solutions', '/services', '/products',  // What they offer
      '/pricing', '/plans',  // Business model
      '/case-studies', '/customers', '/success-stories',  // Social proof
      '/features', '/how-it-works'  // Product details
    ];

    for (const path of highPriorityPaths) {
      const fullUrl = `${baseUrl.origin}${path}`;
      discoveredUrls.add(fullUrl);
    }
  }

  private isRelevantPage(url: string): boolean {
    const irrelevantPatterns = [
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe|dmg)$/i,
      /\/(privacy|terms|legal|cookie|gdpr)/i,
      /\/(admin|wp-admin|login|signin|signup|register)/i,
      /\/(cart|checkout|order|billing)/i,
      /\#/,
      /\?.*utm_/,
    ];

    return !irrelevantPatterns.some(pattern => pattern.test(url));
  }

  private isSameDomain(url: string, baseUrl: Url): boolean {
    const parsedUrl = new Url(url);
    return parsedUrl.hostname === baseUrl.hostname;
  }

  private resolveUrl(href: string, baseUrl: Url): string | null {
    try {
      if (href.startsWith('http')) {
        return href;
      }
      if (href.startsWith('/')) {
        return `${baseUrl.origin}${href}`;
      }
      if (href.startsWith('./')) {
        return `${baseUrl.origin}${baseUrl.pathname}${href.slice(2)}`;
      }
      return `${baseUrl.origin}${baseUrl.pathname}${href}`;
    } catch {
      return null;
    }
  }

  async analyzeWebsite(websiteUrl: string): Promise<ComprehensiveICPAnalysis> {
    try {
      console.log(`Starting comprehensive analysis of ${websiteUrl}`);
      
      // Step 1: Discover all relevant pages
      console.log('Discovering pages...');
      const pages = await this.discoverPages(websiteUrl);
      console.log(`Found ${pages.length} pages to analyze`);

      if (pages.length === 0) {
        console.error('No pages found to analyze');
        throw new Error('No pages found to analyze');
      }

      // Step 2: Scrape content from each page
      console.log('Extracting content from pages...');
      const pageContents = await this.scrapePages(pages);
      
      console.log(`Successfully scraped ${pageContents.length} pages out of ${pages.length} discovered`);
      
      if (pageContents.length === 0) {
        console.error('Failed to scrape any content from pages');
        throw new Error('Failed to scrape any content from pages');
      }
      
      // Log content sample for debugging
      console.log('Sample scraped content:', {
        totalPages: pageContents.length,
        firstPage: pageContents[0] ? {
          url: pageContents[0].url,
          title: pageContents[0].title,
          contentLength: pageContents[0].content.length,
          contentPreview: pageContents[0].content.substring(0, 200) + '...'
        } : 'No content'
      });

      // Step 3: Analyze with AI
      console.log('Analyzing content with AI...');
      const analysis = await this.performAIAnalysis(pageContents, websiteUrl);

      console.log('Analysis complete!', {
        coreOffer: analysis.core_offer,
        industry: analysis.industry,
        confidence: analysis.confidence_score,
        personasFound: analysis.target_personas.length
      });
      
      return analysis;

    } catch (error) {
      console.error('Error in website analysis:', error);
      throw new Error(`Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await this.closeBrowser();
    }
  }

  private async scrapePages(urls: string[]): Promise<Array<{url: string, content: string, title: string}>> {
    if (!this.browser) {
      await this.initBrowser();
    }

    const results: Array<{url: string, content: string, title: string}> = [];
    const urlsToScrape = urls.slice(0, this.maxPages);
    
    // Parallel scraping for much better performance
    const scrapingPromises = urlsToScrape.map(async (url, index) => {
      try {
        console.log(`Scraping page ${index + 1}/${urlsToScrape.length}: ${url}`);
        
        const page = await this.browser!.newPage();
        
        // Set shorter timeout for faster processing
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', // Faster than 'networkidle'
          timeout: this.timeout 
        });
        
        const title = await page.title();
        const content = await page.evaluate(() => {
          // Remove script and style elements
          const scripts = document.querySelectorAll('script, style, nav, footer, header');
          scripts.forEach(el => el.remove());
          
          // Get main content
          const main = document.querySelector('main') || document.body;
          return main.innerText;
        });

        await page.close();
        
        return {
          url,
          title,
          content: content.replace(/\s+/g, ' ').trim()
        };
        
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        // Return null for failed pages
        return null;
      }
    });

    // Execute all scraping in parallel with some concurrency limit
    const concurrencyLimit = 3; // Scrape max 3 pages simultaneously
    const batchedResults: Array<{url: string, content: string, title: string} | null> = [];
    
    for (let i = 0; i < scrapingPromises.length; i += concurrencyLimit) {
      const batch = scrapingPromises.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(batch);
      batchedResults.push(...batchResults);
      
      // Small delay between batches to be respectful to servers
      if (i + concurrencyLimit < scrapingPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms
      }
    }

    // Filter out failed pages and return successful ones
    return batchedResults.filter((result): result is {url: string, content: string, title: string} => 
      result !== null && result.content.length > 100
    );
  }

  private async performAIAnalysis(pageContents: Array<{url: string, content: string, title: string}>, websiteUrl: string): Promise<ComprehensiveICPAnalysis> {
    console.log(`Starting AI analysis for ${pageContents.length} pages from ${websiteUrl}`);
    
    // Check OpenAI configuration first
    if (!isOpenAIConfigured) {
      console.error('OpenAI API key is not configured - check environment variables');
      throw new Error('OpenAI API key is not configured. Please check your environment variables.');
    }
    
    // Combine all content with page context
    const combinedContent = pageContents.map(page => 
      `PAGE: ${page.title} (${page.url})\n${page.content}`
    ).join('\n\n---\n\n');

    console.log(`Combined content length: ${combinedContent.length} characters`);
    
    if (combinedContent.length < 100) {
      console.error('Insufficient content for analysis');
      throw new Error('Insufficient content for analysis');
    }

    const prompt = `You are an expert business analyst specializing in Ideal Customer Profile (ICP) analysis. Analyze the following website content from ${websiteUrl} and extract comprehensive business intelligence.

WEBSITE CONTENT:
${combinedContent}

Please provide a comprehensive analysis in the following JSON format:

{
  "core_offer": "A clear, concise description of the main product/service offering",
  "industry": "Primary industry/sector this business operates in",
  "business_model": "Business model type (B2B SaaS, B2C, Marketplace, etc.)",
  "icp_summary": "2-3 sentence summary of the ideal customer profile",
  "target_personas": [
    {
      "title": "Decision maker title (e.g., CTO, Marketing Director)",
      "company_size": "Company size this persona works at",
      "industry": "Industry this persona typically works in",
      "pain_points": ["Specific pain points this persona faces"],
      "desired_outcomes": ["What this persona wants to achieve"],
      "challenges": ["Challenges they face in achieving their goals"],
      "demographics": {
        "seniority_level": "Junior/Mid/Senior/Executive",
        "department": "Primary department",
        "decision_making_authority": "Level of decision making power"
      }
    }
  ],
  "case_studies": [
    {
      "title": "Case study title",
      "industry": "Client industry", 
      "challenge": "The challenge the client faced",
      "solution": "How the company solved it",
      "results": ["Specific outcomes and benefits"],
      "metrics": "Quantifiable results if mentioned",
      "client_info": "Client company name or details if mentioned"
    }
  ],
  "lead_magnets": [
    {
      "title": "Lead magnet title",
      "type": "ebook|whitepaper|webinar|free_trial|demo|checklist|template|calculator",
      "description": "What the lead magnet offers",
      "target_audience": "Who it's designed for",
      "call_to_action": "The CTA used",
      "url": "URL if found"
    }
  ],
  "competitive_advantages": ["Key differentiators and unique value propositions"],
  "tech_stack": ["Technologies mentioned or detected (programming languages, platforms, tools)"],
  "social_proof": {
    "testimonials": [
      {
        "quote": "Customer testimonial text",
        "author": "Customer name",
        "company": "Customer company",
        "position": "Customer job title"
      }
    ],
    "client_logos": ["Company names mentioned as clients"],
    "metrics": [
      {
        "metric": "Type of metric (users, savings, growth, etc.)",
        "value": "The actual value/number"
      }
    ]
  },
  "confidence_score": 0.85
}

IMPORTANT GUIDELINES:
1. Extract exactly 2 target personas that represent the most likely decision makers
2. Focus on actionable insights that would help with outbound sales and marketing
3. Only include case studies, testimonials, and metrics that are explicitly mentioned
4. Be specific and detailed in pain points and desired outcomes
5. Assign a confidence score based on the quality and completeness of the information
6. If certain information is not available, use empty arrays [] or indicate "Not specified"
7. Ensure all extracted information is directly supported by the website content

Respond with valid JSON only.`;

    try {
      console.log('Sending request to OpenAI with model: gpt-4o');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert business analyst. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      console.log('OpenAI response received successfully');

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from OpenAI');
      }

      console.log('Response content length:', responseContent.length);
      console.log('Raw OpenAI response:', responseContent);

      // Clean the response content (remove markdown formatting if present)
      let cleanedContent = responseContent.trim();
      
      // Remove markdown code blocks if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing backticks
      cleanedContent = cleanedContent.replace(/^`+|`+$/g, '');
      
      console.log('Cleaned response content:', cleanedContent.substring(0, 200) + '...');

      // Parse and validate the JSON response
      const analysisData = JSON.parse(cleanedContent);
      const validatedAnalysis = ICPAnalysisSchema.parse(analysisData);
      
      console.log('AI analysis validation successful');
      
      return validatedAnalysis;

    } catch (error) {
      console.error('Error in AI analysis:', error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.substring(0, 500)
        });
      }
      
      // Instead of returning fallback, throw the error so it's properly handled
      if (error instanceof Error) {
        throw new Error(`AI analysis failed: ${error.message}`);
      } else {
        throw new Error('AI analysis failed due to unknown error');
      }
    }
  }

  // Add a fast analysis method for better UX
  async analyzeWebsiteFast(websiteUrl: string): Promise<ComprehensiveICPAnalysis> {
    // Use optimized settings for speed
    const originalMaxPages = this.maxPages;
    const originalTimeout = this.timeout;
    
    // Temporarily optimize for speed
    this.maxPages = 6; // Reduce to 6 most important pages
    this.timeout = 15000; // 15-second timeout instead of 30
    
    try {
      return await this.analyzeWebsite(websiteUrl);
    } finally {
      // Restore original settings
      this.maxPages = originalMaxPages;
      this.timeout = originalTimeout;
    }
  }

  // Prioritize URLs by importance for business analysis
  private prioritizeUrls(urls: string[], baseUrl: Url): string[] {
    const priorityScore = (url: string): number => {
      const lowerUrl = url.toLowerCase();
      
      // Homepage gets highest priority
      if (url === baseUrl.href || url === `${baseUrl.origin}/`) return 100;
      
      // Core business pages
      if (lowerUrl.includes('/about') || lowerUrl.includes('/company')) return 90;
      if (lowerUrl.includes('/services') || lowerUrl.includes('/solutions') || lowerUrl.includes('/products')) return 85;
      if (lowerUrl.includes('/pricing') || lowerUrl.includes('/plans')) return 80;
      if (lowerUrl.includes('/case-studies') || lowerUrl.includes('/customers') || lowerUrl.includes('/success')) return 75;
      if (lowerUrl.includes('/features') || lowerUrl.includes('/how-it-works')) return 70;
      
      // Secondary pages
      if (lowerUrl.includes('/resources') || lowerUrl.includes('/blog')) return 60;
      if (lowerUrl.includes('/contact') || lowerUrl.includes('/contact-us')) return 50;
      if (lowerUrl.includes('/testimonials') || lowerUrl.includes('/reviews')) return 65;
      
      // Default score
      return 40;
    };

    return urls.sort((a, b) => priorityScore(b) - priorityScore(a));
  }
}

// Export utility functions
export async function analyzeWebsiteICP(websiteUrl: string, fast: boolean = true): Promise<ComprehensiveICPAnalysis> {
  // Ensure this function only runs on the server
  if (typeof window !== 'undefined') {
    throw new Error('analyzeWebsiteICP can only be used on the server side');
  }
  
  const service = new AIICPService();
  
  if (fast) {
    // Use optimized fast analysis (6 pages, 15s timeout)
    return await service.analyzeWebsiteFast(websiteUrl);
  } else {
    // Use comprehensive analysis (15 pages, 30s timeout)
    return await service.analyzeWebsite(websiteUrl);
  }
}

// For backwards compatibility - keep the original comprehensive function
export async function analyzeWebsiteICPComprehensive(websiteUrl: string): Promise<ComprehensiveICPAnalysis> {
  return await analyzeWebsiteICP(websiteUrl, false);
} 