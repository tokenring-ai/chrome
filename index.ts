export const name = "@token-ring/chrome" as const;
export const description =
	"Automate and script Chrome browser actions using Puppeteer. Allows running arbitrary scripts in a headless browser and return the result." as const;
export const version = "0.1.0" as const;

// Keep runtime resolution to existing JS bundle
export * as tools from "./tools.ts";
