import { AgentStateSlice } from "@tokenring-ai/agent/types";
import deepClone from "@tokenring-ai/utility/object/deepClone";
import deepMerge from "@tokenring-ai/utility/object/deepMerge";
import markdownList from "@tokenring-ai/utility/string/markdownList";
import type { z } from "zod";
import { ChromeConfigSchema, type ParsedChromeConfig } from "../schema.ts";

const serializationSchema = ChromeConfigSchema.shape.agentDefaults;

export class ChromeState extends AgentStateSlice<typeof serializationSchema> {
  config: ParsedChromeConfig["agentDefaults"];

  constructor(readonly initialConfig: ParsedChromeConfig["agentDefaults"]) {
    super("ChromeState", serializationSchema);
    this.config = deepClone(initialConfig);
  }

  reset(): void {}

  serialize(): z.output<typeof serializationSchema> {
    return this.config;
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.config = deepMerge(this.config, data);
  }

  show(): string {
    return `Chrome:
${markdownList([`Insteance: ${this.config.instance}`])}`;
  }
}
