import { BaseTriggerNode } from "@/features/triggers/components/base-trigger-node"
import type { NodeProps } from "@xyflow/react"
import { MousePointerIcon } from "lucide-react"
import { memo } from "react"
import { ManualTriggerDialog } from "./dialog"
import { useState } from "react"

export const ManualTriggerNode = memo((props: NodeProps) => {
    const [open, setOpen] = useState(false)

    const handleOpenSettings = () => {
        setOpen(true)
    }

    const nodeStatus = "initial"


    return (
        <>
            <ManualTriggerDialog open={open} onOpenChange={setOpen} />
            <BaseTriggerNode
                {...props}
                Icon={MousePointerIcon}
                name={`When clicking "Execute Workflow"`}
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    )
})

ManualTriggerNode.displayName = "ManualTriggerNode"