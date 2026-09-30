"use client"

import { NodeToolbar, Position } from "@xyflow/react"
import { SettingsIcon, TrashIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "../ui/button"

interface WorkflowNodeProps {
    children: ReactNode
    showToolbar?: boolean,
    onRemove?: () => void,
    onSettings?: () => void
    name?: string
    description?: string
}

export default function WorkflowNode({ children, onRemove, onSettings, showToolbar = true, name, description }: WorkflowNodeProps) {
    return <>
        {showToolbar && (
            <NodeToolbar>
                <Button size={"sm"} variant={"ghost"} onClick={onSettings}>
                    <SettingsIcon className="size-4" />
                </Button>
                <Button size={"sm"} variant={"ghost"} onClick={onRemove}>
                    <TrashIcon className="size-4" />
                </Button>
            </NodeToolbar>
        )}
        {children}
        <NodeToolbar
            position={Position.Bottom}
            isVisible
            className="max-w-[200px] text-center"
        >
            {name && (
                <p className="text-sm font-medium">{name}</p>
            )}
            {description && (
                <p className="text-muted-foreground truncate text-sm">
                    {description}
                </p>
            )}
        </NodeToolbar>
    </>
}