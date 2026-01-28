import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition, type TokenRingToolJSONResult} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import ChromeService from "../ChromeService.ts";

const name = "chrome_scrapePageMetadata";
const displayName = "Chrome/scrapePageMetadata";

export type ExecuteResult = {
  headHtml: string;
  jsonLd: any[];
  url: string;
};

async function execute(
  {url, timeoutSeconds = 30}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolJSONResult<any>> {
  if (!url) {
    throw new Error(`[${name}] url is required`);
  }

  const chromeService = agent.requireServiceByType(ChromeService);
  const browser = await chromeService.getBrowser(agent);
  const page = await browser.newPage();

  let timeout: NodeJS.Timeout | undefined;
  try {
    await page.goto(url, {waitUntil: "domcontentloaded", timeout: 20000});

    timeout = setTimeout(() => {
      throw new Error("Metadata scraping timed out");
    }, Math.max(5, Math.min(timeoutSeconds, 180)) * 1000);

    const metadata = await page.evaluate(() => {
      // Clone head to manipulate it without affecting the live page
      const headClone = document.head.cloneNode(true) as HTMLHeadElement;

      // Remove content from <style> and <script> tags (except JSON-LD)
      const scripts = headClone.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.type !== 'application/ld+json') {
          script.textContent = '[ omitted for brevity ]'; // Keep the tag/attributes but remove the code
        }
      });

      const styles = headClone.querySelectorAll('style');
      styles.forEach(style => {
        style.textContent = '[ omitted for brevity ]'; // Remove CSS rules
      });

      const headHtml = headClone.innerHTML;

      // Extract and parse all JSON-LD blocks from the actual document
      const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const jsonLd = jsonLdScripts.map(script => {
        try {
          return JSON.parse(script.textContent || "{}");
        } catch (e) {
          return { error: "Failed to parse JSON-LD", content: script.textContent };
        }
      });

      return {
        type: "json",
        data: {
          headHtml,
          jsonLd
        }
      };
    });

    return {
      type: "json",
      data: {
        ...metadata,
        url,
      }
    };

  } catch (err: any) {
    throw new Error(`[${name}] ${err?.message || String(err)}`);
  } finally {
    if (timeout) clearTimeout(timeout);
    await browser.close();
  }
}

const description =
  "Loads a web page and extracts metadata from the <head> tag and any JSON-LD (Schema.org) blocks found in the document. This is useful for SEO analysis and extracting structured data." as const;

const inputSchema = z.object({
  url: z
    .string()
    .describe("The URL of the web page to scrape metadata from."),
  timeoutSeconds: z
    .number()
    .int()
    .min(5)
    .max(180)
    .describe("(Optional) Timeout for the operation (default 30s).")
    .optional(),
});

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;