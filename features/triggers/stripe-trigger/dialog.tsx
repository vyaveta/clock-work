"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSignedWebhookUrl } from "@/lib/webhooks/action"
import { CopyIcon } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface StripeTriggerDialogProps {
    open: boolean,
    onOpenChange: (open: boolean) => void
}

export const StripeTriggerDialog = ({
    open,
    onOpenChange
}: StripeTriggerDialogProps) => {

    const params = useParams();
    const workflowId = params.workflow_id as string

    const [webhookUrl, setWebhookUrl] = useState<string>("")

    // Fetch the signed URL from the server so the raw secret never reaches the client.
    useEffect(() => {
        if (!open || !workflowId) return;
        getSignedWebhookUrl({workflowId, feature: "stripe"}).then(setWebhookUrl).catch(() => {
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
                    <DialogTitle>Stripe Trigger Configuration</DialogTitle>
                    <DialogDescription>
                        Configure this webhook url in your Stripe Dashboard to trigger this workflow on payment events.
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
                                Open your Stripe Dashboard
                            </li>
                            <li>
                                Go to Developers → Webhooks
                            </li>
                            <li>
                                Click "Add endpoint"
                            </li>
                            <li>
                                Paste the webhook URL above
                            </li>
                            <li>
                                Select event to listen for (e.g. payment_intent.succeeded )
                            </li>
                            <li>
                                Copy and save the signing secret
                            </li>
                        </ol>
                    </div>


                    <div className="rounded-lg bg-muted p-4 space-y-2 ">
                        <h4 className="font-medium text-sm" >Available Variables</h4>
                        <ul className=" text-sm text-muted-foreground space-y-1  ">
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded mr-1">
                                    {"{{stripe.amount}}"}
                                </code>
                                - Payment amount
                            </li>
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded mr-1">
                                    {"{{stripe.curreny}}"}
                                </code>
                                - Currency code
                            </li>
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded mr-1">
                                    {"{{stripe.customerId}}"}
                                </code>
                                - Customer ID
                            </li>
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded mr-1">
                                    {"{{json stripe}}"}
                                </code>
                                - Full event data as JSON
                            </li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
