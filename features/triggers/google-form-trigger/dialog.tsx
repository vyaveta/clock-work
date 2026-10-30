"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CopyIcon } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getSignedWebhookUrl } from "./actions"
import { generateGoogleFormScript } from "./utils"

interface GoogleFormTriggerDialogProps {
    open: boolean,
    onOpenChange: (open: boolean) => void
}

export const GoogleFormTriggerDialog = ({
    open,
    onOpenChange
}: GoogleFormTriggerDialogProps) => {

    const params = useParams();
    const workflowId = params.workflow_id as string

    const [webhookUrl, setWebhookUrl] = useState<string>("")

    // Fetch the signed URL from the server so the raw secret never reaches the client.
    useEffect(() => {
        if (!open || !workflowId) return;
        getSignedWebhookUrl(workflowId).then(setWebhookUrl).catch(() => {
            toast.error("Failed to generate webhook URL")
        })
    }, [open, workflowId])

    const copyWebHookUrlToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(webhookUrl)
            toast.success("Webhook URL copied to clipboard!")
        } catch (err) {
            console.error("Failed to copy webhook URL:", err)
            toast.error("Failed to copy webhook URL!")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange} >
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Google Form</DialogTitle>
                    <DialogDescription>
                        Use this webhook URL in your Google Form's Apps Script to trigger this workflow when an form is submitted.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 " >
                    <div className="space-y-2" >
                        <Label htmlFor="webhook-url">
                            Webhook URL
                        </Label>
                        <div className="flex gap-2">
                            <Input id="webhook-url" autoFocus={false} value={webhookUrl} readOnly className="font-mono text-sm" />
                            <Button type="button" size={"icon"} onClick={copyWebHookUrlToClipboard}>
                                <CopyIcon className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm" >Setup instructions</h4>
                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>
                                Open your Google Form
                            </li>
                            <li>
                                Click on the 3 dots menu → Script editor
                            </li>
                            <li>
                                Paste the below code
                            </li>
                            <li>
                                Replace the `WEBHOOK_URL` with your webhook URL above
                            </li>
                            <li>
                                Save and click "Triggers" → Add Trigger
                            </li>
                            <li>
                                Choose: From form → On form Submit → save
                            </li>
                        </ol>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm" >Google Apps Script</h4>
                            <Button variant={"outline"} size={"sm"}
                                onClick={async () => {
                                    const script = generateGoogleFormScript(webhookUrl)
                                    try {
                                        await navigator.clipboard.writeText(script)
                                        toast.success("script copied to clipboard")
                                    } catch (error) {
                                        toast.error("failed to copy script")
                                    }
                                }}
                            >
                                <CopyIcon className="size-4" />
                                copy
                            </Button>
                        </div>
                        <code className=" overflow-x-auto font-mono text-xs text-muted-foreground">
                            This script includes your webhook URL and handles submissions
                        </code>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2 ">
                        <h4 className="font-medium text-sm" >Available Variables</h4>
                        <ul className=" text-sm text-muted-foreground space-y-1  ">
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded mr-1">
                                    {"{{googleForm.respondentEmail}}"}
                                </code>
                                - Respondent's email
                            </li>
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded mr-1">
                                    {"{{googleForm.responses['Question Title']}}"}
                                </code>
                                - Question's response
                            </li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
