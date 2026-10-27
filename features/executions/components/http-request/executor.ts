import { NodeType } from "@/lib/generated/prisma/enums";
import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";

type HttpRequestData = {
    endpoint?: string,
    method?: "GET" | "PUT" | "PATCH" | "POST" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE" | "CONNECT"
    body?: string,
}

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
    data,
    nodeId,
    context,
    step
}) => {
    
    if(!data.endpoint){
        // todo: publish error

        throw new NonRetriableError("Http Request Node: No endpoint configured")
    }

    const result = await step.run("http-request", async () => {
        const method = data.method || "GET"
        const endpoint = data.endpoint!

        const options: KyOptions = {method}

        if(["POST", "PUT", "PATCH"].includes(method)) {
            options.body = data.body
        }

        const response = await ky(endpoint, options)
        const contentType = response.headers.get("content-type")
        let responseData: unknown

        if(contentType?.includes("application/json")) {
            responseData = await response.json()
        } else {
            responseData = await response.text()
        }

        return {
            ...context,
            httpResponse: {
                ...response,
                staus: response.status,
                statusText: response.statusText,
                data: responseData,
                
            }
        }
    })

    //todo: publish success state for manual trigger

    return result
}