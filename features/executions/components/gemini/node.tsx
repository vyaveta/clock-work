"use client"

import { BaseExecutionNode } from "@/features/executions/components/base-execution-node"
import { useReactFlow, type Node, type NodeProps } from "@xyflow/react"
import { GlobeIcon } from "lucide-react"
import { memo, useMemo, useState } from "react"
import { AVAILABLE_MODELS, GeminiDialog, GeminiFormType } from "./dialog"
import { getUpstreamVariables } from "@/lib/workflow-variables"


type GeminiNodeData = {
    variableName?: string
    model?: string,
    userPrompt?: string,
    systemPrompt?: string,
}

type GeminiNodeType = Node<GeminiNodeData>

export const GeminiNode = memo((props: NodeProps<GeminiNodeType>) => {

    const nodeData = props.data

    const { setNodes, getNodes, getEdges } = useReactFlow()

    const [dialogOpen, setDialogOpen] = useState(false)

    const handleDialogOpen = () => {
        setDialogOpen(true)
    }

    const handleSubmit = (values: GeminiFormType) => {
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

    const description = nodeData?.userPrompt ? `${nodeData.model || AVAILABLE_MODELS[0]}: ${nodeData.userPrompt.slice(0, 50)}...` : "Not Configured"

    return (
        <>
            <GeminiDialog open={dialogOpen} onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
                availableVariables={availableVariables}
            />
            <BaseExecutionNode
                {...props}
                name="Gemini"
                description={description}
                Icon={'/logos/gemini.svg'}
                onSettings={handleDialogOpen}
                onDoubleClick={handleDialogOpen}
            />

        </>
    )
})

GeminiNode.displayName = "GeminiNode"
