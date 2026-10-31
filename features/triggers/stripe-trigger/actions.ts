"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { inngest } from "@/inngest/client";
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger";

export async function getStripeRealtimeToken(nodeId: string) {
  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  // TODO: add your auth check
  // e.g. ensure the current user owns this workflow

  const channel = stripeTriggerChannel({ name: "stripe-trigger-execution" });

  const token = await getClientSubscriptionToken(inngest, {
    channel,
    topics: ["status"],
  });

  return token;
}

