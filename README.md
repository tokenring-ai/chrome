# @tokenring-ai/chrome

Chrome browser automation utilities for the Token Ring ecosystem, providing web search capabilities and page scraping tools.

## Overview

This package provides Chrome browser automation utilities for the Token Ring ecosystem. It includes:

- **Web Search Provider**: Chrome-based web and news search functionality
- **Page Scraping Tool**: Extract text content from web pages
- **Puppeteer Script Runner**: Execute custom Puppeteer scripts in a managed browser context

## Installation

This package is part of the monorepo and is typically consumed by the Token Ring runtime. If you need to depend on it directly:

```bash
npm install @tokenring-ai/chrome
```

### Dependencies

- `@tokenring-ai/agent`: ^0.1.0
- `@tokenring-ai/websearch`: ^0.1.0
- `puppeteer`: ^24.31.0
- `turndown`: ^7.2.2

## Usage

### As a Token Ring Plugin

The package can be used as a Token Ring plugin that automatically registers tools and web search providers:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import chromePlugin from "@tokenring-ai/chrome";

const app = new TokenRingApp();
app.registerPlugin(chromePlugin);
```

### Web Search Provider

The ChromeWebSearchProvider enables web and news search functionality using Puppeteer to scrape search results.

#### Configuration

Configure the web search provider in your Token Ring app configuration:

```typescript
const config = {
  websearch: {
    providers: {
      chrome: {
        type: "chrome",
        launch: true // or false to connect to existing browser
      }
    }
  }
};
```

#### Usage

```typescript
import { ChromeWebSearchProvider } from "@tokenring-ai/chrome";

const provider = new ChromeWebSearchProvider({
  launch: true
});

// Search the web
const webResults = await provider.searchWeb("TypeScript tutorial");

// Search news
const newsResults = await provider.searchNews("AI technology");

// Fetch and convert page content to markdown
const pageContent = await provider.fetchPage("https://example.com");
```

### Tools

#### scrapePageText

Extract text content from web pages using Puppeteer.

**Parameters:**
- `url` (required): The URL of the web page to scrape
- `timeoutSeconds` (optional, default: 30): Timeout for the scraping operation (5-180 seconds)
- `selector` (optional): Custom CSS selector to target specific content. If not provided, uses 'article', 'main', or 'body' in priority order.

**Usage:**
```typescript
import { scrapePageText } from "@tokenring-ai/chrome/tools";

const result = await scrapePageText.execute({
  url: "https://example.com/article",
  selector: "article" // Optional
}, agent);

console.log(result.text); // Extracted text content
console.log(result.sourceSelector); // Selector used for extraction
console.log(result.url); // Original URL
```

#### runPuppeteerScript

Execute custom Puppeteer scripts in a managed browser context.

**Parameters:**
- `script` (required): A JavaScript code string that evaluates to an async function
- `navigateTo` (optional): URL to load before executing the script
- `timeoutSeconds` (optional, default: 30): Maximum execution time (5-180 seconds)

**Usage:**
```typescript
import { runPuppeteerScript } from "@tokenring-ai/chrome/tools";

const script = `
  async ({ page, browser, consoleLog }) => {
    await page.goto('https://example.com', { waitUntil: 'load' });
    const title = await page.title();
    consoleLog('Page title:', title);
    return { title };
  }
`;

const result = await runPuppeteerScript.execute({
  script,
  navigateTo: "https://example.com"
}, agent);

console.log(result.result); // { title: "Example Domain" }
console.log(result.logs); // ["Page title: Example Domain"]
```

## API Reference

### ChromeWebSearchProvider

#### Constructor

```typescript
new ChromeWebSearchProvider(options: ChromeWebSearchOptions)
```

**Options:**
- `launch` (boolean): Whether to launch a new browser instance (true) or connect to existing (false)

#### Methods

- `searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`
- `searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>`
- `fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>`

### Tool Definitions

Both tools implement the `TokenRingToolDefinition` interface and provide:

- `name`: Tool identifier
- `description`: Human-readable description
- `inputSchema`: Zod schema for input validation
- `execute`: Async execution function

## Development

### Build

```bash
npm run build
```

### Scripts

- `build`: Compile TypeScript with `tsc -p tsconfig.tson`

## License

MIT License - see LICENSE file for details.