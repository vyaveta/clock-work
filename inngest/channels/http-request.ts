// inngest/channels/http-request.ts
import { realtime, staticSchema } from "inngest";

export const httpRequestChannel = realtime.channel({
  name: ({ name }: { name: string }) =>
    `http-request-execution`,
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