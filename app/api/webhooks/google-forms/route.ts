import { sendWorkflowExecution } from "@/inngest/utils";
import { verifyWebhookSignature } from "@/lib/webhook-sig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const workflowId = url.searchParams.get("workflowId");
        const sig = url.searchParams.get("sig");

        if (!workflowId) {
            return NextResponse.json(
                { success: false, error: "Workflow id is required" },
                { status: 400 },
            );
        }

        // Verify the HMAC signature that is bound to this specific workflowId.
        // Rejects any request that lacks a valid credential for this workflow.
        if (!verifyWebhookSignature(workflowId, sig ?? "")) {
            console.log("unauth")
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();

        const formData = {
            formId: body.formId,
            formTitle: body.formTitle,
            responseId: body.responseId,
            timestamp: body.timestamp,
            respondentEmail: body.respondentEmail,
            responses: body.responses,
            raw: body,
        };

        await sendWorkflowExecution({
            workflowId,
            initialData: {
                googleForm: formData,
            },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("google form webhook error", error);
        return NextResponse.json(
            { success: false, error: "failed to process google form submission" },
            { status: 500 },
        );
    }
}