// inngest/channels/http-request.ts
import { realtime, staticSchema } from "inngest";

export const geminiChannel = realtime.channel({
  name: ({ name }: { name: string }) =>
    `gemini-execution:${name}`,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
        error?: string;
      }>(),
    },
  },
});
