import {z} from "zod";

export const ChromeInstanceConfigSchema = z
  .object({
    launch: z.boolean().default(true),
    headless: z.boolean().default(false),
    browserWSEndpoint: z.string().optional(),
    executablePath: z.string().optional(),
    screenshot: z
      .object({
        maxPixels: z.number().default(1000000),
      })
      .prefault({}),
  });

export const ChromeAgentConfigSchema = z.object({
  instance: z.string().optional(),
}).prefault({});

export const ChromeConfigSchema = z.object({
  instances: z.record(z.string(), ChromeInstanceConfigSchema).prefault({
    "chrome": {}
  }),
  agentDefaults: z.object({
    instance: z.string().default("chrome"),
  }).prefault({}),
});

export type ChromeConfig = z.input<typeof ChromeConfigSchema>;
export type ParsedChromeConfig = z.output<typeof ChromeConfigSchema>;
