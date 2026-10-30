// inngest/channels/http-request.ts
import { realtime, staticSchema } from "inngest";

export const googleFormTriggerChannel = realtime.channel({
  name: ({ name }: { name: string }) =>
    `google-form-trigger-execution`,
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