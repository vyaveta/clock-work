"use client"

import { createId } from "@paralleldrive/cuid2"
import { useReactFlow } from "@xyflow/react"
import { NodeType } from "@/lib/generated/prisma/enums"
import {
    BriefcaseBusiness,
    CalendarClockIcon,
    GlobeIcon,
    MailSearch,
    Mail,
    MousePointerIcon,
    ZapIcon,
} from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "../ui/sheet"
import { useCallback } from "react"
import { toast } from "sonner"
import { createDefaultSchedulerConfig } from "@/features/triggers/scheduler-trigger/schedule-utils"

export type NodeTypeOptions = {
    type: NodeType
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }> | string
}

const triggerNodes: NodeTypeOptions[] = [
    {
        type: NodeType.MANUAL_TRIGGER,
        label: "Trigger Manually",
        description: "Start the workflow with a button click",
        icon: MousePointerIcon,
    },
    {
        type: NodeType.GOOGLE_FORM_TRIGGER,
        label: "Google Form",
        description: "When a form response is submitted",
        icon: "/logos/googleform.svg",
    },
    {
        type: NodeType.STRIPE_TRIGGER,
        label: "Stripe",
        description: "When a Stripe event occurs",
        icon: "/logos/stripe.svg",
    },
    {
        type: NodeType.SCHEDULE_TRIGGER,
        label: "Schedule",
        description: "Run at specific dates and times",
        icon: CalendarClockIcon,
    },
]

const executionNodes: NodeTypeOptions[] = [
    {
        type: NodeType.GMAIL_SEND,
        label: "Send Gmail",
        description: "Send an email from your connected Google account",
        icon: Mail,
    },
    {
        type: NodeType.HTTP_REQUEST,
        label: "HTTP Request",
        description: "Send a request to an external API",
        icon: GlobeIcon,
    },
    {
        type: NodeType.JOB_SCRAPER,
        label: "Job Search",
        description: "Find public listings on LinkedIn, Indeed, and Naukri",
        icon: BriefcaseBusiness,
    },
    {
        type: NodeType.HR_EMAIL_FINDER,
        label: "Find HR Emails",
        description: "Search matched jobs and public company contact pages",
        icon: MailSearch,
    },
    {
        type: NodeType.GEMINI,
        label: "Gemini",
        description:"Use Gemini models for AI tasks",
        icon: "/logos/gemini.svg",
    },
    {
        type: NodeType.GROQ,
        label: "Groq",
        description: "Run prompts with Groq-hosted models",
        icon: ZapIcon,
    },
]

interface NodeSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export function NodeSelector({ open, onOpenChange, children }: NodeSelectorProps) {
    const { setNodes, getNodes, screenToFlowPosition } = useReactFlow()

    const handleNodeSelect = useCallback((selection: NodeTypeOptions) => {
        if (selection.type === NodeType.MANUAL_TRIGGER) {
            const hasManualTrigger = getNodes().some((node) => node.type === NodeType.MANUAL_TRIGGER)
            if (hasManualTrigger) {
                toast.error("Only one manual trigger is allowed per workflow")
                return
            }
        }

        setNodes((nodes) => {
            const hasInitialTrigger = nodes.some((node) => node.type === NodeType.INITIAL)
            const flowPosition = screenToFlowPosition({
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                y: window.innerHeight / 2 + (Math.random() - 0.5) * 200,
            })
            const newNode = {
                id: createId(),
                data: selection.type === NodeType.SCHEDULE_TRIGGER
                    ? { schedule: createDefaultSchedulerConfig() }
                    : {},
                position: flowPosition,
                type: selection.type,
            }

            return hasInitialTrigger ? [newNode] : [...nodes, newNode]
        })

        onOpenChange(false)
    }, [setNodes, getNodes, onOpenChange, screenToFlowPosition])

    const renderNode = (nodeType: NodeTypeOptions) => {
        const Icon = nodeType.icon
        return (
            <button
                key={nodeType.type}
                type="button"
                onClick={() => handleNodeSelect(nodeType)}
                className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                    {typeof Icon === "string" ? (
                        <img src={Icon} alt="" className="size-5 object-contain" />
                    ) : (
                        <Icon className="size-[18px]" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-5">{nodeType.label}</p>
                    <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{nodeType.description}</p>
                </div>
            </button>
        )
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[380px]">
                <SheetHeader className="border-b px-5 py-5 text-left">
                    <SheetTitle className="text-base font-semibold">Add a node</SheetTitle>
                    <SheetDescription className="text-xs">
                        Choose a trigger or an action for your workflow.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <section>
                        <div className="mb-2 flex items-center justify-between px-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Triggers</h3>
                            <span className="text-[11px] text-muted-foreground">{triggerNodes.length}</span>
                        </div>
                        <div className="space-y-1">{triggerNodes.map(renderNode)}</div>
                    </section>

                    <section className="mt-6">
                        <div className="mb-2 flex items-center justify-between border-t px-2 pt-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</h3>
                            <span className="text-[11px] text-muted-foreground">{executionNodes.length}</span>
                        </div>
                        <div className="space-y-1">{executionNodes.map(renderNode)}</div>
                    </section>
                </div>

                <div className="border-t px-5 py-3">
                    <p className="text-[11px] text-muted-foreground">Select a node to add it to your workflow.</p>
                </div>
            </SheetContent>
        </Sheet>
    )
}
