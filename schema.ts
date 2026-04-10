import {z} from "zod";

export const ChromeAgentConfigSchema = z
  .object({
    launch: z.boolean().optional(),
    headless: z.boolean().optional(),
    browserWSEndpoint: z.string().optional(),
    executablePath: z.string().optional(),
    screenshot: z
      .object({
        maxPixels: z.number().optional(),
      })
      .optional(),
  })
  .default({});

export const ChromeConfigSchema = z.object({
  agentDefaults: z
    .object({
      launch: z.boolean().default(true),
      headless: z.boolean().default(true),
      browserWSEndpoint: z.string().optional(),
      executablePath: z.string().optional(),
      screenshot: z
        .object({
          maxPixels: z.number().default(1000000),
        })
        .prefault({}),
    })
    .prefault({}),
});
