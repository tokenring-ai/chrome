# @tokenring-ai/chrome

Chrome browser automation for Token Ring via Puppeteer, providing web search, web scraping, and screenshot capabilities.

## Overview

The `@tokenring-ai/chrome` package offers Chrome browser automation through Puppeteer, integrating with Token Ring's service and tool system. It enables AI agents to perform Google web searches, check Google News, extract content from web pages, and capture visual screenshots in a headless browser environment.

### Key Features

- Puppeteer-based headless Chrome browser automation
- Google web search integration via DOM parsing
- Google News search with article metadata extraction
- Web page scraping with HTML to Markdown conversion
- Page metadata extraction including JSON-LD structured data
- Visual screenshot capture with configurable viewport dimensions
- Browser lifecycle management (launch vs connect)
- Support for rendered and non-rendered page fetching
- Agent state management for browser configuration
- Custom Puppeteer script execution tool

## Installation

```bash
bun install @tokenring-ai/chrome
```

## Configuration

### ChromeConfigSchema

```typescript
export const ChromeConfigSchema = z.object({
  agentDefaults: z.object({
    launch: z.boolean().default(true),
    headless: z.boolean().default(true),
    browserWSEndpoint: z.string().optional(),
    executablePath: z.string().optional(),
    screenshot: z.object({
      maxPixels: z.number().default(1000000),
    }).prefault({}),
  }).prefault({}),
});
```

### ChromeAgentConfigSchema

```typescript
export const ChromeAgentConfigSchema = z.object({
  launch: z.boolean().optional(),
  headless: z.boolean().optional(),
  browserWSEndpoint: z.string().optional(),
  executablePath: z.string().optional(),
  screenshot: z.object({
    maxPixels: z.number().optional(),
  }).optional(),
}).default({});
```

### Example Configuration

```json
{
  "chrome": {
    "agentDefaults": {
      "launch": true,
      "headless": true,
      "screenshot": {
        "maxPixels": 1000000
      }
    }
  }
}
```

**Configuration Notes:**

- `launch: true` - Creates a new Puppeteer browser instance for each operation
- `launch: false` - Connects to an existing browser session (for production use with remote browser)
- `headless: true` - Runs browser in headless mode (default)
- `headless: false` - Runs browser with visible UI (useful for debugging)
- `browserWSEndpoint` - WebSocket endpoint for connecting to an existing browser (e.g., `ws://localhost:9222/devtools/browser`)
- `executablePath` - Custom path to Chrome/Chromium executable
- `screenshot.maxPixels` - Maximum total pixels for screenshot viewport calculation (default: 1000000)

## Core Components

### ChromeService

Main service implementation that manages browser lifecycle and provides browser instances to other components. Implements the `TokenRingService` interface.

**Class Definition:**

```typescript
import ChromeService from "@tokenring-ai/chrome";

const chromeService = new ChromeService({
  agentDefaults: {
    launch: true,
    headless: true,
    screenshot: {
      maxPixels: 1000000
    }
  }
});
```

**Interface:**

```typescript
interface TokenRingService {
  name: string;
  description: string;
  attach(agent: Agent): void;
}
```

**Properties:**

- `name: "ChromeService"` - Service identifier
- `description: "Chrome browser automation service"` - Service description

**Public Methods:**

```typescript
attach(agent: Agent): void
```

Attaches the ChromeService to an agent. Merges the default configuration (`agentDefaults`) with agent-specific configuration from `agent.getAgentConfigSlice('chrome', ChromeAgentConfigSchema)` using `deepMerge` from `@tokenring-ai/utility`, then initializes agent state using `ChromeState`.

```typescript
async getBrowser(agent: Agent): Promise<Browser>
```

Manages browser lifecycle based on agent state configuration:
- If `state.launch === true`: Creates new Puppeteer browser instance via `puppeteer.launch(state as LaunchOptions)`
- If `state.launch === false`: Connects to existing browser session via `puppeteer.connect(state as ConnectOptions)`
- Returns browser instance for the operation

**Constructor Parameters:**

- `options: ChromeConfigSchema` - Configuration object containing `agentDefaults`

### ChromeState

Agent state slice for managing Chrome browser configuration and persistence. Extends `AgentStateSlice` from `@tokenring-ai/agent`.

**Class Definition:**

```typescript
import {ChromeState} from "@tokenring-ai/chrome";

const state = new ChromeState({
  launch: true,
  headless: true,
  browserWSEndpoint: undefined,
  executablePath: undefined,
  screenshot: {
    maxPixels: 1000000
  }
});
```

**Properties:**

- `launch: boolean` - Whether to launch a new browser instance
- `headless: boolean` - Whether to run browser in headless mode
- `browserWSEndpoint?: string` - WebSocket endpoint for connecting to existing browser
- `executablePath?: string` - Custom path to Chrome/Chromium executable
- `screenshot: { maxPixels: number }` - Maximum pixels for viewport calculation

**Constructor Parameters:**

- `initialConfig: z.output<typeof ChromeConfigSchema>["agentDefaults"]` - Initial configuration object

**Methods:**

```typescript
serialize(): z.output<typeof serializationSchema>
```

Returns serialized state for persistence. Returns object with `launch`, `headless`, `browserWSEndpoint`, `executablePath`, and `screenshot`.

```typescript
deserialize(data: z.output<typeof serializationSchema>): void
```

Restores state from serialized data. Updates all properties from the provided data.

```typescript
show(): string[]
```

Returns a formatted string array representation of the state:
- `"Launch: true/false"`
- `"Headless: true/false"`
- `"Browser WS Endpoint: endpoint or N/A"`
- `"Executable Path: path or N/A"`

```typescript
reset(): void
```

Reset state (currently a no-op implementation).

**Serialization Schema:**

```typescript
const serializationSchema = z.object({
  launch: z.boolean(),
  headless: z.boolean(),
  browserWSEndpoint: z.string().optional(),
  executablePath: z.string().optional(),
  screenshot: z.object({
    maxPixels: z.number()
  })
});
```

### ChromeWebSearchProvider

Main provider implementation extending `WebSearchProvider` from `@tokenring-ai/websearch`. Handles browser automation for search and content retrieval.

**Class Definition:**

```typescript
import ChromeWebSearchProvider from "@tokenring-ai/chrome";

const provider = new ChromeWebSearchProvider(chromeService);
```

**Constructor Parameters:**

- `chromeService: ChromeService` - The ChromeService instance for browser lifecycle management

**Public Methods:**

```typescript
async searchWeb(query: string, options?: WebSearchProviderOptions, agent?: Agent): Promise<WebSearchResult>
```

Performs Google web search via Puppeteer browser. Returns organic search results with title, link, and snippet in order of appearance.

**Search URL Construction:**
- Base: `https://www.google.com/search?q={encoded query}`
- With country code: `&gl={countryCode}` if provided

**Result Parsing:**
- Uses `[data-ved] h3` selectors for result titles
- Uses `[data-sncf]` for snippets
- Extracts link from closest anchor element

**Browser Lifecycle:** Creates new page, performs search, then calls `page.close()` and `browser.disconnect()` in finally block.

**Parameters:**
- `query: string` - Search query string
- `options?: WebSearchProviderOptions` - Optional configuration including `countryCode`
- `agent: Agent` - **Required** - Agent instance for browser access

**Returns:** `WebSearchResult` with `organic` array containing results with `position`, `title`, `link`, and `snippet`

**Throws:** Error if agent is not provided

```typescript
async searchNews(query: string, options?: WebSearchProviderOptions, agent?: Agent): Promise<NewsSearchResult>
```

Performs Google News search via Puppeteer browser. Returns array of news articles with metadata.

**Search URL Construction:**
- Base: `https://www.google.com/search?q={encoded query}&tbm=nws`
- With country code: `&gl={countryCode}` if provided

**Result Parsing:**
- Uses `[data-news-doc-id]` selectors for article containers
- Extracts title from `[role="heading"]` or `[aria-level]` elements
- Extracts link from `a[data-ved]` elements
- Extracts snippet from text content in divs (excluding specific data attributes)
- Extracts source from spans near images
- Extracts timestamp from `[data-ts]` or adjacent spans

**Browser Lifecycle:** Creates new page, performs search, then calls `page.close()` and `browser.disconnect()` in finally block.

**Parameters:**
- `query: string` - News search query string
- `options?: WebSearchProviderOptions` - Optional configuration including `countryCode`
- `agent: Agent` - **Required** - Agent instance for browser access

**Returns:** `NewsSearchResult` with `news` array containing results with `position`, `title`, `link`, `snippet`, `source`, and `date`

**Throws:** Error if agent is not provided

```typescript
async fetchPage(url: string, options?: WebPageOptions, agent?: Agent): Promise<WebPageResult>
```

Scrapes web page content using Puppeteer browser. Converts HTML to Markdown using TurndownService.

**Page Loading:**
- If `options?.render === true`: Waits for `networkidle0` (fully rendered with JavaScript)
- If `options?.render === false` or undefined: Waits for `domcontentloaded` (static HTML only)

**Content Processing:**
- Extracts full page HTML using `page.content()`
- Converts to Markdown using `TurndownService`

**Browser Lifecycle:** Creates new page, fetches content, then calls `page.close()` and `browser.disconnect()` in finally block.

**Parameters:**
- `url: string` - URL of the page to fetch
- `options?: WebPageOptions` - Optional configuration including `render` boolean
- `agent: Agent` - **Required** - Agent instance for browser access

**Returns:** `WebPageResult` with `markdown` string containing the converted content

**Throws:** Error if agent is not provided

## Tools

The package provides the following tools for agent use:

### chrome_scrapePageText

Web page text scraping tool that converts page content to Markdown. By default, it prioritizes content from 'article', 'main', or 'body' tags in that order.

**Tool Definition:**

```typescript
{
  name: "chrome_scrapePageText",
  displayName: "Chrome/scrapePageText",
  description: "Scrape text content from a web page using Puppeteer. By default, it prioritizes content from 'article', 'main', or 'body' tags in that order. Returns the extracted text along with the source selector used.",
  inputSchema: {
    url: string,
    timeoutSeconds?: number,
    selector?: string
  }
}
```

**Parameters:**

- `url` (required): The URL of the web page to scrape text from
- `timeoutSeconds` (optional): Timeout for the scraping operation (default 30s, min 5s, max 180s)
- `selector` (optional): Custom CSS selector to target specific content. If not provided, will use 'article', 'main', or 'body' in that priority order.

**Output:** Returns text result with `type: 'text'` containing the page content converted to Markdown

**Usage Example:**

```typescript
const result = await agent.callTool("chrome_scrapePageText", {
  url: "https://example.com/article",
  timeoutSeconds: 30
});

console.log(result.text); // Markdown content
```

**Implementation Details:**

- Uses ChromeService for browser management via `agent.requireServiceByType(ChromeService)`
- Waits for `domcontentloaded` event before extracting content (not `networkidle0`)
- Extracts full page HTML using `page.content()`
- Converts to Markdown using `TurndownService`
- Browser is **disconnected** (not closed) after each operation via `browser.disconnect()`
- Enforces timeout on operation (max 180s, min 5s)
- Returns `TokenRingToolTextResult` with `type: 'text'` and `text` property

### chrome_scrapePageMetadata

Extracts metadata from web pages including HTML head and JSON-LD structured data. Useful for SEO analysis and extracting structured data.

**Tool Definition:**

```typescript
{
  name: "chrome_scrapePageMetadata",
  displayName: "Chrome/scrapePageMetadata",
  description: "Loads a web page and extracts metadata from the <head> tag and any JSON-LD (Schema.org) blocks found in the document. This is useful for SEO analysis and extracting structured data.",
  inputSchema: {
    url: string,
    timeoutSeconds?: number
  }
}
```

**Parameters:**

- `url` (required): The URL of the web page to scrape metadata from
- `timeoutSeconds` (optional): Timeout for the operation (default 30s, min 5s, max 180s)

**Output:** Returns JSON result with `type: 'json'` containing:
- `headHtml`: String containing the cleaned HTML of the `<head>` element
- `jsonLd`: Array of parsed JSON-LD objects (Schema.org structured data)
- `url`: The URL that was scraped

**Usage Example:**

```typescript
const result = await agent.callTool("chrome_scrapePageMetadata", {
  url: "https://example.com/article",
  timeoutSeconds: 30
});

console.log(result.data.headHtml); // Cleaned head HTML
console.log(result.data.jsonLd); // Array of JSON-LD objects
console.log(result.data.url); // Original URL
```

**Implementation Details:**

- Uses ChromeService for browser management via `agent.requireServiceByType(ChromeService)`
- Waits for `domcontentloaded` event before extracting metadata
- Clones the `<head>` element to avoid modifying the live page
- Removes content from `<style>` and `<script>` tags (except JSON-LD) to reduce size
- Extracts all `<script type="application/ld+json">` blocks and parses them as JSON
- Handles parsing errors gracefully, returning error objects for invalid JSON
- Enforces timeout on operation (max 180s, min 5s)
- Browser is **closed** (not disconnected) after operation completion via `browser.close()`
- Returns `TokenRingToolJSONResult` with `type: 'json'` and `data` property

### chrome_takeScreenshot

Captures visual screenshots of web pages with configurable viewport dimensions. Returns the image as base64-encoded PNG data.

**Tool Definition:**

```typescript
{
  name: "chrome_takeScreenshot",
  displayName: "Chrome/takeScreenshot",
  description: "Captures a visual screenshot of a web page at a specific width. Returns the image as base64 data.",
  inputSchema: {
    url: string,
    screenWidth?: number
  }
}
```

**Parameters:**

- `url` (required): The URL of the web page to screenshot
- `screenWidth` (optional): The width of the browser viewport in pixels (min 300, max 1024, default 1024)

**Output:** Returns media result with `type: 'media'`, `mediaType: 'image/png'`, and `data` containing base64-encoded PNG image

**Usage Example:**

```typescript
const result = await agent.callTool("chrome_takeScreenshot", {
  url: "https://example.com",
  screenWidth: 1024
});

// Save to file
import fs from 'fs';
fs.writeFileSync('screenshot.png', result.data, 'base64');
```

**Implementation Details:**

- Uses ChromeService for browser management via `agent.requireServiceByType(ChromeService)`
- Reads `screenshot.maxPixels` from agent state (`ChromeState`) to calculate viewport height
- Calculates viewport height as: `height = Math.floor(config.screenshot.maxPixels / screenWidth)`
- Sets viewport with `deviceScaleFactor: 1` for 1:1 pixel ratio
- Waits for `networkidle2` before capturing screenshot (network activity has mostly stopped)
- Captures only the visible viewport (not full page) with `fullPage: false`
- Returns screenshot as base64-encoded PNG
- Browser is **closed** (not disconnected) after operation completion via `browser.close()`
- Returns `TokenRingToolMediaResult` with `type: 'media'`, `mediaType: 'image/png'`, and `data` property

### chrome_runPuppeteerScript

Execute custom Puppeteer scripts with access to page and browser instances. This tool launches its own browser independently of ChromeService.

**Tool Definition:**

```typescript
{
  name: "chrome_runPuppeteerScript",
  displayName: "Chrome/runPuppeteerScript",
  description: "Run a Puppeteer script with access to a browser and page. Accepts a JavaScript function or module as a string, executes it with Puppeteer page instance, and returns the result.",
  inputSchema: {
    script: string,
    navigateTo?: string,
    timeoutSeconds?: number
  }
}
```

**Parameters:**

- `script` (required): JavaScript code string to run. It should export or define an async function to be called with `({ page, browser, consoleLog })` as arguments. The return value will be returned as output.
- `navigateTo` (optional): Page URL to navigate to before executing the script
- `timeoutSeconds` (optional): Timeout for script execution (default 30s, min 5s, max 180s)

**Output:** Returns JSON result with `type: 'json'` containing:
- `result`: The return value from the executed script
- `logs`: Array of log strings from `consoleLog` calls and browser console events

**Usage Example:**

```typescript
const result = await agent.callTool("chrome_runPuppeteerScript", {
  script: `(async ({ page, browser, consoleLog }) => {
    consoleLog('Starting Puppeteer script...');
    await page.goto('https://example.com');
    const title = await page.title();
    consoleLog('Page title:', title);
    const links = await page.$$eval('a', links => links.map(l => l.href));
    consoleLog('Found', links.length, 'links');
    return { title, linkCount: links.length };
  })`,
  navigateTo: 'https://example.com',
  timeoutSeconds: 30
});

console.log('Result:', result.data.result);
console.log('Logs:', result.data.logs);
```

**Script Function Signature:**

The script should define or export an async function that accepts:
- `page`: Puppeteer Page instance for navigation and interaction
- `browser`: Puppeteer Browser instance for browser-level operations
- `consoleLog`: Custom logging function that captures output to the `logs` array

**Implementation Details:**

- **Launches its own browser** with `puppeteer.launch({headless: false})` - does NOT use ChromeService
- Browser is launched in visible mode (`headless: false`) for debugging purposes
- Creates new page via `browser.newPage()`
- Provides `consoleLog` function that captures arguments as space-separated strings
- Listens to `page.on('console')` events and captures browser console output with `[browser] type: message` format
- If `navigateTo` is provided, navigates to URL with `waitUntil: 'load'` and 20s timeout
- Wraps user script in async IIFE and executes with `page`, `browser`, and `consoleLog` context
- Enforces timeout on script execution (max 180s, min 5s) using `setTimeout`
- Catches errors and throws with `[chrome_runPuppeteerScript]` prefix
- Browser is **closed** (not disconnected) after operation completion via `browser.close()`
- Returns `ExecuteResult` wrapped in `TokenRingToolJSONResult` with `type: 'json'`
- **Important:** This tool operates independently of ChromeService and agent configuration

## Services

The package provides the following service implementation:

### ChromeService

The `ChromeService` class implements the `TokenRingService` interface and provides browser lifecycle management for Puppeteer automation.

**Interface:**

```typescript
interface TokenRingService {
  name: string;
  description: string;
  attach(agent: Agent): void;
}
```

**Properties:**

- `name: "ChromeService"` - Service identifier
- `description: "Chrome browser automation service"` - Service description

**Constructor:**

```typescript
constructor(options: ChromeConfigSchema)
```

- `options`: Configuration object containing `agentDefaults` with browser launch/connection settings

**Public Methods:**

```typescript
attach(agent: Agent): void
```

Attaches the service to an agent. Merges `agentDefaults` from constructor options with agent-specific configuration retrieved via `agent.getAgentConfigSlice('chrome', ChromeAgentConfigSchema)` using `deepMerge` from `@tokenring-ai/utility`. Then initializes agent state using `ChromeState` with the merged configuration.

```typescript
async getBrowser(agent: Agent): Promise<Browser>
```

Retrieves a browser instance based on agent state configuration:
- Gets state via `agent.getState(ChromeState)`
- If `state.launch === true`: Launches new browser via `puppeteer.launch(state as LaunchOptions)`
- If `state.launch === false`: Connects to existing browser via `puppeteer.connect(state as ConnectOptions)`
- Returns the browser instance

**Usage:**

```typescript
import ChromeService from "@tokenring-ai/chrome";

const chromeService = new ChromeService({
  agentDefaults: {
    launch: true,
    headless: true,
    screenshot: {
      maxPixels: 1000000
    }
  }
});

// Add to app
app.addServices(chromeService);

// Access in agent context
const browser = await chromeService.getBrowser(agent);
```

## Providers

The package provides the following provider implementations:

### ChromeWebSearchProvider

The `ChromeWebSearchProvider` class extends `WebSearchProvider` from `@tokenring-ai/websearch` and implements search functionality using Chrome/Puppeteer browser automation.

**Constructor:**

```typescript
constructor(chromeService: ChromeService)
```

- `chromeService`: The ChromeService instance for browser lifecycle management

**Key Methods:**

```typescript
async searchWeb(query: string, options?: WebSearchProviderOptions, agent?: Agent): Promise<WebSearchResult>
```

Performs Google web search via Puppeteer. Returns organic search results with title, link, and snippet. Uses `[data-ved] h3` selectors for results and `[data-sncf]` for snippets. Browser is disconnected after each request. **Requires agent parameter.**

```typescript
async searchNews(query: string, options?: WebSearchProviderOptions, agent?: Agent): Promise<NewsSearchResult>
```

Performs Google News search via Puppeteer. Returns news articles with metadata (title, snippet, source, date). Parses article containers using `[data-news-doc-id]` attribute. Browser is disconnected after each request. **Requires agent parameter.**

```typescript
async fetchPage(url: string, options?: WebPageOptions, agent?: Agent): Promise<WebPageResult>
```

Scrapes web page content using Puppeteer. Converts HTML to Markdown using TurndownService. Supports rendered (`networkidle0`) and non-rendered (`domcontentloaded`) fetching. Browser is disconnected after each request. **Requires agent parameter.**

**Important:** All methods require an `Agent` parameter. If no agent is provided, they throw an error: `"Agent required for ChromeWebSearchProvider"`

**Registration:**

The provider is registered with the `WebSearchService` via the plugin system:

```typescript
app.waitForService(WebSearchService, websearchService => {
  websearchService.registerProvider('chrome', new ChromeWebSearchProvider(chromeService));
});
```

**Usage:**

```typescript
import {WebSearchService} from "@tokenring-ai/websearch";

const websearchService = app.requireService(WebSearchService);
const results = await websearchService.search('your query', 'chrome');
```

## Usage Examples

### Basic Web Search

```typescript
import ChromeWebSearchProvider from "@tokenring-ai/chrome";
import ChromeService from "@tokenring-ai/chrome";

const chromeService = new ChromeService({
  agentDefaults: {
    launch: true,
    headless: true,
    screenshot: {
      maxPixels: 1000000
    }
  }
});

const provider = new ChromeWebSearchProvider(chromeService);

// Perform a web search (requires agent)
const results = await provider.searchWeb('TypeScript documentation', {
  countryCode: 'us'
}, agent);

console.log('Organic results:', results.organic.map(r => r.title));
console.log('Result count:', results.organic.length);

// Access individual results
results.organic.forEach(result => {
  console.log(`${result.position}. ${result.title}`);
  console.log(`   Link: ${result.link}`);
  console.log(`   Snippet: ${result.snippet}`);
});
```

### Google News Search

```typescript
// Search for recent news (requires agent)
const news = await provider.searchNews('artificial intelligence', {
  countryCode: 'us'
}, agent);

console.log('News articles:', news.news.length);

news.news.forEach(article => {
  console.log(`\`${article.title}\``);
  console.log(`  Source: ${article.source}`);
  console.log(`  Date: ${article.date}`);
  console.log(`  Snippet: ${article.snippet}`);
});
```

### Page Content Retrieval

```typescript
// Scrape web page content (requires agent)
const pageContent = await provider.fetchPage('https://example.com/article', {
  render: true
}, agent);

console.log(pageContent.markdown.substring(0, 200) + '...');
// Returns markdown-formatted content of the page

// Non-rendered fetching (faster, no JavaScript)
const staticContent = await provider.fetchPage('https://example.com', {
  render: false
}, agent);
```

### Tool Usage - Scrape Page Text

```typescript
// Use the scrapePageText tool directly
const result = await agent.callTool("chrome_scrapePageText", {
  url: "https://example.com/blog/post",
  timeoutSeconds: 30
});

console.log(result.text); // Markdown content
```

### Tool Usage - Scrape Page Metadata

```typescript
const metadata = await agent.callTool("chrome_scrapePageMetadata", {
  url: "https://example.com/article",
  timeoutSeconds: 30
});

console.log('Head HTML:', metadata.data.headHtml.substring(0, 200) + '...');
console.log('JSON-LD blocks:', metadata.data.jsonLd.length);

metadata.data.jsonLd.forEach((item, i) => {
  console.log(`\nJSON-LD block ${i + 1}:`, item);
});
```

### Tool Usage - Take Screenshot

```typescript
const screenshot = await agent.callTool("chrome_takeScreenshot", {
  url: "https://example.com",
  screenWidth: 1024
});

// The screenshot is returned as base64 encoded PNG
// You can save it to a file or display it
import fs from 'fs';
fs.writeFileSync('screenshot.png', screenshot.data, 'base64');
```

### Tool Usage - Run Custom Puppeteer Script

```typescript
const result = await agent.callTool("chrome_runPuppeteerScript", {
  script: `(async ({ page, browser, consoleLog }) => {
    consoleLog('Starting script...');
    await page.goto('https://example.com');
    const title = await page.title();
    const links = await page.$$eval('a', links => links.map(l => l.href));
    consoleLog('Found', links.length, 'links');
    return { title, linkCount: links.length };
  })`,
  navigateTo: 'https://example.com',
  timeoutSeconds: 30
});

console.log('Result:', result.data.result);
console.log('Logs:', result.data.logs);
```

### Using WebSearchService

```typescript
import {WebSearchService} from "@tokenring-ai/websearch";

// Get the websearch service and use the chrome provider
const websearchService = app.requireService(WebSearchService);

// Search using chrome provider
const results = await websearchService.search('TypeScript documentation', 'chrome');

console.log('Results:', results.organic.map(r => r.title));
```

## Plugin Integration

### TokenRing Plugin Registration

The package is registered as a service and tool provider in the TokenRing plugin system via `plugin.ts`:

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {WebSearchService} from "@tokenring-ai/websearch";
import {z} from "zod";
import ChromeWebSearchProvider from "./ChromeWebSearchProvider.ts";
import ChromeService from "./ChromeService.ts";
import packageJSON from './package.json' with {type: 'json'};
import {ChromeConfigSchema} from "./schema.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  chrome: ChromeConfigSchema.prefault({}),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    // Add tools to chat service when available
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    
    // Register ChromeService
    const chromeService = new ChromeService(config.chrome);
    app.addServices(chromeService);

    // Register ChromeWebSearchProvider with WebSearchService
    app.waitForService(WebSearchService, websearchService => {
      websearchService.registerProvider(
        'chrome',
        new ChromeWebSearchProvider(chromeService)
      );
    });
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Plugin Installation

Install the plugin in your TokenRing application:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import chromePlugin from "@tokenring-ai/chrome";

const app = new TokenRingApp();

app.install(chromePlugin, {
  chrome: {
    agentDefaults: {
      launch: true,
      headless: true,
      screenshot: {
        maxPixels: 1000000
      }
    }
  },
});
```

### Configuration Schema

The plugin accepts configuration via the `ChromeConfigSchema`:

```typescript
{
  chrome: {
    agentDefaults: {
      launch: boolean;      // Default: true
      headless: boolean;    // Default: true
      browserWSEndpoint?: string;
      executablePath?: string;
      screenshot: {
        maxPixels: number;  // Default: 1000000
      }
    }
  }
}
```

### Connecting to Existing Browser

For production environments, connect to an existing browser to avoid launching overhead:

```typescript
app.install(chromePlugin, {
  chrome: {
    agentDefaults: {
      launch: false,
      browserWSEndpoint: "ws://localhost:9222/devtools/browser"
    }
  }
});
```

**Note:** Requires Chrome/Puppeteer to be launched with `--remote-debugging-port=9222` flag.

### Accessing Services and Providers

```typescript
import {WebSearchService} from "@tokenring-ai/websearch";

// Access ChromeService directly
const chromeService = app.requireService(ChromeService);

// Access WebSearchService and use chrome provider
const websearchService = app.requireService(WebSearchService);
const results = await websearchService.search('your query', 'chrome');
```

## Dependencies

The package depends on the following core packages:

**Runtime Dependencies:**
- `@tokenring-ai/app` 0.2.0 - Application framework and plugin system
- `@tokenring-ai/chat` 0.2.0 - Chat service and tool definitions
- `@tokenring-ai/agent` 0.2.0 - Agent framework for tool execution
- `@tokenring-ai/websearch` 0.2.0 - Base WebSearchProvider and result types
- `@tokenring-ai/utility` 0.2.0 - Utility functions for deep merging
- `puppeteer` ^24.40.0 - Headless Chrome browser automation
- `turndown` ^7.2.2 - HTML to Markdown conversion
- `zod` ^4.3.6 - Runtime type validation

**Dev Dependencies:**
- `typescript` ^6.0.2 - TypeScript compiler
- `@types/turndown` ^5.0.6 - TypeScript definitions for Turndown
- `vitest` ^4.1.1 - Testing framework

You'll also need to install Chrome or Chromium in your environment for Puppeteer to launch successfully.

## Browser Requirements

- Chrome or Chromium browser installed on the system
- Puppeteer requires system packages for headless mode (Linux/Mac)
- Remote debugging endpoint required when using `launch: false`

**Install system dependencies (Linux):**

```bash
# Ubuntu/Debian
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Install Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

## Error Handling

The package provides robust error handling for browser operations:

### Common Errors

**Browser Launch Failure**

```typescript
// Error: Failed to launch the browser process
// Solution: Ensure Chrome/Chromium is installed and accessible
```

**Connection Timeout**

```typescript
// Error: Navigation took over 20000 ms
// Solution: Increase timeout or verify network connectivity
```

**Invalid URL**

```typescript
// Error: [chrome_scrapePageText] Invalid URL
// Solution: Ensure URL is properly formed and includes http:// or https://
```

**Agent Required**

```typescript
// Error: Agent required for ChromeWebSearchProvider
// Solution: Pass agent parameter to provider methods
```

## Best Practices

### Browser Lifecycle Management

The chrome package uses different browser lifecycle strategies depending on the tool:

- **ChromeWebSearchProvider methods** (`searchWeb`, `searchNews`, `fetchPage`): Use `browser.disconnect()` - closes connection but keeps browser running
- **chrome_scrapePageText**: Uses `browser.disconnect()` - closes connection but keeps browser running
- **chrome_scrapePageMetadata**: Uses `browser.close()` - terminates the browser process
- **chrome_takeScreenshot**: Uses `browser.close()` - terminates the browser process
- **chrome_runPuppeteerScript**: Launches its own browser with `browser.close()` - independent operation

**Important:** Understanding the difference between `disconnect()` and `close()`:
- `disconnect()` - Closes the connection but keeps the browser running (better for performance when reusing)
- `close()` - Terminates the browser process entirely (cleaner but slower startup for next operation)

### Performance

1. **Reuse browser connection**: Use `launch: false` in production for better performance
2. **Monitor timeouts**: Configure appropriate timeouts based on page load times
3. **Batch operations**: Minimize browser launches for multiple requests
4. **Viewport optimization**: Adjust `screenshot.maxPixels` for optimal screenshot dimensions

### Content Extraction

1. **Full page scraping**: The `scrapePageText` tool scrapes the entire page content
2. **Metadata focus**: Use `scrapePageMetadata` for SEO analysis and structured data extraction
3. **Timeout management**: Keep timeouts reasonable to avoid hanging operations
4. **Error handling**: Always wrap tool calls in try-catch blocks

### Resource Management

1. **Browser cleanup**: Browser is automatically closed/disconnected after each operation
2. **Memory handling**: Monitor memory usage during long-running operations
3. **Network stability**: Ensure network connectivity for page loading

### Screenshot Usage

1. **Viewport sizing**: The height is calculated as `maxPixels / screenWidth`
2. **Viewport capture**: Only the visible viewport is captured (not full page)
3. **Base64 handling**: Screenshot data is base64 encoded, handle appropriately for your use case

### Custom Script Execution

1. **Clean script structure**: Write scripts that properly clean up after themselves
2. **Error handling**: Use try-catch blocks within scripts
3. **Console logging**: Use provided `consoleLog` function to capture debug output
4. **Timeouts**: Set appropriate timeouts for complex operations
5. **Browser visibility**: Note that scripts run with `headless: false` by default
6. **Independent operation**: The `runPuppeteerScript` tool operates independently of ChromeService

## Testing

The package uses vitest for unit testing:

```bash
# Run all tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Test Configuration

```typescript
// vitest.config.ts
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
    globals: true,
    isolate: true,
  },
});
```

## Package Structure

```
pkg/chrome/
├── index.ts                 # Main exports (ChromeWebSearchProvider, ChromeService)
├── ChromeWebSearchProvider.ts  # Main provider implementation
├── ChromeService.ts         # Browser lifecycle management service
├── plugin.ts                # Plugin registration and tool setup
├── tools.ts                 # Barrel export for tool definitions
├── schema.ts                # Configuration schemas
├── state/
│   └── chromeState.ts       # Agent state slice for browser configuration
├── tools/
│   ├── scrapePageText.ts    # Web scraping tool implementation
│   ├── scrapePageMetadata.ts # Metadata extraction tool implementation
│   ├── takeScreenshot.ts    # Screenshot capture tool implementation
│   └── runPuppeteerScript.ts # Custom script execution tool implementation
├── vitest.config.ts         # Test configuration
├── package.json             # Package metadata and dependencies
└── README.md                # This documentation
```

## Troubleshooting

### Puppeteer Launch Issues

**"No such binary: chrome"**

- Install Chrome browser on your system
- The wrong Chromium binary may be used
- Specify custom `executablePath` if needed

**"Failed to launch"**

- Check Chrome version compatibility with Puppeteer
- Ensure system dependencies are installed
- Verify Chrome is not already running with debugging port

### Page Loading Issues

**"Navigation timeout exceeded"**

- Increase timeout in tool parameters
- Check network connectivity
- Verify target URL is accessible and responsive

**Text extraction returns unexpected content**

- The tool scrapes the entire page content
- Use `scrapePageMetadata` for structured data instead
- Consider using `runPuppeteerScript` for custom extraction

**Metadata extraction returns empty**

- Check if page has JSON-LD structured data
- Verify page loads completely before extraction
- Increase timeout for complex pages

### Resource Issues

**High memory usage**

- Browser is automatically closed after each operation
- Process results promptly
- Consider committing browser sessions

**Connection refused**

- Ensure remote debugging server is running
- Verify WebSocket endpoint is accessible
- Check firewall settings

**Screenshot not captured**

- Verify URL is accessible
- Check viewport dimensions are valid
- Ensure page loads completely before screenshot

### Browser Lifecycle Issues

**Inconsistent browser behavior**

- Different tools use different lifecycle strategies (disconnect vs close)
- `ChromeWebSearchProvider` methods and `chrome_scrapePageText` use `disconnect()` (keeps browser alive for potential reuse)
- `chrome_scrapePageMetadata`, `chrome_takeScreenshot` use `close()` (terminates browser)
- `chrome_runPuppeteerScript` launches its own browser with `close()` (independent operation)
- For consistent behavior or custom control, consider using `runPuppeteerScript`

### Custom Script Execution

**Script execution failed**

- Ensure script returns a value
- Check syntax and import statements
- Use `consoleLog` for debugging output

**Timeout errors**

- Increase `timeoutSeconds` parameter
- Optimize script execution time
- Check network conditions

**Browser visible when running scripts**

- The `runPuppeteerScript` tool launches with `headless: false`
- This is by default for debugging purposes
- Modify the tool implementation if headless mode is required

**Tool not using ChromeService**

- The `runPuppeteerScript` tool operates independently
- It does not use the ChromeService or agent configuration
- This is intentional for isolated script execution

## Related Components

- **WebSearchProvider**: Base provider interface from `@tokenring-ai/websearch`
- **WebSearchResult**: Search result types from `@tokenring-ai/websearch`
- **TurndownService**: HTML to Markdown conversion
- **Puppeteer**: Chrome browser automation library
- **Agent**: Token Ring agent framework for tool execution

## License

MIT License - see the root LICENSE file for details.
