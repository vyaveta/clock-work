"use client"

import { BaseExecutionNode } from "@/features/executions/components/base-execution-node"
import { useReactFlow, type Node, type NodeProps } from "@xyflow/react"
import { ZapIcon } from "lucide-react"
import { memo, useMemo, useState } from "react"
import { GroqDialog, GroqFormType } from "./dialog"
import { getUpstreamVariables } from "@/lib/workflow-variables"
import { getNodeRealtimeToken } from "./actions"
import { groqChannel } from "@/inngest/channels/groq"


type GroqNodeData = {
    variableName?: string
    model?: string,
    userPrompt?: string,
    systemPrompt?: string,
}

type GroqNodeType = Node<GroqNodeData>

export const GroqNode = memo((props: NodeProps<GroqNodeType>) => {

    const nodeData = props.data

    const { setNodes, getNodes, getEdges } = useReactFlow()

    const [dialogOpen, setDialogOpen] = useState(false)

    const handleDialogOpen = () => {
        setDialogOpen(true)
    }

    const handleSubmit = (values: GroqFormType) => {
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

    const description = nodeData?.userPrompt ? `${nodeData.model || "Groq"}: ${nodeData.userPrompt.slice(0, 50)}...` : "Not Configured"

    return (
        <>
            <GroqDialog open={dialogOpen} onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
                availableVariables={availableVariables}
            />
            <BaseExecutionNode
                {...props}
                name="Groq"
                description={description}
                Icon={ZapIcon}
                refreshStatusToken={() => getNodeRealtimeToken(props.id)}
                statusChannel={groqChannel({ name: props.id })}
                onSettings={handleDialogOpen}
                onDoubleClick={handleDialogOpen}
            />

        </>
    )
})

GroqNode.displayName = "GroqNode"
