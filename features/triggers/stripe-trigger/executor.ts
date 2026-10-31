import type { NodeExecutor } from "@/features/executions/types";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger";

type GoogleFormTriggerData = Record<string, unknown>

export const stripeTriggerExecutor: NodeExecutor<GoogleFormTriggerData> = async ({
    data,
    nodeId,
    context,
    step
}) => {

    const channel = stripeTriggerChannel({ name: `stripe-trigger-execution` })

    await step.realtime.publish(`status-loading-${nodeId}`, channel.status, {
        nodeId,
        status: "loading",
    });

    const result = await step.run("stripe-trigger", async () => {
        return context
    })

    await step.realtime.publish(`status-success-${nodeId}`, channel.status, {
        nodeId,
        status: "success",
    });

    return result
}
