import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { NodeType } from "@/lib/generated/prisma/enums";
import {
    normalizeSchedulerConfig,
    schedulerConfigFingerprint,
} from "@/features/triggers/scheduler-trigger/schedule-utils";
import { createNextSchedulerEvent } from "./scheduling";

export const executeScheduledWorkflow = inngest.createFunction(
    {
        id: "execute-scheduled-workflow",
        triggers: { event: "workflow/schedule.due" },
    },
    async ({ event, step }) => {
        const { workflowId, nodeId, configFingerprint, scheduledAt } = event.data;
        if (!workflowId || !nodeId || !configFingerprint || !scheduledAt) {
            throw new NonRetriableError("workflowId, nodeId, configFingerprint, and scheduledAt are required");
        }

        const current = await step.run("load-current-schedule", async () => {
            const node = await prisma.node.findFirst({
                where: { id: nodeId, workflowId },
                select: { type: true, data: true },
            });

            if (!node || node.type !== NodeType.SCHEDULE_TRIGGER) return null;
            const data = node.data as Record<string, unknown>;
            const config = normalizeSchedulerConfig(data.schedule);
            if (!config || schedulerConfigFingerprint(config) !== configFingerprint) return null;

            return { config };
        });

        if (!current) return { ignored: true, reason: "Schedule was removed or changed" };

        await step.sendEvent("dispatch-workflow", {
            name: "workflow/execute",
            data: {
                workflowId,
                triggerNodeId: nodeId,
                initialData: {
                    scheduler: {
                        scheduledAt,
                        timezone: current.config.timezone,
                    },
                },
            },
        });

        const scheduledNext = await step.run("calculate-next-occurrence", async () => {
            return createNextSchedulerEvent({
                workflowId,
                nodeId,
                schedule: current.config,
                after: new Date(),
            });
        });
        if (scheduledNext) {
            await step.sendEvent("queue-next-occurrence", scheduledNext.event);
        }

        return { workflowId, nodeId, scheduledAt, nextRun: scheduledNext?.nextRun ?? null };
    },
);
