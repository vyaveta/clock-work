import { BaseTriggerNode } from "@/features/triggers/components/base-trigger-node"
import type { NodeProps } from "@xyflow/react"
import { MousePointerIcon } from "lucide-react"
import { memo } from "react"

export const ManualTriggerNode = memo((props: NodeProps) => {
    return (
        <>
        <BaseTriggerNode
        {...props}
        Icon={MousePointerIcon}
        name={`When clicking "Execute Workflow"`}
        // status
        // onSettings={handleOpenSettings}
        // onDoubleClick={handleOpen}
        />
        </>
    )
})