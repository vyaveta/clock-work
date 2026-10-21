"use client"

import { Position, useReactFlow, type NodeProps } from "@xyflow/react"
import { type LucideIcon } from "lucide-react"
import Image from "next/image"
import { memo, type ReactNode } from "react"
import WorkflowNode from "@/components/layout/workflow-node"
import { BaseHandle } from "@/components/react-flow/base-handle"
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node"
import { NodeStatus, NodeStatusIndicator } from "@/components/react-flow/node-status-indicator"

interface BaseExecutionNodeProps extends NodeProps {
    name: string
    Icon: string | LucideIcon
    children?: ReactNode
    description?: string
    status?: NodeStatus
    onSettings?: () => void
    onDoubleClick?: () => void

}

export const BaseExecutionNode = memo(
    ({ id, data, Icon, name, description, children,status="initial", targetPosition, sourcePosition, onSettings, onDoubleClick }: BaseExecutionNodeProps) => {


        const { setNodes, setEdges } = useReactFlow()

        const handleRemove = () => {
            setNodes((nodes) => nodes.filter((node) => node.id !== id))
            setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id))
        }

        return (
            <WorkflowNode
                name={name}
                description={description}
                onSettings={onSettings}
                onRemove={handleRemove}
            >
                <NodeStatusIndicator
                status={status}
                variant="border"
                >
                    <BaseNode
                        onDoubleClick={onDoubleClick}
                        status={"initial"}
                    >
                        <BaseNodeContent >
                            {typeof Icon === "string" ? (
                                <Image src={Icon} alt={name} width={16} height={16} />
                            ) :
                                <Icon className="size-4 text-muted-foreground" />
                            }
                            {children}
                            <BaseHandle
                                id={"target-1"}
                                type="target"
                                position={Position.Left}
                            />
                            <BaseHandle
                                id={"source-1"}
                                type="source"
                                position={Position.Right}
                            />
                        </BaseNodeContent>
                    </BaseNode>
                </NodeStatusIndicator>
            </WorkflowNode>
        )
    }
)

BaseExecutionNode.displayName = "BaseExecutionNode"