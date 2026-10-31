// src/lib/webhooks/signature.ts
import "server-only"; // blocks accidental client imports

import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret = process.env.GOOGLE_FORMS_WEBHOOK_SECRET;
  if (!secret) throw new Error("GOOGLE_FORMS_WEBHOOK_SECRET is not set");
  return secret;
}

export function signWorkflowId(workflowId: string): string {
  return createHmac("sha256", getSecret()).update(workflowId).digest("hex");
}

export function verifyWebhookSignature(
  workflowId: string,
  providedSig: string,
): boolean {
  if (!providedSig) return false;
  const expected = signWorkflowId(workflowId);
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(providedSig, "hex"),
    );
  } catch {
    return false;
  }
}