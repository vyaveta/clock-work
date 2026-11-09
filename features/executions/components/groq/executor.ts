import type { NodeExecutor } from "@/features/executions/types";
import { groqChannel } from "@/inngest/channels/groq";
import { inngest } from "@/inngest/client";
import Handlebars from "handlebars";

import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { NonRetriableError } from "inngest";

Handlebars.registerHelper("json", (context: unknown) => {
    const stringified = JSON.stringify(context, null, 2)
    const safeStringified = new Handlebars.SafeString(stringified)
    return safeStringified
})

type GroqData = {
    variableName?: string,
    model?: string,
    systemPrompt?: string,
    userPrompt?: string,
}

export const GroqExecutor: NodeExecutor<GroqData> = async ({
    data,
    nodeId,
    context,
    step
}) => {
    const channel = groqChannel({ name: nodeId });

    try {

        if (!data.variableName) {
            await inngest.realtime.publish(channel.status, {
                nodeId,
                status: "error",
                error: "variable name missing for groq node",
            });

            throw new NonRetriableError("Variable name is not provided for groq node.")
        }
        if (!data.userPrompt) {
            await inngest.realtime.publish(channel.status, {
                nodeId,
                status: "error",
                error: "user prompt missing for groq node",
            });

            throw new NonRetriableError("User prompt is not provided for groq node.")
        }

        await step.realtime.publish(`status-loading-${nodeId}`, channel.status, {
            nodeId,
            status: "loading",
        });


        const systemPrompt = data.systemPrompt ? Handlebars.compile(data.systemPrompt)(context)
            : "You are a helptful assistant."

        const userPrompt = Handlebars.compile(data.userPrompt)(context)

        // todo: fetch users creds
        const credentialValue = process.env.GROQ_API_KEY
        if (!credentialValue) {
            throw new NonRetriableError("GROQ_API_KEY is not configured")
        }


        const modelId = data.model?.trim();
        if (!modelId) {
            throw new NonRetriableError("Choose a Groq model in the node settings before running this workflow.");
        }

        const groq = createGroq({
            apiKey: credentialValue
        })


        try {

            const { steps } = await step.ai.wrap("groq",
                generateText,
                {
                    //@ts-ignore
                    model: groq(modelId),
                    system: systemPrompt,
                    prompt: userPrompt,
                    experimental_telemetry: {
                        isEnabled: true,
                        recordInputs: true,
                        recordOutputs: true,
                    }
                },
            )

            const content = Array.isArray(steps?.[0]?.content) ? steps[0].content : [];

            const text = content.find(c => c?.type === "text")?.text ?? "";

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
