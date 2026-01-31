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
- Visual screenshot capture with configurable viewport width
- Browser lifecycle management (launch vs connect)
- Selenium-like selector-based content retrieval
- Support for rendered and non-rendered page fetching
- Agent state management for browser configuration

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
  }),
}).strict();
```

### ChromeAgentConfigSchema

```typescript
export const ChromeAgentConfigSchema = z.object({
  launch: z.boolean().optional(),
  headless: z.boolean().optional(),
  browserWSEndpoint: z.string().optional(),
  executablePath: z.string().optional(),
}).strict().default({});
```

### Example Configuration

```json
{
  "chrome": {
    "agentDefaults": {
      "launch": true,
      "headless": true
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

## Core Components

### ChromeService

Main service implementation that manages browser lifecycle and provides browser instances to other components.

**Class Definition:**

```typescript
import ChromeService from "@tokenring-ai/chrome";

const chromeService = new ChromeService({
  agentDefaults: {
    launch: true,
    headless: true
  }
});
```

**Public Methods:**

```typescript
attach(agent: Agent): void
```

Attaches the ChromeService to an agent, merging configuration and initializing state.

```typescript
async getBrowser(agent: Agent): Promise<Browser>
```

Manages browser lifecycle based on configuration:
- If `launch: true`: Creates new Puppeteer browser instance
- If `launch: false`: Connects to existing browser session via WebSocket endpoint
- Returns browser instance for the operation

### ChromeWebSearchProvider

Main provider implementation extending `WebSearchProvider` from `@tokenring-ai/websearch`. Handles browser automation for search and content retrieval.

**Class Definition:**

```typescript
import ChromeWebSearchProvider from "@tokenring-ai/chrome";

const provider = new ChromeWebSearchProvider(chromeService);
```

**Public Methods:**

```typescript
async searchWeb(query: string, options?: WebSearchProviderOptions, agent?: Agent): Promise<WebSearchResult>
```

Performs Google web search via Puppeteer browser. Returns organic search results with title, link, and snippet in order of appearance. Supports countryCode parameter. Uses `[data-ved] h3` selectors for results and `[data-sncf]` for snippets. Browser launched and disconnected per request.

```typescript
async searchNews(query: string, options?: WebSearchProviderOptions, agent?: Agent): Promise<NewsSearchResult>
```

Performs Google News search via Puppeteer browser. Returns array of news articles with metadata. Parses article containers using `[data-news-doc-id]` attribute. Extracts title, snippet, source, and date from page elements. Browser launched and disconnected per request.

```typescript
async fetchPage(url: string, options?: WebPageOptions, agent?: Agent): Promise<WebPageResult>
```

Scrapes web page content using Puppeteer browser. Converts HTML to Markdown using TurndownService. Supports rendered and non-rendered fetching via `render` option - `true` waits for `networkidle0`, `false` waits for `domcontentloaded`. Browser launched and disconnected per request.

### ChromeState

Agent state slice for managing Chrome browser configuration and persistence.

**Class Definition:**

```typescript
import {ChromeState} from "@tokenring-ai/chrome";

const state = new ChromeState({
  launch: true,
  headless: true,
  browserWSEndpoint: undefined,
  executablePath: undefined
});
```

**Properties:**

- `launch: boolean` - Whether to launch a new browser instance
- `headless?: boolean` - Whether to run browser in headless mode
- `browserWSEndpoint?: string` - WebSocket endpoint for connecting to existing browser
- `executablePath?: string` - Custom path to Chrome/Chromium executable

**Methods:**

```typescript
serialize(): z.output<typeof serializationSchema>
```

Returns serialized state for persistence.

```typescript
deserialize(data: z.output<typeof serializationSchema>): void
```

Restores state from serialized data.

```typescript
show(): string[]
```

Returns a formatted string representation of the state.

## Tools

The package provides the following tools for agent use:

### scrapePageText

Web page text scraping tool with custom selector support.

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
- `timeoutSeconds` (optional): Timeout for scraping operation (default 30s, min 5s, max 180s)
- `selector` (optional): Custom CSS selector to target specific content. If not provided, uses 'article', 'main', or 'body' in priority order

**Output:** Returns the extracted text, source selector, and URL

**Usage Example:**

```typescript
await agent.callTool("chrome_scrapePageText", {
  url: "https://example.com/article",
  timeoutSeconds: 30,
  selector: "article"
});
```

### scrapePageMetadata

Extracts metadata from web pages including HTML head and JSON-LD structured data.

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

**Output:** Returns JSON with headHtml, jsonLd, and url

**Usage Example:**

```typescript
await agent.callTool("chrome_scrapePageMetadata", {
  url: "https://example.com/article",
  timeoutSeconds: 30
});
```

### takeScreenshot

Captures visual screenshots of web pages.

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

**Output:** Returns base64 encoded PNG image

**Usage Example:**

```typescript
await agent.callTool("chrome_takeScreenshot", {
  url: "https://example.com",
  screenWidth: 1024
});
```

## Usage Examples

### Basic Web Search

```typescript
import ChromeWebSearchProvider from "@tokenring-ai/chrome";
import ChromeService from "@tokenring-ai/chrome/ChromeService";

const chromeService = new ChromeService({
  agentDefaults: {
    launch: true,
    headless: true
  }
});

const provider = new ChromeWebSearchProvider(chromeService);

// Perform a web search
const results = await provider.searchWeb('TypeScript documentation', {
  countryCode: 'us'
});

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
// Search for recent news
const news = await provider.searchNews('artificial intelligence', {
  countryCode: 'us'
});

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
// Scrape web page content
const pageContent = await provider.fetchPage('https://example.com/article', {
  render: true
});

console.log(pageContent.markdown.substring(0, 200) + '...');
// Returns markdown-formatted content of the page

// Non-rendered fetching (faster, no JavaScript)
const staticContent = await provider.fetchPage('https://example.com', {
  render: false
});
```

### Tool Usage

```typescript
// Use the scrapePageText tool directly
const toolResult = await agent.callTool("chrome_scrapePageText", {
  url: "https://example.com/blog/post",
  selector: "article.main-content"
});

console.log(`Text: ${toolResult.text}`);
console.log(`Selector: ${toolResult.sourceSelector}`);
console.log(`URL: ${toolResult.url}`);
```

### Custom Content Extraction

```typescript
const scrapeResult = await agent.callTool("chrome_scrapePageText", {
  url: "https://news.ycombinator.com",
  selector: "tr.athing" // Hacker News story rows
});

const stories = scrapeResult.text.split('\n').filter(line => line.trim());
console.log('Hacker News stories:', stories.length);
```

### Metadata Extraction

```typescript
const metadata = await agent.callTool("chrome_scrapePageMetadata", {
  url: "https://example.com/article"
});

console.log('Head HTML:', metadata.data.headHtml.substring(0, 200) + '...');
console.log('JSON-LD blocks:', metadata.data.jsonLd.length);

metadata.data.jsonLd.forEach((item, i) => {
  console.log(`\nJSON-LD block ${i + 1}:`, item);
});
```

### Screenshot Capture

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

## Plugin Integration

### TokenRing Plugin Registration

The package is registered as a service and tool provider in the TokenRing plugin system:

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {WebSearchService} from "@tokenring-ai/websearch";
import {z} from "zod";
import ChromeWebSearchProvider from "./ChromeWebSearchProvider.js";
import ChromeService from "./ChromeService.js";
import packageJSON from './package.json' with {type: 'json'};
import {ChromeConfigSchema} from "./schema.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  chrome: ChromeConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    // Register tools
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );

    // Register Chrome service
    if (config.chrome) {
      const chromeService = new ChromeService(config.chrome);
      app.addServices(chromeService);

      // Register websearch provider
      app.waitForService(WebSearchService, websearchService => {
        websearchService.registerProvider(
          'chrome',
          new ChromeWebSearchProvider(chromeService)
        );
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Agent Configuration

Configure the chrome service in your TokenRing application:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import chromePlugin from "@tokenring-ai/chrome";

const app = new TokenRingApp();

app.install(chromePlugin, {
  chrome: {
    agentDefaults: {
      launch: true,
      headless: true
    }
  },
});

// Access provider through websearch service
const websearchService = app.requireService(WebSearchService);
const results = await websearchService.search('your query', 'chrome');
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

**Note:** Requires Puppeteer to be launched with `--remote-debugging-port=9222` flag.

## Dependencies

The package depends on the following core packages:

- `@tokenring-ai/app` - Application framework and plugin system
- `@tokenring-ai/chat` - Chat service and tool definitions
- `@tokenring-ai/agent` - Agent framework for tool execution
- `@tokenring-ai/websearch` - Base WebSearchProvider and result types
- `puppeteer` ^24.35.0 - Headless Chrome browser automation
- `turndown` ^7.2.2 - HTML to Markdown conversion
- `zod` - Runtime type validation

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

**Element Not Found**

```typescript
// Error: Element with selector "article" not found
// Solution: Adjust selector priority or use different selectors
```

**Invalid URL**

```typescript
// Error: [chrome_scrapePageText] Invalid URL
// Solution: Ensure URL is properly formed and includes http:// or https://
```

## Best Practices

### Performance

1. **Reuse browser connection**: Use `launch: false` in production for better performance
2. **Monitor timeouts**: Configure appropriate timeouts based on page load times
3. **Batch operations**: Minimize browser launches for multiple requests
4. **Selector specificity**: Use specific selectors when available for faster extraction

### Content Extraction

1. **Priority selector order**: The tool naturally prefers `article > main > body`
2. **Custom selectors**: Provide specific selectors for better content targeting
3. **Timeout management**: Keep timeouts reasonable to avoid hanging operations
4. **Error handling**: Always wrap tool calls in try-catch blocks

### Resource Management

1. **Browser cleanup**: Browser is automatically closed after each operation
2. **Memory handling**: Monitor memory usage during long-running operations
3. **Network stability**: Ensure network connectivity for page loading

### Metadata Extraction

1. **JSON-LD parsing**: Use scrapePageMetadata for SEO analysis and structured data extraction
2. **Head HTML inspection**: Useful for understanding page structure and meta tags
3. **Timeout configuration**: Adjust timeout based on page complexity

### Screenshot Usage

1. **Viewport sizing**: Choose appropriate screenWidth based on target device
2. **Full page capture**: Use fullPage: true in Puppeteer for complete page screenshots
3. **Base64 handling**: Screenshot data is base64 encoded, handle appropriately for your use case

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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
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
│   └── takeScreenshot.ts    # Screenshot capture tool implementation
├── vitest.config.ts         # Test configuration
├── package.json             # Package metadata and dependencies
└── README.md                # This documentation
```

## Troubleshooting

### Puppeteer Launch Issues

**"No such binary: chrome"**

- Install Chrome browser on your system
- The wrong Chromium binary may be used
- Specify custom executablePath if needed

**"Failed to launch"**

- Check Chrome version compatibility with Puppeteer
- Ensure system dependencies are installed
- Verify Chrome is not already running with debugging port

### Page Loading Issues

**"Navigation timeout exceeded"**

- Increase timeout in fetchPage options
- Check network connectivity
- Verify target URL is accessible and responsive

**Text extraction returns empty**

- Check if page loads JavaScript (use `render: true`)
- Verify selectors match page content structure
- Inspect page with browser DevTools first

**Metadata extraction returns empty**

- Check if page has JSON-LD structured data
- Verify page loads completely before extraction
- Increase timeout for complex pages

### Resource Issues

**High memory usage**

- Close browser connections efficiently
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

## Related Components

- **WebSearchProvider**: Base provider interface from `@tokenring-ai/websearch`
- **WebSearchResult**: Search result types from `@tokenring-ai/websearch`
- **TurndownService**: HTML to Markdown conversion
- **Puppeteer**: Chrome browser automation library
- **Agent**: Token Ring agent framework for tool execution

## License

MIT
