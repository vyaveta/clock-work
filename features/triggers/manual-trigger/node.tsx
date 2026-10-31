import { BaseTriggerNode } from "@/features/triggers/base-trigger-node"
import type { NodeProps } from "@xyflow/react"
import { MousePointerIcon } from "lucide-react"
import { memo } from "react"
import { ManualTriggerDialog } from "./dialog"
import { useState } from "react"
import { useNodeStatus } from "@/features/executions/hooks/use-node-status"
import { getManualTriggerRealtimeToken } from "./actions"
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger"

export const ManualTriggerNode = memo((props: NodeProps) => {
    const [open, setOpen] = useState(false)

    const handleOpenSettings = () => {
        setOpen(true)
    }

    const channel = manualTriggerChannel({ name: "manual-trigger-execution" })
    const { status: nodeStatus } = useNodeStatus({
        nodeId: props.id,
        refreshToken: () => getManualTriggerRealtimeToken(props.id),
        channel,
    })


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
