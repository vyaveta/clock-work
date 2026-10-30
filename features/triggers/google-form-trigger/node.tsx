"use client"

import { BaseTriggerNode } from "@/features/triggers/base-trigger-node"
import type { NodeProps } from "@xyflow/react"
import { memo } from "react"
import { useState } from "react"
import { GoogleFormTriggerDialog } from "./dialog"
import { useNodeStatus } from "@/features/executions/hooks/use-node-status"
import { getGoogleFormRealtimeToken } from "./actions"
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger"

export const GoogleFormTriggerNode = memo((props: NodeProps) => {
    const [open, setOpen] = useState(false)

    const handleOpenSettings = () => {
        setOpen(true)
    }

    const channel = googleFormTriggerChannel({ name: "google-form-trigger-execution" })

    const { status: nodeStatus, error } = useNodeStatus({
        nodeId: props.id,
        refreshToken: () => getGoogleFormRealtimeToken(props.id),
        channel,
    });


    return (
        <>
            <GoogleFormTriggerDialog open={open} onOpenChange={setOpen} />
            <BaseTriggerNode
                {...props}
                Icon={"/logos/googleform.svg"}
                name="Google Form"
                description={`When form is submitted`}
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    )
})

GoogleFormTriggerNode.displayName = "GoogleFormTriggerNode"
