"use client"

import { BaseExecutionNode } from "@/features/executions/components/base-execution-node"
import { useReactFlow, type Node, type NodeProps } from "@xyflow/react"
import { GlobeIcon } from "lucide-react"
import { memo, useState } from "react"
import { HttpRequestDialog, HttpRequestFormType } from "./dialog"


type HttpRequestNodeData = {
    endpoint?: string
    method?: "GET" | "PUT" | "PATCH" | "POST" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE" | "CONNECT"
    body?: string
}

type HttpRequestNodeType = Node<HttpRequestNodeData>

export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {

    const nodeData = props.data

    const { setNodes } = useReactFlow()

    const [dialogOpen, setDialogOpen] = useState(false)

    const handleDialogOpen = () => {
        setDialogOpen(true)
    }

    const handleSubmit = (values: HttpRequestFormType) => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === props.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...values
                        },
                    }
                }
                return node
            })
        )
    }

    const description = nodeData.endpoint ?
        `${nodeData.method || "GET"}: ${nodeData.endpoint}` : "Not Configured"

    return (
        <>
            <HttpRequestDialog open={dialogOpen} onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={{
                    ...nodeData
                }}
            />
            <BaseExecutionNode
                {...props}
                name="HTTP Request"
                description={description}
                Icon={GlobeIcon}
                onSettings={handleDialogOpen}
                onDoubleClick={handleDialogOpen}
            />

        </>
    )
})

HttpRequestNode.displayName = "HttpRequestNode"
