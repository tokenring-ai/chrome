import type Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingService} from "@tokenring-ai/app/types";
import deepMerge from "@tokenring-ai/utility/object/deepMerge";
import KeyedRegistry from "@tokenring-ai/utility/registry/KeyedRegistry";
import type {Browser} from "puppeteer";
import type {z} from "zod";
import ChromeWebSearchProvider from "./ChromeWebSearchProvider.ts";
import {ChromeAgentConfigSchema, type ChromeConfigSchema} from "./schema.ts";
import {ChromeState} from "./state/chromeState.ts";

export default class ChromeService implements TokenRingService {
  readonly name = "ChromeService";
  description = "Chrome browser automation service";

  instances = new KeyedRegistry<ChromeWebSearchProvider>();
  getInstanceEntries = this.instances.entries;

  constructor(private options: z.output<typeof ChromeConfigSchema>) {
    for (const [name, providerConfig] of Object.entries(options.instances)) {
      this.instances.set(name, new ChromeWebSearchProvider(providerConfig));
    }
  }

  requireInstance(agent: Agent) {
    const {config} = agent.getState(ChromeState);

    if (!config.instance) {
      throw new Error("Chrome instance not configured");
    }

    return this.instances.require(config.instance);
  }

  attach(agent: Agent): void {
    const config = deepMerge(
      this.options.agentDefaults,
      agent.getAgentConfigSlice("chrome", ChromeAgentConfigSchema),
    );
    agent.initializeState(ChromeState, config);
  }

  getBrowser(agent: Agent): Promise<Browser> {
    const {config} = agent.getState(ChromeState);

    const instance = this.instances.require(config.instance);

    return instance.getBrowser();
  }
}
