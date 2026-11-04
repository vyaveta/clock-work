import type { NodeExecutor } from "@/features/executions/types";
import { geminiChannel } from "@/inngest/channels/gemini";
import { inngest } from "@/inngest/client";
import Handlebars from "handlebars";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { NonRetriableError } from "inngest";

Handlebars.registerHelper("json", (context: unknown) => {
    const stringified = JSON.stringify(context, null, 2)
    const safeStringified = new Handlebars.SafeString(stringified)
    return safeStringified
})

type GeminiData = {
    variableName?: string,
    model?: string,
    systemPrompt?: string,
    userPrompt?: string,
}

export const GeminiExecutor: NodeExecutor<GeminiData> = async ({
    data,
    nodeId,
    context,
    step
}) => {
    const channel = geminiChannel({ name: nodeId });

    try {

        if (!data.variableName) {
            await inngest.realtime.publish(channel.status, {
                nodeId,
                status: "error",
                error: "variable name missing for gemini node",
            });

            throw new NonRetriableError("Variable name is not provided for gemini node.")
        }
        if (!data.userPrompt) {
            await inngest.realtime.publish(channel.status, {
                nodeId,
                status: "error",
                error: "user prompt missing for gemini node",
            });

            throw new NonRetriableError("User prompt is not provided for gemini node.")
        }

        await step.realtime.publish(`status-loading-${nodeId}`, channel.status, {
            nodeId,
            status: "loading",
        });


        const systemPrompt = data.systemPrompt ? Handlebars.compile(data.systemPrompt)(context)
            : "You are a helptful assistant."

        const userPrompt = Handlebars.compile(data.userPrompt)(context)

        // todo: fetch users creds
        const credentialValue = process.env.GOOGLE_GENERATIVE_AI_API_KEY
        if (!credentialValue) {
            throw new NonRetriableError("GOOGLE_GENERATIVE_AI_API_KEY is not configured")
        }


        const google = createGoogleGenerativeAI({
            apiKey: credentialValue
        })


        try {

            const { steps } = await step.ai.wrap("google-generative-ai",
                generateText,
                {
                    model: google(data.model || "gemini-2.0-flash"),
                    system: systemPrompt,
                    prompt: userPrompt,
                    experimental_telemetry: {
                        isEnabled: true,
                        recordInputs: true,
                        recordOutputs: true,
                    }
                },
            )

            const text = steps[0].content[0].type === "text" ? steps[0].content[0].text : ""

            await step.realtime.publish(`status-success-${nodeId}`, channel.status, {
                nodeId,
                status: "success",
            });

            return {
                ...context,
                [data.variableName]: text
            }

        } catch (err) {
            throw err;
        }
    } catch (err) {
        // ── ERROR ──────────────────────────────────────────────
        const message = err instanceof Error ? err.message : "Unknown error";

        // Critical: non-durable so it always fires on failure
        await inngest.realtime.publish(channel.status, {
            nodeId,
            status: "error",
            error: message,
        });

        throw new NonRetriableError(message || "something went wrong"); // rethrow so Inngest still marks the step/run as failed
    }
}
