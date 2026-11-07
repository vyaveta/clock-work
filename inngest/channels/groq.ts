// inngest/channels/http-request.ts
import { realtime, staticSchema } from "inngest";

export const groqChannel = realtime.channel({
  name: ({ name }: { name: string }) =>
    `groq-execution:${name}`,
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
