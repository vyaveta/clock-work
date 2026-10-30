/**
 * Server-only utility for Google Forms webhook signature.
 * Uses HMAC-SHA256(GOOGLE_FORMS_WEBHOOK_SECRET, workflowId).
 * Never import this in client components.
 */
import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
    const secret = process.env.GOOGLE_FORMS_WEBHOOK_SECRET;
    if (!secret) throw new Error("GOOGLE_FORMS_WEBHOOK_SECRET is not set");
    return secret;
}

/** Compute the expected HMAC signature for a given workflowId. */
export function signWorkflowId(workflowId: string): string {
    return createHmac("sha256", getSecret())
        .update(workflowId)
        .digest("hex");
}

/**
 * Timing-safe comparison of the provided signature against the expected one.
 * Returns false if either value is missing or lengths differ.
 */
export function verifyWebhookSignature(workflowId: string, providedSig: string): boolean {
    if (!providedSig) return false;
    const expected = signWorkflowId(workflowId);
    try {
        return timingSafeEqual(
            Buffer.from(expected, "hex"),
            Buffer.from(providedSig, "hex"),
        );
    } catch {
        // Buffer.from throws if the hex string is malformed / wrong length
        return false;
    }
}

