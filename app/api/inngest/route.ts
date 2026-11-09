import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { executeWorkflow } from "@/inngest/functions";
import { executeScheduledWorkflow } from "@/inngest/scheduled-workflow";
import { processOutreach } from "@/inngest/outreach";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeWorkflow,
    executeScheduledWorkflow,
    processOutreach,
  ],
});
