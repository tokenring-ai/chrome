import TokenRingApp from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {WebSearchConfigSchema, WebSearchService} from "@tokenring-ai/websearch";
import ChromeWebSearchProvider, {ChromeWebSearchOptionsSchema} from "./ChromeWebSearchProvider.js";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools.ts";

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(packageJSON.name, tools)
    );
    const websearchConfig = app.getConfigSlice("websearch", WebSearchConfigSchema);

    if (websearchConfig) {
      app.waitForService(WebSearchService, cdnService => {
        for (const name in websearchConfig.providers) {
          const provider = websearchConfig.providers[name];
          if (provider.type === "chrome") {
            cdnService.registerProvider(name, new ChromeWebSearchProvider(ChromeWebSearchOptionsSchema.parse(provider)));
          }
        }
      });
    }
  }
} satisfies TokenRingPlugin;

export {default as ChromeWebSearchProvider} from "./ChromeWebSearchProvider.ts";
