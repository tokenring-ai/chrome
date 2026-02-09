import type {ResetWhat} from "@tokenring-ai/agent/AgentEvents";
import type {AgentStateSlice} from "@tokenring-ai/agent/types";
import {z} from "zod";
import {ChromeConfigSchema} from "../schema.ts";

const serializationSchema = z.object({
  launch: z.boolean(),
  headless: z.boolean().optional(),
  browserWSEndpoint: z.string().optional(),
  executablePath: z.string().optional(),
});

export class ChromeState implements AgentStateSlice<typeof serializationSchema> {
  readonly name = "ChromeState";
  serializationSchema = serializationSchema;
  
  launch: boolean;
  headless?: boolean;
  browserWSEndpoint?: string;
  executablePath?: string;

  constructor(readonly initialConfig: z.output<typeof ChromeConfigSchema>["agentDefaults"]) {
    this.launch = initialConfig.launch;
    this.headless = initialConfig.headless;
    this.browserWSEndpoint = initialConfig.browserWSEndpoint;
    this.executablePath = initialConfig.executablePath;
  }

  reset(what: ResetWhat[]): void {}

  serialize(): z.output<typeof serializationSchema> {
    return {
      launch: this.launch,
      headless: this.headless,
      browserWSEndpoint: this.browserWSEndpoint,
      executablePath: this.executablePath,
    };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.launch = data.launch;
    this.headless = data.headless;
    this.browserWSEndpoint = data.browserWSEndpoint;
    this.executablePath = data.executablePath;
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
