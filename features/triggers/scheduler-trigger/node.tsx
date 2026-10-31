"use client"

import { BaseTriggerNode } from "@/features/triggers/base-trigger-node"
import { useNodeStatus } from "@/features/executions/hooks/use-node-status"
import { schedulerTriggerChannel } from "@/inngest/channels/scheduler-trigger"
import { CalendarClockIcon } from "lucide-react"
import { useReactFlow, type NodeProps } from "@xyflow/react"
import { memo, useState } from "react"
import { SchedulerDialog } from "./dialog"
import { getSchedulerRealtimeToken } from "./actions"
import { createDefaultSchedulerConfig, type SchedulerConfig } from "./schedule-utils"

const channel = schedulerTriggerChannel();

const getScheduleDescription = (schedule: SchedulerConfig) => {
    const times = schedule.times.join(", ");
    if (schedule.repeat === "once") return `Once on ${schedule.startDate} at ${times} (${schedule.timezone})`;
    if (schedule.repeat === "daily") return `Daily at ${times} (${schedule.timezone})`;

    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = schedule.daysOfWeek.map((day) => labels[day]).join(", ");
    return `${days || "Select days"} at ${times} (${schedule.timezone})`;
};

export const SchedulerNode = memo((props: NodeProps) => {
    const [open, setOpen] = useState(false)
    const { setNodes } = useReactFlow()
    const schedule = (props.data.schedule as SchedulerConfig | undefined) ?? createDefaultSchedulerConfig()
    const { status } = useNodeStatus({
        nodeId: props.id,
        refreshToken: () => getSchedulerRealtimeToken(props.id),
        channel,
    })

    const handleSave = (nextSchedule: SchedulerConfig) => {
        setNodes((nodes) => nodes.map((node) =>
            node.id === props.id
                ? { ...node, data: { ...node.data, schedule: nextSchedule } }
                : node,
        ));
    }

    return (
        <>
            <SchedulerDialog
                open={open}
                onOpenChange={setOpen}
                value={schedule}
                onSave={handleSave}
            />
            <BaseTriggerNode
                {...props}
                Icon={CalendarClockIcon}
                name="Schedule"
                description={getScheduleDescription(schedule)}
                status={status}
                onSettings={() => setOpen(true)}
                onDoubleClick={() => setOpen(true)}
            />
        </>
    )
})

SchedulerNode.displayName = "SchedulerNode"
