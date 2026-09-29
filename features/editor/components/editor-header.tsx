"use client"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSuspenseWorkflow, useUpdateWorkflowName } from "@/features/workflows/hooks/use-workflows"
import { cn } from "@/lib/utils"
import { SaveIcon } from "lucide-react"
import Link from "next/link"
import React, { useEffect, useRef, useState } from "react"

export const EditorSaveButton = ({ workflowId }: { workflowId: string }) => {
    return (
        <div className="ml-auto" >
            <Button size={"sm"} onClick={() => { }} disabled={false} >
                <SaveIcon className="size-4" />
                Save
            </Button>
        </div>
    )
}
export const EditorBreadcrumbs = ({ workflowId }: { workflowId: string }) => {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link prefetch href={"/workflows"} >
                            Workflows
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <EditorNameInput workflowId={workflowId} />
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export const EditorNameInput = ({ workflowId }: { workflowId: string }) => {

    const { data: workflow } = useSuspenseWorkflow(workflowId)
    const updateWorkflow = useUpdateWorkflowName()

    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(workflow.name)

    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (workflow.name) {
            setName(workflow.name)
        }
    }, [workflow.name])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleSave = async () => {
        if (name === workflow.name) {
            setIsEditing(false)
            return
        }
        setIsEditing(false)
        try {
            await updateWorkflow.mutateAsync({
                id: workflowId,
                name
            })

        } catch (error) {
            setName(workflow.name)

        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key == "Enter") {
            handleSave()
        }
        if (e.key == "Escape") {
            setName(workflow.name)
            setIsEditing(false)
        }
    }

    if (isEditing) {
        return (
            <Input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown}
                className={cn(
                    "h-7 w-auto min-w-25 px-2",
                )}
                disabled={updateWorkflow.isPending}
            />
        )
    }

    return (
        <BreadcrumbItem className={cn(
            "cursor-pointer hover:text-foreground transition-colors",
            updateWorkflow.isPending && "cursor-wait opacity-50 animate-pulse"
        )}
            onClick={() => setIsEditing(true)} >
            {workflow.name}
        </BreadcrumbItem>
    )
}


export const EditorHeader = ({ workflowId }: { workflowId: string }) => {

    const { data: workflow } = useSuspenseWorkflow(workflowId)

    return (
        <header className='flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background' >
            <SidebarTrigger />
            <div className="flex flex-row items-center justify-between gap-x-4 w-full" >
                <EditorBreadcrumbs workflowId={workflowId} />
                <EditorSaveButton workflowId={workflowId} />

            </div>
        </header>
    )
}