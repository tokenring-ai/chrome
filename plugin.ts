import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {WebSearchConfigSchema, WebSearchService} from "@tokenring-ai/websearch";
import {z} from "zod";
import ChromeWebSearchProvider, {ChromeWebSearchOptionsSchema} from "./ChromeWebSearchProvider.js";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  websearch: WebSearchConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );

    if (config.websearch) {
      app.waitForService(WebSearchService, cdnService => {
        for (const name in config.websearch!.providers) {
          const provider = config.websearch!.providers[name];
          if (provider.type === "chrome") {
            cdnService.registerProvider(name, new ChromeWebSearchProvider(ChromeWebSearchOptionsSchema.parse(provider)));
          }
        }
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
