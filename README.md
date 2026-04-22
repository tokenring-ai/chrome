# @tokenring-ai/chrome

Headless browser automation using Puppeteer for complex web interactions.

## Overview

The `@tokenring-ai/chrome` package provides Chrome browser automation
capabilities for Token Ring AI agents. It enables agents to interact with
web pages, perform searches, extract content, and execute custom Puppeteer
scripts through a headless Chrome browser environment.

### Key Features

- **Browser Automation**: Puppeteer-based headless Chrome browser control
- **Web Search**: Google web search and Google News search via browser
- **Content Extraction**: Web page scraping with HTML to Markdown conversion
- **Metadata Extraction**: Extract page metadata and JSON-LD structured data
- **Screenshots**: Capture visual screenshots with configurable viewport
- **Custom Scripts**: Execute custom Puppeteer scripts with full access
- **Multi-Instance Support**: Configure multiple browser instances with different settings
- **Agent Integration**: Seamless integration with Token Ring agent system

## Installation

```bash
bun install @tokenring-ai/chrome
```

## Configuration

### ChromeInstanceConfigSchema

Configuration for individual Chrome browser instances:

```typescript
export const ChromeInstanceConfigSchema = z.object({
  launch: z.boolean().default(true),
  headless: z.boolean().default(false),
  browserWSEndpoint: z.string().exactOptional(),
  executablePath: z.string().exactOptional(),
  screenshot: z
    .object({
      maxPixels: z.number().default(1000000),
    })
    .prefault({}),
});
```

### ChromeAgentConfigSchema

Agent-specific configuration:

```typescript
export const ChromeAgentConfigSchema = z
  .object({
    instance: z.string().exactOptional(),
  })
  .prefault({});
```

### ChromeConfigSchema

Top-level package configuration:

```typescript
export const ChromeConfigSchema = z.object({
  instances: z.record(z.string(), ChromeInstanceConfigSchema).prefault({
    chrome: {},
  }),
  agentDefaults: z
    .object({
      instance: z.string().default("chrome"),
    })
    .prefault({}),
});
```

### Example Configuration

```yaml
chrome:
  instances:
    default:
      launch: true
      headless: true
      screenshot:
        maxPixels: 1000000
    visible:
      launch: true
      headless: false
      screenshot:
        maxPixels: 2000000
  agentDefaults:
    instance: default
```

**Configuration Notes:**

- `instances` - Record of named browser instances with their configurations
- `agentDefaults.instance` - Default instance name for agents (default: "chrome")
- `launch: true` - Creates a new Puppeteer browser instance for each operation
- `launch: false` - Connects to an existing browser session
- `headless: true` - Runs browser in headless mode (default: false)
- `headless: false` - Runs browser with visible UI (useful for debugging)
- `browserWSEndpoint` - WebSocket endpoint for connecting to existing browser
- `executablePath` - Custom path to Chrome/Chromium executable
- `screenshot.maxPixels` - Maximum total pixels for viewport (default: 1000000)

## Tools

The package provides the following tools for agent use:

### chrome_scrapePageText

Web page text scraping tool that converts page content to Markdown. By default,
it prioritizes content from 'article', 'main', or 'body' tags in that order.

**Tool Definition:**

```typescript
{
  name: "chrome_scrapePageText",
  displayName: "Chrome/scrapePageText",
  description: "Scrape text content from a web page using Puppeteer...",
  inputSchema: {
    url: string,
    timeoutSeconds?: number,
    selector?: string
  }
}
```

**Parameters:**

| Parameter      | Type   | Required | Description                                        |
|----------------|--------|----------|----------------------------------------------------|
| url            | string | Yes      | The URL of the web page to scrape                  |
| timeoutSeconds | number | No       | Timeout (default: 30, min: 5, max: 180)            |
| selector       | string | No       | Custom CSS selector; defaults to article/main/body |

**Output:** Returns `TokenRingToolResult` with:

- `result`: Text description of extraction
- `attachments`: Array containing extracted markdown file

**Usage Example:**

```typescript
const result = await agent.callTool("chrome_scrapePageText", {
  url: "https://example.com/article",
  timeoutSeconds: 30
});

console.log(result.result); // Description text
console.log(result.attachments[0].body); // Markdown content
```

**Implementation Details:**

- Uses ChromeService for browser management via `agent.requireServiceByType()`
- Waits for `domcontentloaded` before extracting content
- If `selector` provided, extracts only that element's outerHTML
- If no `selector`, tries 'article', then 'main', then 'body'
- Falls back to full page content if no element found
- Converts to Markdown using `TurndownService`
- Browser is **disconnected** after operation via `browser.disconnect()`

### chrome_scrapePageMetadata

Extracts metadata from web pages including HTML head and JSON-LD structured data.
Useful for SEO analysis and extracting structured data.

**Tool Definition:**

```typescript
{
  name: "chrome_scrapePageMetadata",
  displayName: "Chrome/scrapePageMetadata",
  description: "Loads a web page and extracts metadata from the <head> tag and
    any JSON-LD (Schema.org) blocks found in the document.",
  inputSchema: {
    url: string,
    timeoutSeconds?: number
  }
}
```

**Parameters:**

| Parameter      | Type   | Required | Description                             |
|----------------|--------|----------|-----------------------------------------|
| url            | string | Yes      | The URL of the web page to scrape       |
| timeoutSeconds | number | No       | Timeout (default: 30, min: 5, max: 180) |

**Output:** Returns JSON string containing:

- `headHtml`: Cleaned HTML of the `<head>` element
- `jsonLd`: Array of parsed JSON-LD objects (Schema.org data)
- `url`: The URL that was scraped

**Usage Example:**

```typescript
const result = await agent.callTool("chrome_scrapePageMetadata", {
  url: "https://example.com/article",
  timeoutSeconds: 30
});

const data = JSON.parse(result);
console.log(data.headHtml); // Cleaned head HTML
console.log(data.jsonLd); // Array of JSON-LD objects
console.log(data.url); // Original URL
```

**Implementation Details:**

- Uses ChromeService for browser management via `agent.requireServiceByType()`
- Waits for `domcontentloaded` before extracting metadata
- Clones `<head>` to avoid modifying the live page
- Removes content from `<style>` and `<script>` tags (except JSON-LD)
- Extracts all `<script type="application/ld+json">` blocks
- Handles parsing errors gracefully with error objects
- Browser is **closed** after operation via `browser.close()`

### chrome_takeScreenshot

Captures visual screenshots of web pages with configurable viewport dimensions.
Returns the image as base64-encoded PNG data.

**Tool Definition:**

```typescript
{
  name: "chrome_takeScreenshot",
  displayName: "Chrome/takeScreenshot",
  description: "Captures a visual screenshot of a web page at a specific width.
    Returns the image as base64 data.",
  inputSchema: {
    url: string,
    screenWidth?: number
  }
}
```

**Parameters:**

| Parameter   | Type   | Required | Description                                      |
|-------------|--------|----------|--------------------------------------------------|
| url         | string | Yes      | The URL of the web page to screenshot            |
| screenWidth | number | No       | Viewport width (default 1024, min 300, max 1024) |

**Output:** Returns `TokenRingToolResult` with:

- `result`: Description of screenshot
- `attachments`: Array containing base64-encoded PNG image

**Usage Example:**

```typescript
const result = await agent.callTool("chrome_takeScreenshot", {
  url: "https://example.com",
  screenWidth: 1024
});

// Save to file
import fs from 'fs';
fs.writeFileSync('screenshot.png', result.attachments[0].body, 'base64');
```

**Implementation Details:**

- Uses ChromeService for browser management via `agent.requireServiceByType()`
- Reads `screenshot.maxPixels` from the configured instance
- Calculates viewport height: `height = maxPixels / screenWidth`
- Sets viewport with `deviceScaleFactor: 1` for 1:1 pixel ratio
- Waits for `networkidle2` before capturing screenshot
- Captures only visible viewport (not full page) with `fullPage: false`
- Browser is **closed** after operation via `browser.close()`

### chrome_runPuppeteerScript

Execute custom Puppeteer scripts with access to page and browser instances.
This tool launches its own browser independently of ChromeService.

**Tool Definition:**

```typescript
{
  name: "chrome_runPuppeteerScript",
  displayName: "Chrome/runPuppeteerScript",
  description: "Run a Puppeteer script with access to a browser and page.
  Accepts a JavaScript function or module as a string, executes it with Puppeteer
  page instance, and returns the result.",
  inputSchema: {
    script: string,
    navigateTo?: string,
    timeoutSeconds?: number
  }
}
```

**Parameters:**

| Parameter      | Type   | Required | Description                             |
|----------------|--------|----------|-----------------------------------------|
| script         | string | Yes      | JavaScript code defining async function |
| navigateTo     | string | No       | Page URL to navigate before executing   |
| timeoutSeconds | number | No       | Timeout (default 30, min 5, max: 180)   |

**Output:** Returns JSON string containing:

- `result`: The return value from the executed script
- `logs`: Array of log strings from consoleLog and browser console events

**Usage Example:**

```typescript
const result = await agent.callTool("chrome_runPuppeteerScript", {
  script: `(async ({ page, browser, consoleLog }) => {
    consoleLog('Starting Puppeteer script...');
    await page.goto('https://example.com');
    const title = await page.title();
    consoleLog('Page title:', title);
    const links = await page.$$eval('a', links =>
      links.map(l => l.href));
    consoleLog('Found', links.length, 'links');
    return { title, linkCount: links.length };
  })`,
  navigateTo: 'https://example.com',
  timeoutSeconds: 30
});

const data = JSON.parse(result);
console.log('Result:', data.result);
console.log('Logs:', data.logs);
```

**Script Function Signature:**

The script should define or export an async function that accepts:

- `page`: Puppeteer Page instance for navigation and interaction
- `browser`: Puppeteer Browser instance for browser-level operations
- `consoleLog`: Custom logging function that captures output to logs array

**Implementation Details:**

- **Launches its own browser** with `puppeteer.launch({headless: false})`
- Browser is launched in visible mode for debugging purposes
- Creates new page via `browser.newPage()`
- Provides `consoleLog` function that captures arguments as strings
- Listens to `page.on('console')` events for browser console output
- If `navigateTo` provided, navigates with `waitUntil: 'load'` and 20s timeout
- Enforces timeout on script execution (max 180s, min 5s)
- Browser is **closed** after operation via `browser.close()`
- **Important:** Operates independently of ChromeService and agent config

## Services

The package provides the following service implementation:

### ChromeService

The `ChromeService` class implements the `TokenRingService` interface and
provides browser lifecycle management for multiple Puppeteer browser instances.

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
- `instances: KeyedRegistry<ChromeWebSearchProvider>` - Registry of browser instances

**Constructor:**

```typescript
constructor(options: ChromeConfigSchema)
```

- `options.instances` - Record of named browser instance configurations
- `options.agentDefaults` - Default settings for agents

**Public Methods:**

```typescript
attach(agent: Agent): void
```

Attaches the service to an agent. Merges `agentDefaults` from constructor
with agent-specific configuration retrieved via
`agent.getAgentConfigSlice("chrome", ChromeAgentConfigSchema)` using
`deepMerge` from `@tokenring-ai/utility`. Then initializes agent state
using `ChromeState` with the merged configuration.

```typescript
async getBrowser(agent: Agent): Promise<Browser>
```

Retrieves a browser instance from the configured instance:

- Gets state via `agent.getState(ChromeState)`
- Retrieves the configured instance via `this.instances.require(config.instance)`
- Calls `instance.getBrowser()` to launch or connect to browser
- Returns the browser instance

```typescript
requireInstance(agent: Agent): ChromeWebSearchProvider
```

Returns the ChromeWebSearchProvider instance configured for the agent:

- Gets state via `agent.getState(ChromeState)`
- Returns the instance specified by `config.instance`
- Throws error if no instance is configured

```typescript
getInstanceEntries(): Iterable<[string, ChromeWebSearchProvider]>
```

Returns all registered browser instances for plugin registration.

**Usage:**

```typescript
import ChromeService from "@tokenring-ai/chrome";

const chromeService = new ChromeService({
  instances: {
    default: {
      launch: true,
      headless: true,
      screenshot: {
        maxPixels: 1000000
      }
    },
    visible: {
      launch: true,
      headless: false,
      screenshot: {
        maxPixels: 2000000
      }
    }
  },
  agentDefaults: {
    instance: "default"
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

The `ChromeWebSearchProvider` class implements the `WebSearchProvider` interface
from `@tokenring-ai/websearch` and provides search functionality using
Chrome/Puppeteer browser automation.

**Constructor:**

```typescript
constructor(config: ChromeInstanceConfigSchema)
```

- `config`: Browser instance configuration (launch, headless, etc.)

**Key Methods:**

```typescript
async getBrowser(): Promise<Browser>
```

Returns a browser instance based on configuration:

- If `config.launch === true`: Launches new browser via `puppeteer.launch()`
- If `config.launch === false`: Connects via `puppeteer.connect()`

```typescript
async searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>
```

Performs Google web search via Puppeteer. Returns organic search results
with title, link, and snippet. Uses `[data-ved] h3` selectors for results
and `[data-sncf]` for snippets. Browser is disconnected after each request.

```typescript
async searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>
```

Performs Google News search via Puppeteer. Returns news articles with
metadata (title, snippet, source, date). Parses article containers using
`[data-news-doc-id]` attribute. Browser is disconnected after each request.

```typescript
async fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>
```

Scrapes web page content using Puppeteer. Converts HTML to Markdown using
TurndownService. Supports rendered (`networkidle0`) and non-rendered
(`domcontentloaded`) fetching. Browser is disconnected after each request.

**Important:** All methods manage their own browser lifecycle and do not
require an Agent parameter.

**Registration:**

The provider is registered with the `WebSearchService` via the plugin system:

```typescript
app.waitForService(WebSearchService, websearchService => {
  for (const [name, instance] of chromeService.getInstanceEntries()) {
    websearchService.registerProvider(name, instance);
  }
});
```

**Usage:**

```typescript
import { WebSearchService } from "@tokenring-ai/websearch";

const websearchService = app.requireService(WebSearchService);
const results = await websearchService.search('your query', 'chrome');
```

## Usage Examples

### Basic Web Search

```typescript
import ChromeWebSearchProvider from "@tokenring-ai/chrome";

const provider = new ChromeWebSearchProvider({
  launch: true,
  headless: true,
  screenshot: {
    maxPixels: 1000000
  }
});

// Perform a web search
const results = await provider.searchWeb('TypeScript documentation', {
  countryCode: 'us'
});

console.log('Organic results:', results.organic.map(r => r.title));
console.log('Result count:', results.organic.length);
```

### Google News Search

```typescript
// Search for recent news
const news = await provider.searchNews('artificial intelligence', {
  countryCode: 'us'
});

console.log('News articles:', news.news.length);

news.news.forEach(article => {
  console.log(`\`${article.title}\``);
  console.log(`  Source: ${article.source}`);
  console.log(`  Date: ${article.date}`);
});
```

### Page Content Retrieval

```typescript
// Scrape web page content
const pageContent = await provider.fetchPage(
  'https://example.com/article', {
    render: true
  });

console.log(pageContent.markdown.substring(0, 200) + '...');
// Returns markdown-formatted content of the page

// Non-rendered fetching (faster, no JavaScript)
const staticContent = await provider.fetchPage('https://example.com', {
  render: false
});
```

### Tool Usage Examples

**Scrape Page Text:**

```typescript
const result = await agent.callTool("chrome_scrapePageText", {
  url: "https://example.com/blog/post",
  timeoutSeconds: 30
});

console.log(result.result); // Description text
console.log(result.attachments[0].body); // Markdown content
```

**Scrape Page Metadata:**

```typescript
const result = await agent.callTool("chrome_scrapePageMetadata", {
  url: "https://example.com/article",
  timeoutSeconds: 30
});

const data = JSON.parse(result);
console.log('Head HTML:', data.headHtml.substring(0, 200));
console.log('JSON-LD blocks:', data.jsonLd.length);
```

**Take Screenshot:**

```typescript
const result = await agent.callTool("chrome_takeScreenshot", {
  url: "https://example.com",
  screenWidth: 1024
});

// Save to file
import fs from 'fs';
fs.writeFileSync('screenshot.png', result.attachments[0].body, 'base64');
```

**Run Custom Puppeteer Script:**

```typescript
const result = await agent.callTool("chrome_runPuppeteerScript", {
  script: `(async ({ page, browser, consoleLog }) => {
    consoleLog('Starting script...');
    await page.goto('https://example.com');
    const title = await page.title();
    const links = await page.$$eval('a', links =>
      links.map(l => l.href));
    consoleLog('Found', links.length, 'links');
    return { title, linkCount: links.length };
  })`,
  navigateTo: 'https://example.com',
  timeoutSeconds: 30
});

const data = JSON.parse(result);
console.log('Result:', data.result);
console.log('Logs:', data.logs);
```

## Plugin Integration

### TokenRing Plugin Registration

The package is registered as a service and tool provider in the TokenRing
plugin system via `plugin.ts`:

```typescript
import type { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { WebSearchService } from "@tokenring-ai/websearch";
import { z } from "zod";
import ChromeService from "./ChromeService.ts";
import packageJSON from "./package.json" with { type: "json" };
import { ChromeConfigSchema } from "./schema.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  chrome: ChromeConfigSchema.prefault({}),
});

export default {
  name: packageJSON.name,
  displayName: "Chrome Automation",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, chatService => chatService.addTools(...tools));
    const chromeService = new ChromeService(config.chrome);
    app.addServices(chromeService);

    app.waitForService(WebSearchService, websearchService => {
      for (const [name, instance] of chromeService.getInstanceEntries()) {
        websearchService.registerProvider(name, instance);
      }
    });
  },
  config: packageConfigSchema,
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
    instances: {
      default: {
        launch: true,
        headless: true,
        screenshot: {
          maxPixels: 1000000
        }
      }
    },
    agentDefaults: {
      instance: "default"
    }
  },
});
```

### Configuring Multiple Browser Instances

For different use cases, configure multiple browser instances:

```typescript
app.install(chromePlugin, {
  chrome: {
    instances: {
      headless: {
        launch: true,
        headless: true,
        screenshot: {
          maxPixels: 1000000
        }
      },
      visible: {
        launch: true,
        headless: false,
        screenshot: {
          maxPixels: 2000000
        }
      },
      connected: {
        launch: false,
        browserWSEndpoint: "ws://localhost:9222/devtools/browser"
      }
    },
    agentDefaults: {
      instance: "headless"
    }
  }
});
```

**Note:** The `connected` instance requires Chrome/Puppeteer to be launched with
`--remote-debugging-port=9222` flag.

### Accessing Services and Providers

```typescript
import ChromeService from "@tokenring-ai/chrome";
import { WebSearchService } from "@tokenring-ai/websearch";

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
- `turndown` ^7.2.4 - HTML to Markdown conversion
- `zod` ^4.3.6 - Runtime type validation

**Dev Dependencies:**

- `typescript` ^6.0.2 - TypeScript compiler
- `@types/turndown` ^5.0.6 - TypeScript definitions for Turndown
- `vitest` ^4.1.1 - Testing framework

You'll also need to install Chrome or Chromium in your environment for
Puppeteer to launch successfully.

## Browser Requirements

- Chrome or Chromium browser installed on the system
- Puppeteer requires system packages for headless mode (Linux/Mac)
- Remote debugging endpoint required when using `launch: false`

**Install system dependencies (Linux):**

```bash
# Ubuntu/Debian
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 \
  libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 \
  libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
  libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
  fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Install Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

## Error Handling

The package provides robust error handling for browser operations.

### Common Errors

#### Browser Launch Failure

```text
Error: Failed to launch the browser process
Solution: Ensure Chrome/Chromium is installed and accessible
```

#### Connection Timeout

```text
Error: Navigation took over 20000 ms
Solution: Increase timeout or verify network connectivity
```

#### Invalid URL

```text
Error: [chrome_scrapePageText] Invalid URL
Solution: Ensure URL is properly formed and includes http:// or https://
```

#### Instance Not Configured

```text
Error: Chrome instance not configured
Solution: Ensure agent has an instance configured via ChromeAgentConfigSchema
```

## Best Practices

### Browser Lifecycle Management

The chrome package uses different browser lifecycle strategies depending on
the tool:

- **ChromeWebSearchProvider methods** (`searchWeb`, `searchNews`, `fetchPage`):
  Use `browser.disconnect()` - closes connection but keeps browser running
- **chrome_scrapePageText**: Uses `browser.disconnect()` - keeps browser
  running for potential reuse
- **chrome_scrapePageMetadata**: Uses `browser.close()` - terminates browser
  process
- **chrome_takeScreenshot**: Uses `browser.close()` - terminates browser
  process
- **chrome_runPuppeteerScript**: Launches its own browser with `browser.close()`
  - independent operation

**Understanding disconnect() vs close():**

- `disconnect()` - Closes connection but keeps browser running (better
  performance for reuse)
- `close()` - Terminates browser process entirely (cleaner but slower startup)

### Performance

1. **Reuse browser connection**: Use `launch: false` in production for better
   performance
2. **Monitor timeouts**: Configure appropriate timeouts based on page load times
3. **Batch operations**: Minimize browser launches for multiple requests
4. **Viewport optimization**: Adjust `screenshot.maxPixels` for optimal
   screenshot dimensions

### Content Extraction

1. **Full page scraping**: The `scrapePageText` tool scrapes entire page
   content
2. **Metadata focus**: Use `scrapePageMetadata` for SEO and structured data
3. **Timeout management**: Keep timeouts reasonable to avoid hanging operations
4. **Error handling**: Always wrap tool calls in try-catch blocks

### Resource Management

1. **Browser cleanup**: Browser is automatically closed/disconnected after
   each operation
2. **Memory handling**: Monitor memory usage during long-running operations
3. **Network stability**: Ensure network connectivity for page loading

### Screenshot Usage

1. **Viewport sizing**: Height is calculated as `maxPixels / screenWidth`
2. **Viewport capture**: Only visible viewport is captured (not full page)
3. **Base64 handling**: Screenshot data is base64 encoded, handle appropriately

### Script Execution Best Practices

1. **Clean script structure**: Write scripts that properly clean up
2. **Error handling**: Use try-catch blocks within scripts
3. **Console logging**: Use provided `consoleLog` function for debug output
4. **Timeouts**: Set appropriate timeouts for complex operations
5. **Browser visibility**: Scripts run with `headless: false` by default
6. **Independent operation**: Tool operates independently of ChromeService

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
import { defineConfig } from 'vitest/config';

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

```text
pkg/chrome/
├── index.ts                 # Main exports
├── ChromeWebSearchProvider.ts  # Main provider implementation
├── ChromeService.ts         # Browser lifecycle management service
├── plugin.ts                # Plugin registration and tool setup
├── tools.ts                 # Barrel export for tool definitions
├── schema.ts                # Configuration schemas
├── state/
│   └── chromeState.ts       # Agent state slice
├── tools/
│   ├── scrapePageText.ts    # Web scraping tool
│   ├── scrapePageMetadata.ts # Metadata extraction tool
│   ├── takeScreenshot.ts    # Screenshot capture tool
│   └── runPuppeteerScript.ts # Custom script execution tool
├── vitest.config.ts         # Test configuration
├── package.json             # Package metadata
└── README.md                # This documentation
```

## Troubleshooting

### Puppeteer Launch Issues

#### "No such binary: chrome"

- Install Chrome browser on your system
- The wrong Chromium binary may be used
- Specify custom `executablePath` if needed

#### "Failed to launch"

- Check Chrome version compatibility with Puppeteer
- Ensure system dependencies are installed
- Verify Chrome is not already running with debugging port

### Page Loading Issues

#### "Navigation timeout exceeded"

- Increase timeout in tool parameters
- Check network connectivity
- Verify target URL is accessible and responsive

#### Text extraction returns unexpected content

- The tool scrapes the entire page content
- Use `scrapePageMetadata` for structured data instead
- Consider using `runPuppeteerScript` for custom extraction

#### Metadata extraction returns empty

- Check if page has JSON-LD structured data
- Verify page loads completely before extraction
- Increase timeout for complex pages

### Resource Issues

#### High memory usage

- Browser is automatically closed after each operation
- Process results promptly
- Consider committing browser sessions

#### Connection refused

- Ensure remote debugging server is running
- Verify WebSocket endpoint is accessible
- Check firewall settings

#### Screenshot not captured

- Verify URL is accessible
- Check viewport dimensions are valid
- Ensure page loads completely before screenshot

### Browser Lifecycle Issues

#### Inconsistent browser behavior

- Different tools use different lifecycle strategies (disconnect vs close)
- `ChromeWebSearchProvider` methods and `chrome_scrapePageText` use
  `disconnect()` (keeps browser alive for potential reuse)
- `chrome_scrapePageMetadata`, `chrome_takeScreenshot` use `close()`
  (terminates browser)
- `chrome_runPuppeteerScript` launches its own browser with `close()`
  (independent operation)
- For consistent behavior or custom control, consider using
  `runPuppeteerScript`

### Instance Configuration Issues

#### "Chrome instance not configured"

- Ensure agent has an instance configured via `ChromeAgentConfigSchema`
- Check that the instance name exists in `chrome.instances`
- Verify `agentDefaults.instance` is set correctly

### Custom Script Execution

#### Script execution failed

- Ensure script returns a value
- Check syntax and import statements
- Use `consoleLog` for debugging output

#### Timeout errors

- Increase `timeoutSeconds` parameter
- Optimize script execution time
- Check network conditions

#### Browser visible when running scripts

- The `runPuppeteerScript` tool launches with `headless: false`
- This is by default for debugging purposes
- Modify the tool implementation if headless mode is required

#### Tool not using ChromeService

- The `runPuppeteerScript` tool operates independently
- It does not use the ChromeService or agent configuration
- This is intentional for isolated script execution

## Related Components

- **WebSearchProvider**: Base provider interface from
  `@tokenring-ai/websearch`
- **WebSearchResult**: Search result types from
  `@tokenring-ai/websearch`
- **TurndownService**: HTML to Markdown conversion
- **Puppeteer**: Chrome browser automation library
- **Agent**: Token Ring agent framework for tool execution

## License

MIT License - see the root LICENSE file for details.
