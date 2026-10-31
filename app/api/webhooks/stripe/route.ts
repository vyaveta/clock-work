import { sendWorkflowExecution } from "@/inngest/utils";
import { verifyWebhookSignature } from "@/lib/webhooks/signature";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        console.log("got it")
        const url = new URL(request.url);
        const workflowId = url.searchParams.get("workflowId");
        const sig = url.searchParams.get("sig");

        if (!workflowId) {
            return NextResponse.json(
                { success: false, error: "Workflow id is required" },
                { status: 400 },
            );
        }

        console.log("we got the event")

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

        const stripeData = {
           //event meta data
           eventId: body.id,
           eventType: body.type,
           timestamp: body.created,
           livemode: body.livemode,
           data: body.data?.object,
           raw: body
        };

        await sendWorkflowExecution({
            workflowId,
            initialData: {
                stripe: stripeData,
            },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("stripe  webhook error", error);
        return NextResponse.json(
            { success: false, error: "failed to process stripe event" },
            { status: 500 },
        );
    }
}