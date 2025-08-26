import {Registry} from "@token-ring/registry";
import puppeteer from "puppeteer";
import {z} from "zod";

// Exported tool name in the required format
export const name = "chrome/scrapePageText";

export type ExecuteParams = {
  url?: string;
  timeoutSeconds?: number;
  selector?: string;
};

export type ExecuteResult = {
  text: string;
  sourceSelector: string;
  url: string;
};

export async function execute(
  {url, timeoutSeconds = 30, selector}: ExecuteParams,
  registry: Registry,
): Promise<ExecuteResult> {
  // Validate required parameters
  if (!url) {
    throw new Error(`[${name}] url is required`);
  }

  // Launch Puppeteer browser
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();

  let timeout: NodeJS.Timeout | undefined;
  try {
    // Navigate to the page
    await page.goto(url, {waitUntil: "domcontentloaded", timeout: 20000});

    // Define selectors in priority order
    const defaultSelectors = ["article", "main", "body"];
    let targetSelector = selector;
    let sourceSelector = selector || "custom";

    // If no custom selector provided, find the best available selector
    if (!targetSelector) {
      for (const sel of defaultSelectors) {
        const element = await page.$(sel);
        if (element) {
          targetSelector = sel;
          sourceSelector = sel;
          break;
        }
      }

      // Fallback to body if nothing else found
      if (!targetSelector) {
        targetSelector = "body";
        sourceSelector = "body";
      }
    }

    // Enforce timeout
    timeout = setTimeout(() => {
      throw new Error("Scraping timed out");
    }, Math.max(5, Math.min(timeoutSeconds, 180)) * 1000);

    // Extract text content from the selected element
    const text = await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) {
        throw new Error(`Element with selector "${sel}" not found`);
      }

      // Get text content and clean it up
      return element.textContent
        ?.replace(/\s+/g, " ") // Replace multiple whitespace with single space
        ?.trim() || "";
    }, targetSelector);

    return {
      text,
      sourceSelector,
      url,
    };

  } catch (err: any) {
    throw new Error(`[${name}] ${err?.message || String(err)}`);
  } finally {
    if (timeout) clearTimeout(timeout);
    await browser.close();
  }
}

export const description =
  "Scrape text content from a web page using Puppeteer. By default, it prioritizes content from 'article', 'main', or 'body' tags in that order. Returns the extracted text along with the source selector used." as const;

export const inputSchema = z.object({
  url: z
    .string()
    .describe("The URL of the web page to scrape text from."),
  timeoutSeconds: z
    .number()
    .int()
    .min(5)
    .max(180)
    .describe("(Optional) Timeout for the scraping operation (default 30s, max 180s).")
    .optional(),
  selector: z
    .string()
    .describe("(Optional) Custom CSS selector to target specific content. If not provided, will use 'article', 'main', or 'body' in that priority order.")
    .optional(),
});