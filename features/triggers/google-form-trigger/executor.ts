import type { NodeExecutor } from "@/features/executions/types";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";

type GoogleFormTriggerData = Record<string, unknown>

export const googleFormTriggerExecutor: NodeExecutor<GoogleFormTriggerData> = async ({
    data,
    nodeId,
    context,
    step
}) => {

    const channel = googleFormTriggerChannel({ name: `google-form-trigger-execution` })

    await step.realtime.publish(`status-loading-${nodeId}`, channel.status, {
        nodeId,
        status: "loading",
    });

    const result = await step.run("google-form-trigger", async () => {
        return context
    })

    await step.realtime.publish(`status-success-${nodeId}`, channel.status, {
        nodeId,
        status: "success",
    });

    return result
}
