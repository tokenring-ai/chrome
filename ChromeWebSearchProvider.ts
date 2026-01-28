import Agent from "@tokenring-ai/agent/Agent";
import WebSearchProvider, {
  type NewsSearchResult,
  type WebPageOptions,
  type WebPageResult,
  type WebSearchProviderOptions,
  type WebSearchResult
} from "@tokenring-ai/websearch/WebSearchProvider";
import TurndownService from "turndown";
import ChromeService from "./ChromeService.ts";

export default class ChromeWebSearchProvider extends WebSearchProvider {
  constructor(private chromeService: ChromeService) {
    super();
  }

  async searchWeb(query: string, options?: WebSearchProviderOptions, agent?: Agent): Promise<WebSearchResult> {
    if (!agent) throw new Error("Agent required for ChromeWebSearchProvider");
    let browser = await this.chromeService.getBrowser(agent);

    const page = await browser.newPage();

    try {
      let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      if (options?.countryCode) {
        searchUrl += `&gl=${options.countryCode}`;
      }

      await page.goto(searchUrl, {waitUntil: 'networkidle0'});
      await page.waitForSelector('[data-ved]');

      const organic = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-ved] h3')).map((el, i) => ({
          position: i + 1,
          title: el.textContent || '',
          link: el.closest('a')?.href || '',
          snippet: el.closest('div[lang=en][data-ved]')?.querySelector('[data-sncf]')?.textContent || ''
        }));
      });

      return {organic};
    } finally {
      await page.close();
      await browser.disconnect();
    }
  }

  async searchNews(query: string, options?: WebSearchProviderOptions, agent?: Agent): Promise<NewsSearchResult> {
    if (!agent) throw new Error("Agent required for ChromeWebSearchProvider");
    const browser = await this.chromeService.getBrowser(agent);
    const page = await browser.newPage();

    try {
      let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`;
      if (options?.countryCode) {
        searchUrl += `&gl=${options.countryCode}`;
      }

      await page.goto(searchUrl, {waitUntil: 'networkidle0'});

      const news = await page.evaluate(() => {
        // Find all news article containers using data attributes only
        const articles = Array.from(document.querySelectorAll('[data-news-doc-id]'));

        return articles.map((article, i) => {
          // Find the main link element using data attributes
          const linkElement = article.querySelector('a[data-ved]') as HTMLAnchorElement;

          // Extract title - look for elements with role="heading" or aria-level attribute
          const titleElement = article.querySelector('[role="heading"]') ||
            article.querySelector('[aria-level]');

          // Extract snippet - find text content in divs, excluding those with specific data attributes
          let snippetText = '';
          const allDivs = article.querySelectorAll('div:not([data-ved]):not([data-hveid])');
          for (const div of allDivs) {
            // Look for divs containing text but not other nested structures
            if (div.textContent && div.children.length <= 1 && !div.querySelector('[role="heading"]')) {
              const text = div.textContent.trim();
              if (text.length > 20 && text.length < 500) { // Reasonable snippet length
                snippetText = text;
                break;
              }
            }
          }

          // Extract source - look for spans near images or within specific structural positions
          let sourceText = '';
          const imgElements = article.querySelectorAll('img[alt=""], img[data-atf]');
          for (const img of imgElements) {
            const nearbySpan = img.parentElement?.parentElement?.querySelector('span');
            if (nearbySpan && nearbySpan.textContent) {
              sourceText = nearbySpan.textContent.trim();
              break;
            }
          }

          // Extract timestamp using data attributes or spans with date-like content
          const timestampElement = article.querySelector('[data-ts]') ||
            article.querySelector('span[tabindex="-1"]')?.previousElementSibling;

          return {
            position: i + 1,
            title: titleElement?.textContent?.trim() || '',
            link: linkElement?.href || '',
            snippet: snippetText,
            source: sourceText,
            date: timestampElement?.textContent?.trim() || ''
          };
        }).filter(item => item.title && item.link); // Filter out any empty results
      });

      return {news};
    } finally {
      await page.close();
      await browser.disconnect();
    }
  }


  async fetchPage(url: string, options?: WebPageOptions, agent?: Agent): Promise<WebPageResult> {
    if (!agent) throw new Error("Agent required for ChromeWebSearchProvider");
    const browser = await this.chromeService.getBrowser(agent);
    const page = await browser.newPage();

    try {
      await page.goto(url, {waitUntil: options?.render ? 'networkidle0' : 'domcontentloaded'});

      const html = await page.content();

      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(html);

      return {markdown};
    } finally {
      await page.close();
      await browser.disconnect();
    }
  }

}