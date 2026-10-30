import { NodeType } from "@/lib/generated/prisma/enums";
import type { NodeExecutor } from "@/features/executions/types";

type ManualTriggerData = Record<string, unknown>

export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
    data,
    nodeId,
    context,
    step
}) => {
    

    const result = await step.run("manual-trigger", async () => context)

    //todo: publish success state for manual trigger

    return result
}