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

/**
 * Comprehensive URL normalization and validation
 * Handles various input formats to ensure valid HTTPS URLs
 */
function normalizeAndValidateUrl(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('URL is required and must be a string');
  }

  // Clean up the input
  let url = input.trim();
  
  if (!input || url.length === 0) {
    throw new Error('URL cannot be empty');
  }

  // Remove trailing slashes for consistency
  url = url.replace(/\/+$/, '');

  // Handle special edge cases early
  if (url === 'www' || url === 'www.') {
    throw new Error(`Incomplete URL: "${input}". Did you mean "www.example.com"?`);
  }

  try {
    // Case 1: Already has protocol
    if (url.match(/^https?:\/\//i)) {
      const parsedUrl = new URL(url);
      
      // Upgrade HTTP to HTTPS for security (with some exceptions)
      if (parsedUrl.protocol === 'http:') {
        // Allow HTTP for localhost and IP addresses for development
        const isLocalhost = parsedUrl.hostname === 'localhost' || 
                           parsedUrl.hostname === '127.0.0.1' ||
                           parsedUrl.hostname.startsWith('192.168.') ||
                           parsedUrl.hostname.startsWith('10.') ||
                           parsedUrl.hostname.match(/^172\.(1[6-9]|2\d|3[01])\./);
        
        if (!isLocalhost) {
          console.log(`Upgrading HTTP to HTTPS for: ${url}`);
          parsedUrl.protocol = 'https:';
        }
      }
      
      return parsedUrl.toString().replace(/\/$/, ''); // Remove trailing slash
    }

    // Case 2: No protocol - add HTTPS
    // Handle common patterns like www.example.com, example.com, etc.
    
    // Check if it looks like a valid domain
    const domainPattern = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/;
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/;
    const localhostPattern = /^localhost(:\d+)?(\/.*)?$/;
    
    if (domainPattern.test(url) || ipPattern.test(url) || localhostPattern.test(url)) {
      // For localhost and IP addresses, prefer HTTP for development
      if (url.startsWith('localhost') || url.startsWith('127.0.0.1') || 
          url.match(/^192\.168\./) || url.match(/^10\./) || 
          url.match(/^172\.(1[6-9]|2\d|3[01])\./)) {
        const testUrl = `http://${url}`;
        console.log(`Using HTTP for local development: ${testUrl}`);
        return new URL(testUrl).toString().replace(/\/$/, '');
      } else {
        // For all other domains, use HTTPS
        const testUrl = `https://${url}`;
        console.log(`Adding HTTPS protocol to: ${url} -> ${testUrl}`);
        return new URL(testUrl).toString().replace(/\/$/, '');
      }
    }

    // Case 3: Might be a subdirectory or malformed URL
    // Try to fix common issues
    
    // Remove leading slashes or dots
    url = url.replace(/^[.\/]+/, '');
    
    // If it still doesn't look like a domain, try to help
    if (!domainPattern.test(url) && !ipPattern.test(url) && !localhostPattern.test(url)) {

      
      // Check if it might be missing TLD
      if (url.includes('.') && !url.includes(' ')) {
        // Try adding .com if it looks like a domain without TLD
        const parts = url.split('.');
        if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
          // Looks like domain.something but not a valid TLD, might be intentional
          const testUrl = `https://${url}`;
          console.log(`Attempting to use as-is with HTTPS: ${testUrl}`);
          return new URL(testUrl).toString().replace(/\/$/, '');
        }
      }
      
      // If no dots at all, might be a single word - try adding .com (but not for "www")
      if (!url.includes('.') && url.match(/^[a-zA-Z0-9-]+$/) && url !== 'www') {
        const suggestedUrl = `https://${url}.com`;
        console.log(`Single word domain detected, trying: ${suggestedUrl}`);
        return new URL(suggestedUrl).toString().replace(/\/$/, '');
      }
      
      throw new Error(`Invalid URL format: "${input}". Please provide a valid domain like "example.com" or "https://example.com"`);
    }
    
    // Final attempt - add HTTPS
    const finalUrl = `https://${url}`;
    return new URL(finalUrl).toString().replace(/\/$/, '');
    
  } catch (error) {
    // Provide helpful error messages for common mistakes
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes(' ')) {
      throw new Error(`URL cannot contain spaces: "${input}". Did you mean "${input.replace(/\s+/g, '')}"?`);
    }
    
    if (lowerInput.startsWith('www') && !lowerInput.includes('.')) {
      throw new Error(`Incomplete URL: "${input}". Did you mean "www.${input.slice(3)}.com"?`);
    }
    
    if (!lowerInput.includes('.') && lowerInput.length > 0) {
      throw new Error(`URL must include a domain: "${input}". Did you mean "${input}.com"?`);
    }
    
    throw new Error(`Invalid URL: "${input}". Please provide a valid URL like "example.com" or "https://example.com"`);
  }
}

/**
 * Validate that a normalized URL is reachable (basic connectivity check)
 */
async function validateUrlConnectivity(url: string): Promise<void> {
  try {
    console.log(`Validating connectivity to: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD', // Lightweight request
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebsiteAnalyzer/1.0; URL-Validator)'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok && response.status >= 400) {
      // If HEAD fails, try GET (some servers don't support HEAD)
      console.log(`HEAD request failed (${response.status}), trying GET...`);
      
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), 10000);
      
      const getResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WebsiteAnalyzer/1.0; URL-Validator)'
        },
        signal: getController.signal
      });
      
      clearTimeout(getTimeoutId);
      
      if (!getResponse.ok && getResponse.status >= 400) {
        throw new Error(`Website returned HTTP ${getResponse.status}: ${getResponse.statusText}`);
      }
    }
    
    console.log(`✓ URL is reachable: ${url}`);
  } catch (error) {
    // Type guard for error handling
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout: Could not connect to "${url}". Please check if the website is accessible.`);
      }
      
      if ('code' in error && (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED')) {
        throw new Error(`Cannot reach "${url}". Please check if the domain exists and is accessible.`);
      }
      
      // Re-throw with more context if it's already a descriptive error
      if (error.message.includes('HTTP') || error.message.includes('Timeout')) {
        throw error;
      }
      
      throw new Error(`Failed to connect to "${url}": ${error.message}`);
    }
    
    throw new Error(`Failed to connect to "${url}": ${String(error)}`);
  }
}

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
      // Try browser-based analysis first
      return await this.analyzeWebsite(websiteUrl);
    } catch (error) {
      console.warn('Browser-based analysis failed, falling back to browser-free mode:', error);
      
      // Fallback to browser-free analysis for cloud environments
      try {
        return await this.analyzeWebsiteNoBrowser(websiteUrl);
      } catch (fallbackError) {
        console.error('Both browser and browser-free analysis failed:', fallbackError);
        throw new Error(`Analysis failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
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

  // Add browser-free analysis for cloud environments
  async analyzeWebsiteNoBrowser(websiteUrl: string): Promise<ComprehensiveICPAnalysis> {
    try {
      console.log(`Starting browser-free analysis of ${websiteUrl}`);
      
      // Step 1: Discover pages without browser
      const pages = await this.discoverPagesNoBrowser(websiteUrl);
      console.log(`Found ${pages.length} pages to analyze`);

      if (pages.length === 0) {
        throw new Error('No pages found to analyze');
      }

      // Step 2: Fetch content without browser
      const pageContents = await this.fetchPagesNoBrowser(pages);
      
      console.log(`Successfully fetched ${pageContents.length} pages out of ${pages.length} discovered`);
      
      // Step 3: Handle different content scenarios
      if (pageContents.length === 0) {
        console.warn('No content fetched, attempting fallback analysis with URL only');
        return await this.performFallbackAnalysis(websiteUrl, pages);
      }
      
      // If we have very little content, try to supplement with URL analysis
      if (pageContents.length < 2 || pageContents.every(p => p.content.length < 200)) {
        console.warn('Very limited content available, supplementing with URL analysis');
        const urlAnalysis = await this.analyzeFromUrl(websiteUrl);
        
        // Merge URL analysis with any content we have
        const contentAnalysis = pageContents.length > 0 
          ? await this.performAIAnalysis(pageContents, websiteUrl)
          : urlAnalysis;
          
        return this.mergeAnalyses(urlAnalysis, contentAnalysis);
      }

      // Step 4: Normal analysis with good content
      const analysis = await this.performAIAnalysis(pageContents, websiteUrl);

      console.log('Browser-free analysis complete!', {
        coreOffer: analysis.core_offer,
        industry: analysis.industry,
        confidence: analysis.confidence_score,
        personasFound: analysis.target_personas.length
      });
      
      return analysis;

    } catch (error) {
      console.error('Error in browser-free website analysis:', error);
      
      // Ultimate fallback: try to analyze just from the URL
      try {
        console.log('Attempting ultimate fallback: URL-only analysis');
        const fallbackAnalysis = await this.analyzeFromUrl(websiteUrl);
        fallbackAnalysis.confidence_score = Math.min(fallbackAnalysis.confidence_score, 0.3); // Lower confidence
        return fallbackAnalysis;
      } catch (fallbackError) {
        console.error('Even fallback analysis failed:', fallbackError);
        throw new Error(`Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // Fallback analysis when no content can be fetched
  private async performFallbackAnalysis(websiteUrl: string, discoveredPages: string[]): Promise<ComprehensiveICPAnalysis> {
    console.log('Performing fallback analysis with URL and page structure only');
    
    const urlAnalysis = await this.analyzeFromUrl(websiteUrl);
    
    // Enhance with page structure insights
    const pageStructureInsights = this.analyzePageStructure(discoveredPages);
    
    return {
      ...urlAnalysis,
      confidence_score: Math.min(urlAnalysis.confidence_score, 0.2), // Very low confidence
      icp_summary: `${urlAnalysis.icp_summary}\n\nNote: This analysis is based on URL and page structure only due to content fetching limitations.`,
      tech_stack: [...urlAnalysis.tech_stack, ...pageStructureInsights.techStack],
      competitive_advantages: [...urlAnalysis.competitive_advantages, ...pageStructureInsights.advantages]
    };
  }

  // Analyze website based on URL patterns and domain info
  private async analyzeFromUrl(websiteUrl: string): Promise<ComprehensiveICPAnalysis> {
    const baseUrl = new Url(websiteUrl);
    const domain = baseUrl.hostname;
    const path = baseUrl.pathname;
    
    // Extract insights from URL structure
    const urlInsights = {
      domain,
      path,
      hasProductKeywords: /product|solution|platform|tool|app|software|service/.test(domain + path),
      hasB2BKeywords: /b2b|enterprise|business|corporate|saas|api|crm|erp/.test(domain + path),
      hasIndustryKeywords: this.extractIndustryFromUrl(domain + path),
      hasTechKeywords: /tech|ai|ml|cloud|data|analytics|automation/.test(domain + path)
    };

    // Generate basic analysis from URL
    const prompt = `Based on this website URL: ${websiteUrl}
    
    Domain: ${domain}
    Path: ${path}
    
    URL Analysis:
    - Has product keywords: ${urlInsights.hasProductKeywords}
    - Has B2B keywords: ${urlInsights.hasB2BKeywords}
    - Industry keywords: ${urlInsights.hasIndustryKeywords}
    - Tech keywords: ${urlInsights.hasTechKeywords}
    
    Please provide a basic ICP analysis based on the URL structure and domain name. This is a fallback analysis when content cannot be fetched.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst specializing in identifying ideal customer profiles from minimal website information. Generate a basic analysis from URL structure only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const analysisText = completion.choices[0].message.content;
      
      // Parse the AI response into structured format
      return this.parseBasicAnalysis(analysisText || '', websiteUrl);
      
    } catch (error) {
      console.error('Error in URL-based analysis:', error);
      
      // Return a very basic fallback structure
      return this.createMinimalAnalysis(websiteUrl, urlInsights);
    }
  }

  // Extract industry hints from URL
  private extractIndustryFromUrl(urlText: string): string {
    const industryKeywords = {
      'fintech|finance|banking|payment|crypto': 'Financial Services',
      'health|medical|healthcare|pharma': 'Healthcare',
      'edu|education|learning|course': 'Education',
      'ecommerce|retail|shop|store': 'E-commerce',
      'real.*estate|property|realty': 'Real Estate',
      'travel|hotel|booking|airline': 'Travel & Hospitality',
      'food|restaurant|delivery|recipe': 'Food & Beverage',
      'marketing|advertising|seo|social': 'Marketing',
      'hr|hiring|recruit|talent': 'Human Resources',
      'logistics|shipping|supply|transport': 'Logistics',
      'construction|building|contractor': 'Construction',
      'legal|law|attorney|lawyer': 'Legal Services'
    };

    for (const [pattern, industry] of Object.entries(industryKeywords)) {
      if (new RegExp(pattern, 'i').test(urlText)) {
        return industry;
      }
    }

    return 'Technology';
  }

  // Analyze page structure for insights
  private analyzePageStructure(pages: string[]): { techStack: string[], advantages: string[] } {
    const techStack: string[] = [];
    const advantages: string[] = [];

    // Analyze page patterns
    const pagePatterns = pages.map(p => p.toLowerCase());
    
    if (pagePatterns.some(p => p.includes('api'))) {
      techStack.push('API Integration');
      advantages.push('Developer-friendly API');
    }
    
    if (pagePatterns.some(p => p.includes('pricing'))) {
      advantages.push('Transparent pricing');
    }
    
    if (pagePatterns.some(p => p.includes('case-studies') || p.includes('testimonials'))) {
      advantages.push('Proven customer success');
    }
    
    if (pagePatterns.some(p => p.includes('security'))) {
      advantages.push('Security-focused');
    }
    
    if (pagePatterns.some(p => p.includes('integration'))) {
      advantages.push('Easy integrations');
    }

    return { techStack, advantages };
  }

  // Parse basic AI analysis response
  private parseBasicAnalysis(analysisText: string, websiteUrl: string): ComprehensiveICPAnalysis {
    // This is a simplified parser - in production, you'd want more sophisticated parsing
    const domain = new Url(websiteUrl).hostname;
    
    return {
      core_offer: `Service/Product offering from ${domain}`,
      industry: this.extractIndustryFromUrl(domain),
      business_model: 'B2B SaaS', // Default assumption
      icp_summary: `Basic ICP analysis for ${domain} based on URL structure only.`,
      target_personas: [{
        title: 'Business Decision Maker',
        company_size: 'Small to Medium Business',
        industry: 'Technology',
        pain_points: ['Operational efficiency', 'Cost optimization'],
        desired_outcomes: ['Improved productivity', 'Better results'],
        challenges: ['Limited resources', 'Technical complexity'],
        demographics: {
          seniority_level: 'Manager to Director',
          department: 'Operations',
          decision_making_authority: 'Medium'
        }
      }],
      case_studies: [],
      lead_magnets: [],
      competitive_advantages: ['Digital solution', 'Web-based platform'],
      tech_stack: ['Web Application'],
      social_proof: {
        testimonials: [],
        client_logos: [],
        metrics: []
      },
      confidence_score: 0.2 // Very low confidence for URL-only analysis
    };
  }

  // Create minimal analysis structure
  private createMinimalAnalysis(websiteUrl: string, urlInsights: any): ComprehensiveICPAnalysis {
    const domain = new Url(websiteUrl).hostname;
    
    return {
      core_offer: `Digital service from ${domain}`,
      industry: urlInsights.hasIndustryKeywords || 'Technology',
      business_model: urlInsights.hasB2BKeywords ? 'B2B' : 'B2C',
      icp_summary: `Minimal analysis for ${domain} - content fetching failed.`,
      target_personas: [{
        title: 'Primary User',
        company_size: 'Unknown',
        industry: 'Various',
        pain_points: ['Needs digital solution'],
        desired_outcomes: ['Solve business problem'],
        challenges: ['Finding right solution'],
        demographics: {
          seniority_level: 'Unknown',
          department: 'Unknown',
          decision_making_authority: 'Unknown'
        }
      }],
      case_studies: [],
      lead_magnets: [],
      competitive_advantages: ['Web-based solution'],
      tech_stack: ['Web Technology'],
      social_proof: {
        testimonials: [],
        client_logos: [],
        metrics: []
      },
      confidence_score: 0.1 // Minimal confidence
    };
  }

  // Merge two analyses
  private mergeAnalyses(urlAnalysis: ComprehensiveICPAnalysis, contentAnalysis: ComprehensiveICPAnalysis): ComprehensiveICPAnalysis {
    return {
      core_offer: contentAnalysis.core_offer || urlAnalysis.core_offer,
      industry: contentAnalysis.industry || urlAnalysis.industry,
      business_model: contentAnalysis.business_model || urlAnalysis.business_model,
      icp_summary: contentAnalysis.icp_summary || urlAnalysis.icp_summary,
      target_personas: contentAnalysis.target_personas.length > 0 ? contentAnalysis.target_personas : urlAnalysis.target_personas,
      case_studies: [...contentAnalysis.case_studies, ...urlAnalysis.case_studies],
      lead_magnets: [...contentAnalysis.lead_magnets, ...urlAnalysis.lead_magnets],
      competitive_advantages: [...new Set([...contentAnalysis.competitive_advantages, ...urlAnalysis.competitive_advantages])],
      tech_stack: [...new Set([...contentAnalysis.tech_stack, ...urlAnalysis.tech_stack])],
      social_proof: {
        testimonials: [...contentAnalysis.social_proof.testimonials, ...urlAnalysis.social_proof.testimonials],
        client_logos: [...contentAnalysis.social_proof.client_logos, ...urlAnalysis.social_proof.client_logos],
        metrics: [...contentAnalysis.social_proof.metrics, ...urlAnalysis.social_proof.metrics]
      },
      confidence_score: Math.max(contentAnalysis.confidence_score, urlAnalysis.confidence_score)
    };
  }

  // Browser-free page discovery
  private async discoverPagesNoBrowser(websiteUrl: string): Promise<string[]> {
    const baseUrl = new Url(websiteUrl);
    const discoveredUrls = new Set<string>();
    
    // Add the main URL first
    discoveredUrls.add(websiteUrl);
    
    // Add high-priority pages
    this.addHighPriorityPages(baseUrl, discoveredUrls);

    try {
      // Check robots.txt and sitemap (this works without browser)
      await Promise.race([
        this.checkRobotsAndSitemap(baseUrl.origin, discoveredUrls),
        new Promise(resolve => setTimeout(resolve, 3000)) // Shorter timeout for cloud
      ]);

      // Try to fetch homepage and extract links
      await Promise.race([
        this.extractLinksNoBrowser(websiteUrl, baseUrl, discoveredUrls),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);

    } catch (error) {
      console.error('Error discovering pages (browser-free):', error);
    }

    const urlArray = Array.from(discoveredUrls);
    const prioritizedUrls = this.prioritizeUrls(urlArray, baseUrl);
    
    return prioritizedUrls.slice(0, this.maxPages);
  }

  // Extract links using fetch instead of browser
  private async extractLinksNoBrowser(websiteUrl: string, baseUrl: Url, discoveredUrls: Set<string>): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WebsiteAnalyzer/1.0)'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) return;

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract all links
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = this.resolveUrl(href, baseUrl);
          if (fullUrl && this.isRelevantPage(fullUrl) && this.isSameDomain(fullUrl, baseUrl)) {
            discoveredUrls.add(fullUrl);
          }
        }
      });

    } catch (error) {
      console.error('Error extracting links without browser:', error);
    }
  }

  // Fetch pages using simple HTTP requests
  private async fetchPagesNoBrowser(urls: string[]): Promise<Array<{url: string, content: string, title: string}>> {
    const results: Array<{url: string, content: string, title: string}> = [];
    const urlsToFetch = urls.slice(0, this.maxPages);
    
    console.log(`Starting to fetch ${urlsToFetch.length} pages:`, urlsToFetch);
    
    // Parallel fetching with improved error handling
    const fetchPromises = urlsToFetch.map(async (url, index) => {
      try {
        console.log(`Fetching page ${index + 1}/${urlsToFetch.length}: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`HTTP ${response.status} for ${url}`);
          // Don't throw immediately, try to get what we can
          if (response.status >= 500) {
            throw new Error(`Server error: HTTP ${response.status}`);
          }
          // For 4xx errors, continue but log the issue
          if (response.status >= 400) {
            console.warn(`Client error HTTP ${response.status} for ${url}, skipping`);
            return null;
          }
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract title
        const title = $('title').text().trim() || 
                     $('h1').first().text().trim() || 
                     url.split('/').pop() || 
                     'Untitled Page';

        // Extract main content (remove scripts, styles, etc.)
        $('script, style, nav, footer, header, .nav, .footer, .header, .sidebar, .menu, .navigation, .breadcrumb, .cookie-banner, .popup, .modal').remove();
        
        // Try to get main content in order of preference
        let content = '';
        const contentSelectors = [
          'main',
          '[role="main"]',
          '.main-content',
          '.content',
          '.post-content',
          '.page-content',
          'article',
          '.container',
          'body'
        ];
        
        for (const selector of contentSelectors) {
          const selectorContent = $(selector).text();
          if (selectorContent && selectorContent.length > content.length) {
            content = selectorContent;
            break;
          }
        }
        
        // Clean up content
        content = content.replace(/\s+/g, ' ').trim();

        // More lenient content validation
        if (content.length < 50) {
          console.warn(`Very short content (${content.length} chars) for ${url}: "${content.substring(0, 100)}..."`);
          // Don't reject immediately, let the filter handle it
        }

        console.log(`Successfully fetched ${url}: ${content.length} chars, title: "${title}"`);

        return {
          url,
          title,
          content
        };
        
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
      }
    });

    // Execute with concurrency limit
    const concurrencyLimit = 3; // Reduced to be more respectful
    const batchedResults: Array<{url: string, content: string, title: string} | null> = [];
    
    for (let i = 0; i < fetchPromises.length; i += concurrencyLimit) {
      const batch = fetchPromises.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(batch);
      batchedResults.push(...batchResults);
      
      // Small delay between batches to be respectful
      if (i + concurrencyLimit < fetchPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Filter successful results with more lenient criteria
    const validResults = batchedResults.filter((result): result is {url: string, content: string, title: string} => 
      result !== null && result.content.length > 30 // Reduced from 100 to 30
    );

    console.log(`Fetch results: ${validResults.length} valid out of ${batchedResults.length} total, ${batchedResults.filter(r => r === null).length} failed`);
    
    // Log detailed results for debugging
    validResults.forEach(result => {
      console.log(`✓ ${result.url}: ${result.content.length} chars`);
    });
    
    batchedResults.filter(r => r === null).forEach((_, index) => {
      console.log(`✗ ${urlsToFetch[index]}: failed to fetch`);
    });

    return validResults;
  }
}

// Export utility functions
export async function analyzeWebsiteICP(websiteUrl: string, fast: boolean = true): Promise<ComprehensiveICPAnalysis> {
  // Ensure this function only runs on the server
  if (typeof window !== 'undefined') {
    throw new Error('analyzeWebsiteICP can only be used on the server side');
  }
  
  // Step 1: Normalize and validate the URL
  console.log(`🔍 Starting website analysis for: "${websiteUrl}"`);
  
  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeAndValidateUrl(websiteUrl);
    console.log(`✅ URL normalized: ${websiteUrl} -> ${normalizedUrl}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ URL normalization failed:`, errorMessage);
    throw new Error(`Invalid URL: ${errorMessage}`);
  }
  
  // Step 2: Optional connectivity check (can be disabled to speed up analysis)
  try {
    await validateUrlConnectivity(normalizedUrl);
  } catch (connectivityError) {
    const errorMessage = connectivityError instanceof Error ? connectivityError.message : String(connectivityError);
    console.warn(`⚠️ Connectivity check failed: ${errorMessage}`);
    console.log('Proceeding with analysis despite connectivity warning...');
    // Don't throw here - sometimes sites block HEAD requests but allow analysis
  }
  
  const service = new AIICPService();
  
  try {
    if (fast) {
      // Use optimized fast analysis (6 pages, 15s timeout) with browser fallback
      return await service.analyzeWebsiteFast(normalizedUrl);
    } else {
      // Use comprehensive analysis (15 pages, 30s timeout)
      return await service.analyzeWebsite(normalizedUrl);
    }
  } catch (error) {
    // If comprehensive analysis fails, try browser-free as last resort
    if (!fast) {
      console.warn('Comprehensive analysis failed, trying browser-free fallback');
      try {
        return await service.analyzeWebsiteNoBrowser(normalizedUrl);
      } catch (fallbackError) {
        console.error('All analysis methods failed:', fallbackError);
        throw error; // Throw original error
      }
    } else {
      throw error; // Fast analysis already has fallback built-in
    }
  }
}

// For backwards compatibility - keep the original comprehensive function
export async function analyzeWebsiteICPComprehensive(websiteUrl: string): Promise<ComprehensiveICPAnalysis> {
  return await analyzeWebsiteICP(websiteUrl, false);
} 