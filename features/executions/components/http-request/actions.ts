// app/actions/realtime.ts  (or wherever you keep server actions)
"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { inngest } from "@/inngest/client";
import { httpRequestChannel } from "@/inngest/channels/http-request";

export async function getNodeRealtimeToken(nodeId: string) {
  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  // TODO: add your auth check
  // e.g. ensure the current user owns this workflow

  const channel = httpRequestChannel({ name: "http-request-execution" });

  const token = await getClientSubscriptionToken(inngest, {
    channel,
    topics: ["status"],
  });

  return token;
} 