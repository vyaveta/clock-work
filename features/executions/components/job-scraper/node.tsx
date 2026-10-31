"use client"

import { BaseExecutionNode } from "@/features/executions/components/base-execution-node"
import { jobScraperChannel } from "@/inngest/channels/job-scraper"
import { BriefcaseBusinessIcon } from "lucide-react"
import { useReactFlow, type Node, type NodeProps } from "@xyflow/react"
import { memo, useState } from "react"
import { getJobScraperRealtimeToken } from "./actions"
import { JobScraperDialog } from "./dialog"
import type { JobScraperNodeData } from "./types"

const channel = jobScraperChannel({ name: "job-scraper-execution" })
type JobScraperFlowNode = Node<JobScraperNodeData>

export const JobScraperNode = memo((props: NodeProps<JobScraperFlowNode>) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const { setNodes } = useReactFlow()
    const data = props.data
    const sources = (data.sources ?? ["adzuna", "jsearch"]).join(", ")

    const handleSave = (nextData: JobScraperNodeData) => {
        setNodes((nodes) => nodes.map((node) => node.id === props.id
            ? { ...node, data: { ...node.data, ...nextData } }
            : node,
        ))
    }

    return (
        <>
            <JobScraperDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                value={data}
                onSave={handleSave}
            />
            <BaseExecutionNode
                {...props}
                name="Job Scraper & Matcher"
                description={`${data.location || "India"} · ${sources}`}
                Icon={BriefcaseBusinessIcon}
                statusChannel={channel}
                getStatusToken={getJobScraperRealtimeToken}
                onSettings={() => setDialogOpen(true)}
                onDoubleClick={() => setDialogOpen(true)}
            />
        </>
    )
})

JobScraperNode.displayName = "JobScraperNode"
