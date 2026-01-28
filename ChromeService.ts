import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingService} from "@tokenring-ai/app/types";
import deepMerge from "@tokenring-ai/utility/object/deepMerge";
import puppeteer, {Browser, ConnectOptions, LaunchOptions} from "puppeteer";
import {z} from "zod";
import {ChromeAgentConfigSchema, ChromeConfigSchema} from "./schema.ts";
import {ChromeState} from "./state/chromeState.ts";

export default class ChromeService implements TokenRingService {
  name = "ChromeService";
  description = "Chrome browser automation service";

  constructor(private options: z.output<typeof ChromeConfigSchema>) {}

  run(): void {}

  attach(agent: Agent): void {
    const config = deepMerge(this.options.agentDefaults, agent.getAgentConfigSlice('chrome', ChromeAgentConfigSchema));
    agent.initializeState(ChromeState, config);
  }

  async getBrowser(agent: Agent): Promise<Browser> {
    const state = agent.getState(ChromeState);
    
    if (state.launch) {
      return await puppeteer.launch(state as LaunchOptions);
    } else {
      return await puppeteer.connect(state as ConnectOptions);
    }
  }
}
