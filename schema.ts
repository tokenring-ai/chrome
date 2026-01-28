import {z} from "zod";

export const ChromeAgentConfigSchema = z.object({
  launch: z.boolean().optional(),
  headless: z.boolean().optional(),
  browserWSEndpoint: z.string().optional(),
  executablePath: z.string().optional(),
}).strict().default({});

export const ChromeConfigSchema = z.object({
  agentDefaults: z.object({
    launch: z.boolean().default(true),
    headless: z.boolean().default(true),
    browserWSEndpoint: z.string().optional(),
    executablePath: z.string().optional(),
  }),
}).strict();

export type ChromeAgentConfig = {
  chrome: z.input<typeof ChromeAgentConfigSchema>
};
