import ChatService from "@token-ring/chat/ChatService";
import puppeteer from "puppeteer";
import { z } from "zod";
import {Registry} from "@token-ring/registry";

export type ExecuteParams = {
	script?: string;
	navigateTo?: string;
	timeoutSeconds?: number;
};

export type ExecuteResult = {
	ok: boolean;
	result: unknown;
	logs: string[];
	error: unknown;
};

export async function execute(
	{ script, navigateTo, timeoutSeconds = 30 }: ExecuteParams,
	registry: Registry,
): Promise<ExecuteResult> {
	const chatService = registry.requireFirstServiceByType(ChatService);
	// We use dynamic import for puppeteer to avoid a hard dependency unless required

	const browser = await puppeteer.launch({ headless: false }); // "new" });
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
	let error: unknown = null;
	let timeout: NodeJS.Timeout | undefined;
	try {
		if (navigateTo) {
			await page.goto(navigateTo, { waitUntil: "load", timeout: 20000 });
		}
		// Build a wrapper function to eval the user script with context
		const asyncScriptWrapper = `(async () => {\n  const userFn = ${script}\n  return await userFn({ page, browser, consoleLog });\n})();`;

		const fn = new Function(
			"page",
			"browser",
			"consoleLog",
			`return ${asyncScriptWrapper}`,
		) as (page: any, browser: any, consoleLog: (...args: unknown[]) => void) => Promise<unknown>;
		timeout = setTimeout(
			() => {
				throw new Error("Script timed out");
			},
			Math.max(5, Math.min(timeoutSeconds, 180)) * 1000,
		);
		result = await fn(page, browser, consoleLog);
	} catch (err: any) {
		error = err?.message || String(err);
		chatService.errorLine("Error executing Puppeteer script:", error );
	} finally {
		if (timeout) clearTimeout(timeout);
		await browser.close();
	}
	return {
		ok: !error,
		result,
		logs,
		error,
	};
}

export const description =
	"Run a Puppeteer script with access to a browser and page. Accepts a JavaScript function or module as a string, executes it with Puppeteer page instance, and returns the result." as const;

export const parameters = z.object({
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
