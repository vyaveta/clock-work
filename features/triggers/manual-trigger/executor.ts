import type { NodeExecutor } from "@/features/executions/types";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";

type ManualTriggerData = Record<string, unknown>

export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
    nodeId,
    context,
    step
}) => {
    const channel = manualTriggerChannel({ name: "manual-trigger-execution" });

    try {
        await step.realtime.publish(`status-loading-${nodeId}`, channel.status, {
            nodeId,
            status: "loading",
        });

        const result = await step.run(`manual-trigger-${nodeId}`, async () => context);

        await step.realtime.publish(`status-success-${nodeId}`, channel.status, {
            nodeId,
            status: "success",
        });

        return result;
    } catch (error) {
        await step.realtime.publish(`status-error-${nodeId}`, channel.status, {
            nodeId,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
    }
}
