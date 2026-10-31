import { createHash } from "node:crypto";
import { inngest } from "./client";
import {
    getNextSchedulerOccurrence,
    normalizeSchedulerConfig,
    schedulerConfigFingerprint,
} from "@/features/triggers/scheduler-trigger/schedule-utils";

export const createNextSchedulerEvent = ({
    workflowId,
    nodeId,
    schedule,
    after = new Date(),
}: {
    workflowId: string;
    nodeId: string;
    schedule: unknown;
    after?: Date;
}) => {
    const config = normalizeSchedulerConfig(schedule);
    if (!config) return null;

    const nextRun = getNextSchedulerOccurrence(config, after);
    if (!nextRun) return null;

    const fingerprint = schedulerConfigFingerprint(config);
    const fingerprintId = createHash("sha256").update(fingerprint).digest("hex").slice(0, 16);
    const timestamp = nextRun.getTime();

    return {
        nextRun,
        event: {
            name: "workflow/schedule.due",
            data: {
                workflowId,
                nodeId,
                configFingerprint: fingerprint,
                scheduledAt: timestamp,
            },
            ts: timestamp,
            id: `scheduler-${nodeId}-${fingerprintId}-${timestamp}`,
        },
    };
};

export const queueNextSchedulerOccurrence = async (input: Parameters<typeof createNextSchedulerEvent>[0]) => {
    const scheduled = createNextSchedulerEvent(input);
    if (!scheduled) return null;

    await inngest.send(scheduled.event);

    return scheduled.nextRun;
};
