import { realtime, staticSchema } from "inngest";

export const manualTriggerChannel = realtime.channel({
  name: ({ name }: { name: string }) => name,
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
