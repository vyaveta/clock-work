"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { inngest } from "@/inngest/client";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";

export async function getManualTriggerRealtimeToken(nodeId: string) {
  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  const channel = manualTriggerChannel({ name: "manual-trigger-execution" });

  return getClientSubscriptionToken(inngest, {
    channel,
    topics: ["status"],
  });
}
