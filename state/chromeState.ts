import {AgentStateSlice} from "@tokenring-ai/agent/types";
import {z} from "zod";
import {ChromeConfigSchema} from "../schema.ts";

const serializationSchema = z.object({
  launch: z.boolean(),
  headless: z.boolean(),
  browserWSEndpoint: z.string().optional(),
  executablePath: z.string().optional(),
  screenshot: z.object({
    maxPixels: z.number()
  })
});

export class ChromeState extends AgentStateSlice<typeof serializationSchema> {
  launch: boolean;
  headless: boolean;
  browserWSEndpoint?: string;
  executablePath?: string;
  screenshot: {
    maxPixels: number;
  };

  constructor(readonly initialConfig: z.output<typeof ChromeConfigSchema>["agentDefaults"]) {
    super("ChromeState", serializationSchema);
    this.launch = initialConfig.launch;
    this.headless = initialConfig.headless;
    this.browserWSEndpoint = initialConfig.browserWSEndpoint;
    this.executablePath = initialConfig.executablePath;
    this.screenshot = { ... initialConfig.screenshot };
  }

  reset(): void {}

  serialize(): z.output<typeof serializationSchema> {
    return {
      launch: this.launch,
      headless: this.headless,
      browserWSEndpoint: this.browserWSEndpoint,
      executablePath: this.executablePath,
      screenshot: this.screenshot,
    };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.launch = data.launch;
    this.headless = data.headless;
    this.browserWSEndpoint = data.browserWSEndpoint;
    this.executablePath = data.executablePath;
    this.screenshot = data.screenshot;
  }

  show(): string[] {
    return [
      `Launch: ${this.launch}`,
      `Headless: ${this.headless}`,
      `Browser WS Endpoint: ${this.browserWSEndpoint || 'N/A'}`,
      `Executable Path: ${this.executablePath || 'N/A'}`,
    ];
  }
}
