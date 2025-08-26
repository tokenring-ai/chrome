import {Registry} from "@token-ring/registry";
import puppeteer from "puppeteer";
import {z} from "zod";

// Exported tool name in the required format
export const name = "chrome/runPuppeteerScript";

export type ExecuteParams = {
  script?: string;
  navigateTo?: string;
  timeoutSeconds?: number;
};

export type ExecuteResult = {
  result: unknown;
  logs: string[];
};

export async function execute(
  {script, navigateTo, timeoutSeconds = 30}: ExecuteParams,
  _registry: Registry,
): Promise<ExecuteResult> {
  // Validate required parameters
  if (!script) {
    throw new Error(`[${name}] script is required`);
  }

  // Launch Puppeteer browser (headless mode can be adjusted as needed)
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  const logs: string[] = [];

  function consoleLog(...args: unknown[]) {
    logs.push(
      args
        .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
        .join(" "),
    );
  }

  page.on("console", (msg) => {
    logs.push(`[browser] ${msg.type()}: ${msg.text()}`);
  });

  let result: unknown = null;
  let timeout: NodeJS.Timeout | undefined;
  try {
    if (navigateTo) {
      await page.goto(navigateTo, {waitUntil: "load", timeout: 20000});
    }

    // Build a wrapper function to evaluate the user script with context
    const asyncScriptWrapper = `(async () => {\n  const userFn = ${script}\n  return await userFn({ page, browser, consoleLog });\n})();`;

    const fn = new Function(
      "page",
      "browser",
      "consoleLog",
      `return ${asyncScriptWrapper}`,
    ) as (
      page: puppeteer.Page,
      browser: puppeteer.Browser,
      consoleLog: (...args: unknown[]) => void,
    ) => Promise<unknown>;

    // Enforce script timeout
    timeout = setTimeout(() => {
      throw new Error("Script timed out");
    }, Math.max(5, Math.min(timeoutSeconds, 180)) * 1000);

    result = await fn(page, browser, consoleLog);
  } catch (err: any) {
    // Throw errors with the required prefix instead of returning them
    throw new Error(`[${name}] ${err?.message || String(err)}`);
  } finally {
    if (timeout) clearTimeout(timeout);
    await browser.close();
  }

  // Return successful execution result
  return {
    result,
    logs,
  };
}

export const description =
  "Run a Puppeteer script with access to a browser and page. Accepts a JavaScript function or module as a string, executes it with Puppeteer page instance, and returns the result." as const;

export const inputSchema = z.object({
  script: z
    .string()
    .describe(
      "A JavaScript code string to run. It should export or define an async function to be called with ({ page, browser, consoleLog }) as arguments. The return value will be returned as output.",
    ),
  navigateTo: z
    .string()
    .describe("(Optional) Page URL to navigate to before executing the script.")
    .optional(),
  timeoutSeconds: z
    .number()
    .int()
    .min(5)
    .max(180)
    .describe("(Optional) Timeout for script execution (default 30s, max 180).")
    .optional(),
});
