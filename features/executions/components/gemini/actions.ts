// app/actions/realtime.ts  (or wherever you keep server actions)
"use server";

import { geminiChannel } from "@/inngest/channels/gemini";
import { inngest } from "@/inngest/client";
import { getClientSubscriptionToken } from "inngest/react";

export async function getNodeRealtimeToken(nodeId: string) {
  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  // TODO: add your auth check
  // e.g. ensure the current user owns this workflow

  const channel = geminiChannel({ name: nodeId });

  const token = await getClientSubscriptionToken(inngest, {
    channel,
    topics: ["status"],
  });

  return token;
} 
