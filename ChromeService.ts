import type Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingService} from "@tokenring-ai/app/types";
import deepMerge from "@tokenring-ai/utility/object/deepMerge";
import puppeteer, {type Browser, type ConnectOptions, type LaunchOptions} from "puppeteer";
import type {z} from "zod";
import {ChromeAgentConfigSchema, type ChromeConfigSchema} from "./schema.ts";
import {ChromeState} from "./state/chromeState.ts";

export default class ChromeService implements TokenRingService {
  readonly name = "ChromeService";
  description = "Chrome browser automation service";

  constructor(private options: z.output<typeof ChromeConfigSchema>) {
  }

  attach(agent: Agent): void {
    const config = deepMerge(
      this.options.agentDefaults,
      agent.getAgentConfigSlice("chrome", ChromeAgentConfigSchema),
    );
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
