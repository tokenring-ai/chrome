import {AgentTeam, TokenRingPackage} from "@tokenring-ai/agent";
import {AIService} from "@tokenring-ai/ai-client";
import {WebSearchConfigSchema, WebSearchService} from "@tokenring-ai/websearch";
import ChromeWebSearchProvider, {ChromeWebSearchOptionsSchema} from "./ChromeWebSearchProvider.js";
import packageJSON from './package.json' with {type: 'json'};
import * as tools from "./tools.ts";

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(agentTeam: AgentTeam) {
    agentTeam.waitForService(AIService, aiService =>
      aiService.addTools(packageJSON.name, tools)
    );
    const websearchConfig = agentTeam.getConfigSlice("websearch", WebSearchConfigSchema);

    if (websearchConfig) {
      agentTeam.waitForService(WebSearchService, cdnService => {
        for (const name in websearchConfig.providers) {
          const provider = websearchConfig.providers[name];
          if (provider.type === "chrome") {
            cdnService.registerProvider(name, new ChromeWebSearchProvider(ChromeWebSearchOptionsSchema.parse(provider)));
          }
        }
      });
    }
  }
} as TokenRingPackage;

export {default as ChromeWebSearchProvider} from "./ChromeWebSearchProvider.ts";
