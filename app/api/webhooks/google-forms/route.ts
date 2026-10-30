import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";
import { sendWorkflowExecution } from "@/inngest/utils";
import { timeStamp } from "console";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {

        // const channel = googleFormTriggerChannel({})

        const url = new URL(request.url)
        const workflowId = url.searchParams.get("workflowId")

        if (!workflowId) return NextResponse.json(
            {
                success: false,
                error: "Workflow id is required",
            },
            { status: 400 }
        )

        const body = await request.json()

        const formData = {
            formId: body.formId,
            formTitle: body.formTitle,
            responseId: body.responseId,
            timestamp:  body.timestamp,
            respondentEmail: body.respondentEmail,
            responses: body.responses,
            raw: body,
        }

        sendWorkflowExecution({
            workflowId,
            initialData: {
                googleForm: formData,
            }
        })

        


    } catch (error) {
        console.error("google form webhook error", error)
        return NextResponse.json({
            success: false,
            error: "failed to process google form submission",
        },
            { status: 500 })
    }
}