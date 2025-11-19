@tokenring-ai/chrome

Overview

- @tokenring-ai/chrome provides Chrome browser automation utilities for the Token Ring ecosystem. It exposes a tool to
  run
  arbitrary Puppeteer scripts within a managed browser/page context and report results and console logs back through the
  chat service.

What this package offers

- A Token Ring tool: tools.runPuppeteerScript
- Lets you provide a JavaScript function as a string to be executed in a live Puppeteer session.
- Optionally navigates to a URL before execution.
- Captures page console output and any custom logs you emit via a provided consoleLog helper.
- Returns the result of your function along with the collected logs and an ok/error flag.

Exports

- index.ts
- name, version, description (from package.json)
- tools (namespace) re-export
- tools
- runPuppeteerScript (tools/runPuppeteerScript.ts)

Installation
This package is part of the monorepo and is typically consumed by the Token Ring runtime. If you need to depend on it
directly:

- Add dependency: "@tokenring-ai/chrome": "0.1.0"
- Ensure peer packages are available in your workspace: @tokenring-ai/registry, @tokenring-ai/chat.
- Puppeteer is declared as a dependency here and will be installed; the tool dynamically launches a browser when
  invoked.

Tool: runPuppeteerScript

- File: pkg/chrome/tools/runPuppeteerScript.ts
- Description: Run a Puppeteer script with access to a browser and page. Accepts a JavaScript function (as a string),
  executes it in context with ({ page, browser, consoleLog }), and returns the result.
- Parameters (Zod schema):
- script: string
- A JavaScript code string that evaluates to an async function taking ({ page, browser, consoleLog }). The return
  value is surfaced in the tool result.
- navigateTo?: string
- Optional URL to load before running the script.
- timeoutSeconds?: number (min 5, max 180; default 30)
- Maximum time to allow the script to run before timing out.
- Return shape:
  {
  ok: boolean;
  result: unknown; // value your function resolves to
  logs: string[]; // collected console output and custom consoleLog messages
  error: unknown; // error message if any
  }

Usage (programmatic example)

import { ServiceRegistry } from "@tokenring-ai/registry";
import * as runPuppeteerScript from "@tokenring-ai/chrome/tools/runPuppeteerScript";
import ChatService from "@tokenring-ai/chat/ChatService";

const registry = new ServiceRegistry();
// Ensure a ChatService implementation is registered so the tool can log errors/info
registry.registerService(new ChatService()); // or your concrete ChatService

// Define your script as a string that evaluates to an async function
const script = `async ({ page, browser, consoleLog }) => {
  await page.goto('https://example.com', { waitUntil: 'load' });
  const title = await page.title();
  consoleLog('Page title is:', title);
  return { title };
}`;

const res = await runPuppeteerScript.execute({ script }, registry);
if (res.ok) {
console.log('Result:', res.result);
console.log('Logs:', res.logs);
} else {
console.error('Error:', res.error);
}

Notes

- The tool launches a Chromium instance via Puppeteer with headless: false by default so you can observe execution.
  Adjusting headless behavior would require modifying tools/runPuppeteerScript.ts.
- The script you pass is evaluated using new Function and immediately invoked. Ensure you trust the code, as it runs
  with the same privileges as your process.
- Console messages from the page are collected and returned with a [browser] prefix. Use the provided consoleLog
  function within your script to add custom log lines that are guaranteed to be captured.
- The timeoutSeconds parameter bounds the total execution time of your function; long-running interactions should
  increase it within the allowed range.

License

- MIT (same as the repository license).