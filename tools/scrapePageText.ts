import type Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingToolDefinition, TokenRingToolResult} from "@tokenring-ai/chat/schema";
import TurndownService from "turndown";
import {z} from "zod";
import ChromeService from "../ChromeService.ts";

const name = "chrome_scrapePageText";
const displayName = "Chrome/scrapePageText";

export type ExecuteResult = {
  text: string;
  sourceSelector: string;
  url: string;
};

async function execute(
  {url, timeoutSeconds = 30, selector}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolResult> {
  const chromeService = agent.requireServiceByType(ChromeService);
  const browser = await chromeService.getBrowser(agent);
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: timeoutSeconds * 1000,
    });

    let html: string;

    if (selector) {
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`No element found matching selector: ${selector}`);
      }
      html = await page.evaluate((el) => el.outerHTML, element);
    } else {
      for (const fallback of ["article", "main", "body"]) {
        const element = await page.$(fallback);
        if (element) {
          html = await page.evaluate((el) => el.outerHTML, element);
          break;
        }
      }
      html ??= await page.content();
    }

    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(html);
    return {
      result: `Extracted markdown from ${url} using selector: ${selector || "auto-detected"}\n${markdown}`,
      attachments: [
        {
          name: "extracted_text.md",
          mimeType: "text/markdown",
          encoding: "text",
          body: turndownService.turndown(html),
        }
      ]
    };
  } finally {
    await page.close();
    await browser.disconnect();
  }
}

const description =
  "Scrape text content from a web page using Puppeteer. By default, it prioritizes content from 'article', 'main', or 'body' tags in that order. Returns the extracted text along with the source selector used." as const;

const inputSchema = z.object({
  url: z.string().describe("The URL of the web page to scrape text from."),
  timeoutSeconds: z
    .number()
    .int()
    .min(5)
    .max(180)
    .describe(
      "(Optional) Timeout for the scraping operation (default 30s, max 180s).",
    )
    .optional(),
  selector: z
    .string()
    .describe(
      "(Optional) Custom CSS selector to target specific content. If not provided, will use 'article', 'main', or 'body' in that priority order.",
    )
    .optional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
