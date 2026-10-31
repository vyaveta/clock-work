"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows"
import { FlaskConicalIcon } from "lucide-react"
import { useState, type ChangeEvent } from "react"
import { toast } from "sonner"

const ExecuteWorkflowButton = ({
    workflow_id,
    trigger_node_id,
    needs_resume_input,
}: {
    workflow_id: string
    trigger_node_id: string
    needs_resume_input: boolean
}) => {
    const executeWorkflow = useExecuteWorkflow()
    const [resumeDialogOpen, setResumeDialogOpen] = useState(false)
    const [resumeText, setResumeText] = useState("")

    const runWorkflow = (resume?: string) => {
        executeWorkflow.mutate({
            id: workflow_id,
            triggerNodeId: trigger_node_id,
            ...(resume ? { initialData: { resumeText: resume } } : {}),
        }, {
            onSuccess: () => {
                setResumeDialogOpen(false)
                setResumeText("")
            },
        })
    }

    const handleResumeFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (file.size > 200_000) {
            toast.error("Resume text file must be under 200 KB")
            event.target.value = ""
            return
        }

        setResumeText(await file.text())
        event.target.value = ""
    }

    const handleExecute = () => {
        if (needs_resume_input) {
            setResumeDialogOpen(true)
            return
        }
        runWorkflow()
    }

    return (
        <>
            <Button size="lg" onClick={handleExecute} disabled={executeWorkflow.isPending}>
                <FlaskConicalIcon className="size-4" />
                Execute workflow
            </Button>
            <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Provide resume text</DialogTitle>
                        <DialogDescription>
                            This text is sent with this workflow run and is not saved in the workflow node or MongoDB.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <label className="grid gap-2 text-sm font-medium" htmlFor="resume-text-file">
                            Load a plain text resume
                            <input
                                id="resume-text-file"
                                type="file"
                                accept=".txt,.md,text/plain,text/markdown"
                                onChange={handleResumeFile}
                                className="text-sm font-normal"
                            />
                        </label>
                        <Textarea
                            value={resumeText}
                            onChange={(event) => setResumeText(event.target.value)}
                            placeholder="Paste the resume text here"
                            rows={12}
                            maxLength={200_000}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setResumeDialogOpen(false)}>Cancel</Button>
                        <Button
                            type="button"
                            disabled={!resumeText.trim() || executeWorkflow.isPending}
                            onClick={() => runWorkflow(resumeText.trim())}
                        >
                            Run job search
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ExecuteWorkflowButton
