"use client"

import { useNodeStatus } from "@/features/executions/hooks/use-node-status"
import { BaseTriggerNode } from "@/features/triggers/base-trigger-node"
import type { NodeProps } from "@xyflow/react"
import { memo, useState } from "react"
import { StripeTriggerDialog } from "./dialog"
import { getStripeRealtimeToken } from "./actions"
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger"

export const StripeTriggerNode = memo((props: NodeProps) => {
    const [open, setOpen] = useState(false)

    const handleOpenSettings = () => {
        setOpen(true)
    }

    const channel = stripeTriggerChannel({ name: "stripe-trigger-execution" })

    const { status: nodeStatus, error } = useNodeStatus({
        nodeId: props.id,
        refreshToken: () => getStripeRealtimeToken(props.id),
        channel,
    });


    return (
        <>
            <StripeTriggerDialog open={open} onOpenChange={setOpen} />
            <BaseTriggerNode
                {...props}
                Icon={"/logos/stripe.svg"}
                name="Stripe"
                description={`When stripe event is captured`}
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    )
})

StripeTriggerNode.displayName = "StripeTriggerNode"
