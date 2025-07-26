import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { load } from "cheerio";

puppeteer.use(StealthPlugin());

export interface LinkedInProfileData {
  name?: string;
  headline?: string;
  company?: string;
  title?: string;
  location?: string;
  about?: string;
  skills?: string[];
  experiences?: { title: string; company: string; dateRange?: string }[];
  recentPosts?: string[];
}

const SELECTORS = {
  name: "h1",
  headline: ".text-body-medium.break-words",
};

/**
 * Scrape a public LinkedIn profile URL (no authentication). Returns best-effort data.
 * NOTE: Heavily rate-limited; caller should queue & throttle.
 */
export async function scrapeLinkedInProfile(
  url: string,
  opts: { timeoutMs?: number } = {}
): Promise<LinkedInProfileData> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    timeout: opts.timeoutMs ?? 30000,
  });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for name element or fail fast after 10s
    await page.waitForSelector("h1", { timeout: 10000 }).catch(() => {});

    const html = await page.content();
    const $ = load(html);

    const data: LinkedInProfileData = {
      name: $(SELECTORS.name).first().text().trim() || undefined,
      headline: $(SELECTORS.headline).first().text().trim() || undefined,
    };

    // Extract experience section simple version
    data.experiences = [];
    $("#experience-section li").each((_, el) => {
      const title = $(el).find(".t-14.t-black.t-bold").text().trim();
      const company = $(el).find(".t-14.t-black.t-normal").text().trim();
      if (title || company) data.experiences!.push({ title, company });
    });

    // TODO: skills, recentPosts extraction (placeholder)

    return data;
  } finally {
    await browser.close();
  }
} 