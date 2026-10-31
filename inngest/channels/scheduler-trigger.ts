import { realtime, staticSchema } from "inngest";

export const schedulerTriggerChannel = realtime.channel({
  name: () => "scheduler-trigger-execution",
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
