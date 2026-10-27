import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { NodeType } from "@/lib/generated/prisma/enums";
import { getExecutor } from "@/features/executions/lib/executor-registry";

export const executeWorkflow = inngest.createFunction(
    {id: "execute-workflow", triggers: {event: "workflow/execute"}},
    async ({event,step}) => {
       
        const workflowId = event.data.workflowId

        if(!workflowId) throw new NonRetriableError("workflowId is required")

        const sortedNodes = await step.run("prepare-workflow", async () => {

            const workflow = await prisma.workFlow.findUniqueOrThrow({
                where: {
                    id: workflowId
                },
                include: {
                    nodes: true,
                    connections: true,
                }
            })

            return topologicalSort(workflow.nodes, workflow.connections)

        })

        //initialize context with any initial data from the trigger
        let context: Record<string,unknown> = event.data.initialData || {}

        //execute each node in topological order
        for (const node of sortedNodes){
            const executor = getExecutor(node.type as NodeType)
            context = await executor({
                data: node.data as Record<string, unknown>,
                nodeId: node.id,
                context,
                step
            })
        }

        return {
            workflowId,
            result: context,
        }

    }
)