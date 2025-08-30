import WebSearchProvider, {type WebSearchProviderOptions, type WebSearchResult, type WebPageOptions, type WebPageResult} from "@token-ring/websearch/WebSearchProvider";
import puppeteer, {ConnectOptions, LaunchOptions} from "puppeteer";

export type ChromeWebSearchOptions =
  | ConnectOptions & { launch: false }
  | LaunchOptions & { launch: true };

export default class ChromeWebSearchResource extends WebSearchProvider {
  private readonly options: ChromeWebSearchOptions;
  constructor(options: ChromeWebSearchOptions) {
    super();
    this.options = options;
  }
  async searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult> {
    let browser = await this.getBrowser();

    const page = await browser.newPage();
    
    try {
      let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      if (options?.countryCode) {
        searchUrl += `&gl=${options.countryCode}`;
      }
      
      await page.goto(searchUrl, {waitUntil: 'networkidle0'});
      await page.waitForSelector('[data-ved]');

      debugger;


      const results = await page.evaluate(() => {
        const organic = Array.from(document.querySelectorAll('[data-ved] h3')).map((el, i) => ({
          position: i + 1,
          title: el.textContent,
          link: el.closest('a')?.href,
          snippet: el.closest('div[lang=en][data-ved]')?.querySelector('[data-sncf]')?.textContent
        }));
        return {organic};
      });
      
      return {results};
    } finally {
      await page.close();
      await browser.disconnect();
    }
  }

  private async getBrowser() {
    if (this.options.launch) {
      return await puppeteer.launch(this.options);
    } else {
      return await puppeteer.connect(this.options);
    }
  }

  async searchNews(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`;
      if (options?.countryCode) {
        searchUrl += `&gl=${options.countryCode}`;
      }
      
      await page.goto(searchUrl, {waitUntil: 'networkidle0'});
      
      const results = await page.evaluate(() => {
        const news = Array.from(document.querySelectorAll('[data-ved] h3')).map((el, i) => ({
          position: i + 1,
          title: el.textContent,
          link: el.closest('a')?.href,
          snippet: el.closest('[data-ved]')?.querySelector('[data-sncf]')?.textContent,
          source: el.closest('[data-ved]')?.querySelector('[data-source]')?.textContent
        }));
        return {news};
      });
      
      return {results};
    } finally {
      await page.close();
      await browser.disconnect();
    }
  }

  async fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      await page.goto(url, {waitUntil: options?.render ? 'networkidle0' : 'domcontentloaded'});
      
      const html = await page.content();
      return {html};
    } finally {
      await page.close();
      await browser.disconnect();
    }
  }
}