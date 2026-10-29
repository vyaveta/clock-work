import { NodeType } from "@/lib/generated/prisma/enums";
import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import Handlebars from "handlebars"
import { httpRequestChannel } from "@/inngest/channels/http-request";
import { inngest } from "@/inngest/client";

Handlebars.registerHelper("json", (context: unknown) => {
    const stringified = JSON.stringify(context, null, 2)
    const safeStringified = new Handlebars.SafeString(stringified)
    return safeStringified
})

type HttpRequestData = {
    variableName: string,
    endpoint: string,
    method: "GET" | "PUT" | "PATCH" | "POST" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE" | "CONNECT"
    body?: string,
    workflowId: string;
}

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
    data,
    nodeId,
    workflowId,
    context,
    step
}) => {
    const channel = httpRequestChannel({ name: 'http-request-execution' });

    await step.realtime.publish(`status-loading-${nodeId}`, channel.status, {
        nodeId,
        status: "loading",
    });

    if (!data.endpoint) {
        await step.realtime.publish(`status-error-${nodeId}`, channel.status, {
            nodeId,
            status: "error",
            error: "No endpoint configured",
        });

        throw new NonRetriableError("Http Request Node: No endpoint configured")
    }
    if (!data.variableName) {
        await step.realtime.publish(`status-error-${nodeId}`, channel.status, {
            nodeId,
            status: "error",
            error: "No variable name configured",
        });

        throw new NonRetriableError("Http Request Node: No variable name configured")
    }
    if (!data.method) {
        await step.realtime.publish(`status-error-${nodeId}`, channel.status, {
            nodeId,
            status: "error",
            error: "No method configured",
        });

        throw new NonRetriableError("Http Request Node: No method configured")
    }

    try {
        const result = await step.run("http-request", async () => {
            const method = data.method
            const endpoint = Handlebars.compile(data.endpoint)(context)

            const options: KyOptions = { method }

            if (["POST", "PUT", "PATCH"].includes(method)) {

                const resolved = Handlebars.compile(data.body)(context)
                JSON.parse(resolved)
                options.body = resolved
                options.headers = {
                    "Content-Type": "application/json"
                }
            }

            const response = await ky(endpoint, options)
            const contentType = response.headers.get("content-type")
            let responseData: unknown

            if (contentType?.includes("application/json")) {
                responseData = await response.json()
            } else {
                responseData = await response.text()
            }

            const responsePayload = {
                httpResponse: {
                    ...response,
                    status: response.status,
                    statusText: response.statusText,
                    data: responseData,
                }
            }

            return {
                ...context,
                [data.variableName]: responsePayload,
            }
        })

        await step.realtime.publish(`status-success-${nodeId}`, channel.status, {
            nodeId,
            status: "success",
        });

        return result
    } catch (err) {
        // ── ERROR ──────────────────────────────────────────────
        const message = err instanceof Error ? err.message : "Unknown error";

        // Critical: non-durable so it always fires on failure
        await inngest.realtime.publish(channel.status, {
            nodeId,
            status: "error",
            error: message,
        });

        throw err; // rethrow so Inngest still marks the step/run as failed
    }
}