export function execute({ script, navigateTo, timeoutSeconds }: {
    script: any;
    navigateTo: any;
    timeoutSeconds?: number;
}, registry: any): Promise<{
    ok: boolean;
    result: any;
    logs: any[];
    error: any;
}>;
export default execute;
export const description: "Run a Puppeteer script with access to a browser and page. Accepts a JavaScript function or module as a string, executes it with Puppeteer page instance, and returns the result.";
export const parameters: z.ZodObject<{
    script: z.ZodString;
    navigateTo: z.ZodOptional<z.ZodString>;
    timeoutSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    script?: string;
    navigateTo?: string;
    timeoutSeconds?: number;
}, {
    script?: string;
    navigateTo?: string;
    timeoutSeconds?: number;
}>;
import { z } from "zod";
