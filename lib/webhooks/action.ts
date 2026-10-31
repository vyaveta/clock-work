// src/lib/webhooks/actions.ts
"use server";

import { signWorkflowId } from "./signature";


export async function getSignedWebhookUrl({
  workflowId,
  feature,
}: {
  workflowId: string;
  feature: "google-forms" | "stripe";
}): Promise<string> {
  if (!workflowId) throw new Error("workflowId is required");

  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const sig = signWorkflowId(workflowId);

  return `${baseURL}/api/webhooks/${feature}?workflowId=${encodeURIComponent(workflowId)}&sig=${sig}`;
}