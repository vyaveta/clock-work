"use client"

import { BaseExecutionNode } from "@/features/executions/components/base-execution-node"
import type { Node, NodeProps } from "@xyflow/react"
import { GlobeIcon } from "lucide-react"
import { memo } from "react"


type HttpRequestNodeData = {
    endPoint?: string
    method?: "GET" | "PUT" | "PATCH" | "POST" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE" | "CONNECT"
    body?: string
    [key: string]: unknown
}

type HttpRequestNodeType = Node<HttpRequestNodeData>

export const HttpRequestNode = memo((props: NodeProps) => {

    const nodeData = props.data as HttpRequestNodeData

    const description = nodeData.endPoint ?
        `${nodeData.method || "GET"}: ${nodeData.endPoint}` : "Not Configured"

    return (
        <>
            <BaseExecutionNode
                {...props}
                name="HTTP Request"
                description={description}
                Icon={GlobeIcon}
                onSettings={() => {}}
                onDoubleClick={() => {}}
            />
                {/* <div className="flex items-center gap-2">
                    <span>{nodeData.method || "GET"}: {nodeData.endPoint}</span>
                </div>
            </BaseExecutionNode> */}
        </>
    )
})

HttpRequestNode.displayName = "HttpRequestNode"
