import { load } from "cheerio";

export interface CompanyEnrichment {
  description?: string;
  techStackHints?: string[];
  headlines?: { title: string; url: string }[];
  linkedInFollowers?: number;
}

// Simple in-memory cache keyed by website URL
const cache = new Map<string, CompanyEnrichment>();

export async function enrichCompany(
  websiteUrl: string,
  opts: { refresh?: boolean } = {}
): Promise<CompanyEnrichment> {
  if (!opts.refresh && cache.has(websiteUrl)) {
    return cache.get(websiteUrl)!;
  }

  const enrichment: CompanyEnrichment = {};

  // 1. Fetch website HTML and parse meta description & tech hints
  try {
    const res = await fetch(websiteUrl, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
    if (res.ok) {
      const html = await res.text();
      const $ = load(html);
      enrichment.description =
        $("meta[name='description']").attr("content")?.trim() ||
        $("title").first().text().trim();

      // simple tech hints by checking for known scripts/libs
      const techHints: string[] = [];
      const htmlLower = html.toLowerCase();
      if (htmlLower.includes("wp-content")) techHints.push("WordPress");
      if (htmlLower.includes("shopify")) techHints.push("Shopify");
      if (htmlLower.includes("react")) techHints.push("React");
      if (htmlLower.includes("gatsby")) techHints.push("Gatsby");
      if (htmlLower.includes("next")) techHints.push("Next.js");
      if (techHints.length) enrichment.techStackHints = techHints;
    }
  } catch (_) {
    /* ignore */
  }

  // 2. Fetch news headlines via NewsAPI if key present
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  if (NEWS_API_KEY) {
    try {
      const domain = new URL(websiteUrl).hostname.replace(/^www\./, "");
      const newsRes = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(domain)}&pageSize=3&apiKey=${NEWS_API_KEY}`);
      if (newsRes.ok) {
        const json = await newsRes.json();
        if (json.articles) {
          enrichment.headlines = json.articles.map((a: any) => ({ title: a.title, url: a.url }));
        }
      }
    } catch (_) {
      /* ignore */
    }
  }

  // 3. TODO: Fetch LinkedIn follower count via scraping (skipped for now)

  cache.set(websiteUrl, enrichment);
  return enrichment;
} 