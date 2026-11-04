"use client"

import { Position, useReactFlow, type NodeProps } from "@xyflow/react"
import { type LucideIcon } from "lucide-react"
import Image from "next/image"
import { memo, useEffect, useRef, type ReactNode } from "react"
import WorkflowNode from "@/components/layout/workflow-node"
import { BaseHandle } from "@/components/react-flow/base-handle"
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node"
import { NodeStatus, NodeStatusIndicator } from "@/components/react-flow/node-status-indicator"
import { useNodeStatus, type SupportedChannel } from "../hooks/use-node-status"
import { getNodeRealtimeToken } from "./http-request/actions"

interface BaseExecutionNodeProps extends NodeProps {
    name: string
    Icon: string | LucideIcon
    children?: ReactNode
    description?: string
    status?: NodeStatus
    onSettings?: () => void
    onDoubleClick?: () => void
    onExecutionError?: (message: string) => void
    refreshStatusToken?: () => Promise<any>
    statusChannel?: SupportedChannel

}

export const BaseExecutionNode = memo(
    ({ id, data, Icon, name, description, children, status = "initial", targetPosition, sourcePosition, onSettings, onDoubleClick, onExecutionError, refreshStatusToken, statusChannel }: BaseExecutionNodeProps) => {


        const { setNodes, setEdges } = useReactFlow()

        const handleRemove = () => {
            setNodes((nodes) => nodes.filter((node) => node.id !== id))
            setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id))
        }

        const { status: nodeStatus, error } = useNodeStatus({
            nodeId: id,
            refreshToken: refreshStatusToken ?? (() => getNodeRealtimeToken(id)),
            channel: statusChannel,
        });

        const lastNotifiedError = useRef<string | null>(null)
        useEffect(() => {
            if (nodeStatus !== "error") {
                lastNotifiedError.current = null
                return
            }
            if (error && error !== lastNotifiedError.current) {
                lastNotifiedError.current = error
                onExecutionError?.(error)
            }
        }, [error, nodeStatus, onExecutionError])

        return (
            <WorkflowNode
                name={name}
                description={description}
                onSettings={onSettings}
                onRemove={handleRemove}
            >
                <NodeStatusIndicator
                    status={nodeStatus}
                    variant="border"
                >
                    <BaseNode
                        onDoubleClick={onDoubleClick}
                        status={nodeStatus}
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
