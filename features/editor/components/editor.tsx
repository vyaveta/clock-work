"use client"

import { ErrorView, LoadingView } from "@/components/layout/entity-components"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows"
import { SaveIcon } from "lucide-react"

export const EditorLoading = () => {
    return <LoadingView message="loading editor..." />
}

export const EditorError = () => {
    return <ErrorView message="Error loading editor" />
}

export const Editor = ({ workflowId }: { workflowId: string }) => {

    const { data: workflow } = useSuspenseWorkflow(workflowId)

    return (
        <div>
            {JSON.stringify(workflow, null, 2)}
        </div>
    )
}

