import type { NodeExecutor } from "@/features/executions/types";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";
import { inngest } from "@/inngest/client";

type GoogleFormTriggerData = Record<string, unknown>

export const googleFormTriggerExecutor: NodeExecutor<GoogleFormTriggerData> = async ({
    data,
    nodeId,
    context,
    step
}) => {

    const channel = googleFormTriggerChannel({ name: `google-form-trigger-execution` })

    try {
        await step.realtime.publish(`status-loading-${nodeId}`, channel.status, {
            nodeId,
            status: "loading",
        });

        const result = await step.run(`google-form-trigger-${nodeId}`, async () => context);

        await step.realtime.publish(`status-success-${nodeId}`, channel.status, {
            nodeId,
            status: "success",
        });

        return result;
    } catch (error) {
        await inngest.realtime.publish(channel.status, {
            nodeId,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
    }
}
