// app/actions/realtime.ts  (or wherever you keep server actions)
"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { inngest } from "@/inngest/client";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";

export async function getGoogleFormRealtimeToken(nodeId: string) {
  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  // TODO: add your auth check
  // e.g. ensure the current user owns this workflow

  const channel = googleFormTriggerChannel({ name: "google-form-trigger-execution" });

  const token = await getClientSubscriptionToken(inngest, {
    channel,
    topics: ["status"],
  });

  return token;
} 