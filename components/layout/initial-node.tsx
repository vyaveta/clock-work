"use client"

import { NodeProps } from "@xyflow/react"
import { memo } from "react"
import { PlaceholderNode } from "../react-flow/placeholder-node"
import { PlusIcon } from "lucide-react"
import WorkflowNode from "./workflow-node"


export const InitialNode = memo((props: NodeProps) => {
    const { data } = props

    return (
        <WorkflowNode showToolbar={false}>
            <PlaceholderNode
                {...props}
            >
                <div className="flex items-center gap-2 cursor-pointer justify-center">
                    <PlusIcon className="size-4" />
                </div>
            </PlaceholderNode>
        </WorkflowNode>
    )

})

InitialNode.displayName = "InitialNode"