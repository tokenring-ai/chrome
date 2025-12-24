# @tokenring-ai/chrome

Chrome browser automation utilities for the Token Ring ecosystem, providing web search capabilities, page scraping tools, and Puppeteer script execution.

## Overview

This package provides Chrome browser automation utilities for the Token Ring ecosystem. It includes:

- **Web Search Provider**: Chrome-based web and news search functionality using Puppeteer
- **Page Scraping Tool**: Extract text content from web pages with intelligent content detection
- **Puppeteer Script Execution**: Run custom JavaScript scripts with full browser access
- **Automatic Plugin Integration**: Seamless integration with Token Ring applications

## Installation

This package is part of the monorepo and is typically consumed by the Token Ring runtime. If you need to depend on it directly:

```bash
bun install @tokenring-ai/chrome
```

### Dependencies

- `@tokenring-ai/app`: ^0.2.0
- `@tokenring-ai/agent`: ^0.2.0
- `@tokenring-ai/websearch`: ^0.2.0
- `@tokenring-ai/chat`: ^0.2.0
- `puppeteer`: ^24.33.0
- `turndown`: ^7.2.2
- `zod`: ^3.22.4

## Usage

### As a Token Ring Plugin

The package automatically integrates with Token Ring applications through its plugin system:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import chromePlugin from "@tokenring-ai/chrome";

const app = new TokenRingApp();
// Plugin automatically registers tools and web search providers
```

### Web Search Provider

The `ChromeWebSearchProvider` enables web and news search functionality using Puppeteer to scrape Google search results.

#### Configuration

Configure the web search provider in your Token Ring app configuration:

```typescript
const config = {
  websearch: {
    providers: {
      chrome: {
        type: "chrome",
        launch: true // Launch new browser (true) or connect to existing (false)
      }
    }
  }
};
```

#### Usage

```typescript
import ChromeWebSearchProvider from "@tokenring-ai/chrome";

const provider = new ChromeWebSearchProvider({
  launch: true
});

// Search the web for general results
const webResults = await provider.searchWeb("TypeScript tutorial");
console.log(webResults.organic); // Array of search results with title, link, snippet

// Search news articles
const newsResults = await provider.searchNews("AI technology");
console.log(newsResults.news); // Array of news articles with title, link, source, date

// Fetch and convert page content to markdown
const pageContent = await provider.fetchPage("https://example.com");
console.log(pageContent.markdown); // Markdown-formatted content
```

### Tools

The package exports tools that can be used directly or through the Token Ring chat system:

#### scrapePageText

Extract text content from web pages using Puppeteer with intelligent content detection.

**Parameters:**
- `url` (required): The URL of the web page to scrape
- `timeoutSeconds` (optional, default: 30): Timeout for the scraping operation (5-180 seconds)
- `selector` (optional): Custom CSS selector to target specific content

**Smart Content Detection:**
If no custom selector is provided, the tool automatically selects content in this priority order:
1. `<article>` - Main article content
2. `<main>` - Main content area
3. `<body>` - Full page body as fallback

**Usage:**

```typescript
import { scrapePageText } from "@tokenring-ai/chrome/tools";

const result = await scrapePageText.execute({
  url: "https://example.com/article",
  timeoutSeconds: 60,
  selector: "article" // Optional - uses smart detection if not provided
}, agent);

console.log(result.text); // Extracted text content
console.log(result.sourceSelector); // Selector used for extraction
console.log(result.url); // Original URL
```

#### runPuppeteerScript

Run custom JavaScript scripts with full access to a Puppeteer browser instance.

**Parameters:**
- `script` (required): JavaScript code string to execute
- `navigateTo` (optional): URL to navigate to before executing the script
- `timeoutSeconds` (optional, default: 30): Script execution timeout (5-180 seconds)

**Usage:**

```typescript
import { runPuppeteerScript } from "@tokenring-ai/chrome/tools";

const result = await runPuppeteerScript.execute({
  script: `
    return async ({ page, browser, consoleLog }) => {
      consoleLog("Starting script...");
      
      // Navigate to a page if specified
      if (navigateTo) {
        await page.goto(navigateTo);
      }
      
      // Example: extract page title
      const title = await page.title();
      consoleLog("Page title:", title);
      
      return { title };
    }
  `,
  navigateTo: "https://example.com",
  timeoutSeconds: 60
}, agent);

console.log(result.result); // Script return value
console.log(result.logs); // Array of console logs
```

## API Reference

### ChromeWebSearchProvider

#### Constructor

```typescript
new ChromeWebSearchProvider(options: ChromeWebSearchOptions)
```

**Options:**
- `launch` (boolean): Whether to launch a new browser instance (true) or connect to existing browser (false)

#### Methods

**searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>**

Search Google for web results and return structured data.

**searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>**

Search Google News for articles and return structured data.

**fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>**

Fetch a web page and convert its content to Markdown format.

#### WebSearchProviderOptions

- `countryCode` (string): Geographic country code for localized results (e.g., "us", "uk")

#### Return Types

**WebSearchResult:**
```typescript
{
  organic: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
  }>;
}
```

**NewsSearchResult:**
```typescript
{
  news: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
    source: string;
    date: string;
  }>;
}
```

**WebPageResult:**
```typescript
{
  markdown: string;
}
```

### scrapePageText Tool

**Input Schema:**
```typescript
{
  url: string; // Required: URL to scrape
  timeoutSeconds?: number; // Optional: 5-180 seconds, default 30
  selector?: string; // Optional: Custom CSS selector
}
```

**Output:**
```typescript
{
  text: string; // Extracted text content
  sourceSelector: string; // CSS selector used
  url: string; // Original URL
}
```

### runPuppeteerScript Tool

**Input Schema:**
```typescript
{
  script: string; // Required: JavaScript code to execute
  navigateTo?: string; // Optional: URL to navigate to
  timeoutSeconds?: number; // Optional: 5-180 seconds, default 30
}
```

**Output:**
```typescript
{
  result: unknown; // Return value from the script
  logs: string[]; // Array of console logs
}
```

## Package Structure

The package includes the following files:

- `index.ts`: Main export file
- `ChromeWebSearchProvider.ts`: Core web search provider implementation
- `tools.ts`: Tool exports and definitions
- `tools/scrapePageText.ts`: Page scraping tool implementation
- `tools/runPuppeteerScript.ts`: Puppeteer script execution tool
- `plugin.ts`: Plugin integration for Token Ring applications
- `vitest.config.ts`: Testing configuration

## Browser Management

The package supports two modes of browser operation:

### Launch Mode (launch: true)
- Automatically launches a new Puppeteer browser instance
- Best for isolated operations
- Includes headless browser support
- Each operation gets a fresh browser instance

### Connect Mode (launch: false)
- Connects to an existing Chrome browser instance
- Better for long-running applications
- Requires pre-existing browser with remote debugging enabled
- More efficient for multiple operations

## Configuration

### Web Search Configuration

The provider integrates with Token Ring's web search system through configuration:

```typescript
import { WebSearchConfigSchema } from "@tokenring-ai/websearch";
import { ChromeWebSearchOptionsSchema } from "@tokenring-ai/chrome";

const websearchConfig = {
  providers: {
    myChromeProvider: {
      type: "chrome",
      launch: true
    }
  }
};
```

### Tool Integration

Tools are automatically registered with Token Ring's chat system and can be used directly:

```typescript
import tools from "@tokenring-ai/chrome/tools";

// Tools are exported for direct use
export default {
  scrapePageText,
};
```

## Error Handling

The package includes comprehensive error handling:

- **Network timeouts**: Configurable timeout for page operations
- **Element not found**: Graceful handling when selectors don't match
- **Browser lifecycle**: Proper cleanup of browser resources
- **Invalid URLs**: Validation of input URLs
- **Script errors**: Detailed error messages with context
- **Memory management**: Automatic browser instance cleanup

## Performance Considerations

- **Browser startup**: Launch mode includes browser initialization time
- **Memory usage**: Browser instances should be properly disposed
- **Network requests**: Consider rate limiting for production use
- **Content processing**: Markdown conversion adds processing overhead
- **Script execution**: Custom scripts can have varying performance impacts

## Development

### Build

```bash
bun run build
```

### Scripts

- `build`: Compile TypeScript with `tsc --noEmit`
- `test`: Run Vitest tests
- `test:watch`: Watch mode for testing
- `test:coverage`: Run tests with coverage report

### Testing

The package includes Vitest configuration for testing:
- Unit tests for provider methods
- Integration tests for tool functionality
- Browser automation tests
- Error handling scenarios

## License

MIT License - see LICENSE file for details.