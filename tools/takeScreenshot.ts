import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition, type TokenRingToolMediaResult} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import ChromeService from "../ChromeService.ts";

const name = "chrome_takeScreenshot";
const displayName = "Chrome/takeScreenshot";

async function execute(
  {url, screenWidth = 1024}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolMediaResult> {
  const chromeService = agent.requireServiceByType(ChromeService);
  const browser = await chromeService.getBrowser(agent);
  const page = await browser.newPage();

  try {
    // Set the viewport size
    await page.setViewport({
      width: screenWidth,
      height: 768, // Default height, will capture full page if needed but typically 1:1 view is fine
      deviceScaleFactor: 1,
    });

    // Navigate to the page
    await page.goto(url, {waitUntil: "networkidle2", timeout: 20000});

    // Take the screenshot as base64
    const screenshotBase64 = await page.screenshot({
      encoding: "base64",
      type: "png",
      fullPage: false // Captures the current viewport
    });

    return {
      type: 'media',
      mediaType: 'image/png',
      data: screenshotBase64,
    };

  } catch (err: any) {
    throw new Error(`[${name}] ${err?.message || String(err)}`);
  } finally {
    await browser.close();
  }
}

const description =
  "Captures a visual screenshot of a web page at a specific width. Returns the image as base64 data." as const;

const inputSchema = z.object({
  url: z
    .string()
    .describe("The URL of the web page to screenshot."),
  screenWidth: z
    .number()
    .int()
    .min(300)
    .max(1024)
    .default(1024)
    .describe("The width of the browser viewport in pixels (min 300, max 1024)."),
});

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;