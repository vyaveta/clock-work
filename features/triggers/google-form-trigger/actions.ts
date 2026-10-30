"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { inngest } from "@/inngest/client";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";
import { signWorkflowId } from "@/lib/webhook-sig";

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

/**
 * Returns the full webhook URL with a workflow-bound HMAC signature embedded.
 * The raw secret never leaves the server.
 */
export async function getSignedWebhookUrl(workflowId: string): Promise<string> {
  if (!workflowId) throw new Error("workflowId is required");

  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const sig = signWorkflowId(workflowId);

  return `${baseURL}/api/webhooks/google-forms?workflowId=${workflowId}&sig=${sig}`;
}
