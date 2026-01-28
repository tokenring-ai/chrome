import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {WebSearchService} from "@tokenring-ai/websearch";
import {z} from "zod";
import ChromeWebSearchProvider from "./ChromeWebSearchProvider.js";
import ChromeService from "./ChromeService.js";
import packageJSON from './package.json' with {type: 'json'};
import {ChromeConfigSchema} from "./schema.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  chrome: ChromeConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );

    if (config.chrome) {
      const chromeService = new ChromeService(config.chrome);
      app.addServices(chromeService);

      app.waitForService(WebSearchService, websearchService => {
        websearchService.registerProvider(
          'chrome',
          new ChromeWebSearchProvider(chromeService)
        );
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
