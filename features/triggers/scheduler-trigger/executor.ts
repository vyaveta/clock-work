import type { NodeExecutor } from "@/features/executions/types";
import { schedulerTriggerChannel } from "@/inngest/channels/scheduler-trigger";
import { inngest } from "@/inngest/client";

const channel = schedulerTriggerChannel();

export const schedulerTriggerExecutor: NodeExecutor = async ({ nodeId, context, step }) => {
    try {
        await step.realtime.publish(`status-loading-${nodeId}`, channel.status, {
            nodeId,
            status: "loading",
        });

        const result = await step.run(`scheduler-trigger-${nodeId}`, async () => context);

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
};
