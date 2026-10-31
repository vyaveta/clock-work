"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { inngest } from "@/inngest/client";
import { schedulerTriggerChannel } from "@/inngest/channels/scheduler-trigger";

export async function getSchedulerRealtimeToken(nodeId: string) {
  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  return getClientSubscriptionToken(inngest, {
    channel: schedulerTriggerChannel(),
    topics: ["status"],
  });
}
