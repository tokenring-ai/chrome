# @tokenring-ai/chrome

## Overview
The Chrome Plugin provides browser automation capabilities for Token Ring using Puppeteer. It integrates with the WebSearchService to provide Chrome-based web search and news search providers, and adds tools for web scraping via the chat service.

## Chat Commands

This package does not register chat commands directly. Instead, it provides tools that can be used by agents.

## Plugin Configuration

The plugin supports configuration via the `chrome` section of the app config:

```typescript
interface ChromeConfig {
  websearch?: {
    providers: {
      [name: string]: {
        type: 'chrome';
        launch?: boolean;
      };
    };
  };
}
```

Example configuration:
```typescript
import { TokenRingApp } from '@tokenring-ai/app';

const app = new TokenRingApp({
  chrome: {
    websearch: {
      providers: {
        'default-chrome': {
          type: 'chrome',
          launch: true,
        },
      },
    },
  },
});
```

## Tools

### chrome_scrapePageText

Scrape text content from a web page using Puppeteer. By default, it prioritizes content from 'article', 'main', or 'body' tags in that order.

**Parameters:**
- `url` (string, required): The URL of the web page to scrape text from.
- `timeoutSeconds` (number, optional): Timeout for the scraping operation (default: 30s, min: 5s, max: 180s).
- `selector` (string, optional): Custom CSS selector to target specific content.

**Returns:**
```typescript
{
  text: string;        // Extracted text content
  sourceSelector: string; // The selector that was used
  url: string;         // Original URL
}
```

**Example:**
```typescript
const result = await tools.chrome_scrapePageText({
  url: 'https://example.com/article',
  selector: 'article',
  timeoutSeconds: 60,
});
console.log(result.text);
```

## Services

### ChromeWebSearchProvider

The ChromeWebSearchProvider class implements the WebSearchProvider interface for the WebSearchService. It uses Puppeteer to interact with websites for searching and content fetching.

**Constructor:**
```typescript
constructor(options: ChromeWebSearchOptions)
```

**Options:**
```typescript
interface ChromeWebSearchOptions {
  launch?: boolean;  // Whether to launch a new browser instance
}
```

**Methods:**

- `searchWeb(query, options?)`: Perform a web search and return organic results.
  - Parameters:
    - `query` (string): Search query
    - `options` (WebSearchProviderOptions, optional): Search options including `countryCode`
  - Returns: `{ organic: WebSearchResult[] }`

- `searchNews(query, options?)`: Perform a news search and return news articles.
  - Parameters:
    - `query` (string): Search query
    - `options` (WebSearchProviderOptions, optional): Search options including `countryCode`
  - Returns: `{ news: NewsSearchResult[] }`

- `fetchPage(url, options?)`: Fetch a page and convert HTML to Markdown.
  - Parameters:
    - `url` (string): URL to fetch
    - `options` (WebPageOptions, optional): Page options including `render`
  - Returns: `{ markdown: string }`

**Example:**
```typescript
import ChromeWebSearchProvider from '@tokenring-ai/chrome/ChromeWebSearchProvider';

const provider = new ChromeWebSearchProvider({ launch: true });
const results = await provider.searchWeb('TypeScript documentation', { countryCode: 'us' });
console.log(results.organic);
```

## Providers

### ChromeWebSearchOptionsSchema

Zod schema for ChromeWebSearchProvider options:

```typescript
import { ChromeWebSearchOptionsSchema } from '@tokenring-ai/chrome';

const options = ChromeWebSearchOptionsSchema.parse({ launch: true });
```

## RPC Endpoints

This package does not define RPC endpoints.

## State Management

This package does not implement state management.

## License

MIT License - see [LICENSE](./LICENSE) file for details.
