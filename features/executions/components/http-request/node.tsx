"use client"

import { BaseExecutionNode } from "@/features/executions/components/base-execution-node"
import { useReactFlow, type Node, type NodeProps } from "@xyflow/react"
import { GlobeIcon } from "lucide-react"
import { memo, useMemo, useState } from "react"
import { HttpRequestDialog, HttpRequestFormType } from "./dialog"
import { getUpstreamVariables } from "@/lib/workflow-variables"


type HttpRequestNodeData = {
    variableName?: string
    endpoint?: string
    method?: "GET" | "PUT" | "PATCH" | "POST" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE" | "CONNECT"
    body?: string
}

type HttpRequestNodeType = Node<HttpRequestNodeData>

export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {

    const nodeData = props.data

    const { setNodes, getNodes, getEdges } = useReactFlow()

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

    // Derive available variables from upstream nodes whenever the dialog opens.
    const availableVariables = useMemo(
        () => getUpstreamVariables(props.id, getNodes(), getEdges()),
        // Re-compute when the dialog opens so the list reflects the latest graph state.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dialogOpen, props.id],
    )

    const description = nodeData.endpoint ?
        `${nodeData.method || "GET"}: ${nodeData.endpoint}` : "Not Configured"

    return (
        <>
            <HttpRequestDialog open={dialogOpen} onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
                availableVariables={availableVariables}
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
