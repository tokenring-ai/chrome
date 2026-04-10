import type {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {WebSearchService} from "@tokenring-ai/websearch";
import {z} from "zod";
import ChromeService from "./ChromeService.ts";
import ChromeWebSearchProvider from "./ChromeWebSearchProvider.ts";
import packageJSON from "./package.json" with {type: "json"};
import {ChromeConfigSchema} from "./schema.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  chrome: ChromeConfigSchema.prefault({}),
});

export default {
  name: packageJSON.name,
  displayName: "Chrome Automation",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, (chatService) =>
      chatService.addTools(tools),
    );
    const chromeService = new ChromeService(config.chrome);
    app.addServices(chromeService);

    app.waitForService(WebSearchService, (websearchService) => {
      websearchService.registerProvider(
        "chrome",
        new ChromeWebSearchProvider(chromeService),
      );
    });
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
