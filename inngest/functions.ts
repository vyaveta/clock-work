import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { NodeType } from "@/lib/generated/prisma/enums";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { httpRequestChannel } from "./channels/http-request";

export const executeWorkflow = inngest.createFunction(
    {
        id: "execute-workflow", 
        triggers: {event: "workflow/execute"},    
},
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

            const initialData = event.data.initialData as Record<string, unknown> | undefined
            const inferredTriggerType = initialData?.stripe
                ? NodeType.STRIPE_TRIGGER
                : initialData?.googleForm
                    ? NodeType.GOOGLE_FORM_TRIGGER
                    : undefined
            const triggerNodeId = event.data.triggerNodeId ?? workflow.nodes.find((node) =>
                inferredTriggerType ? node.type === inferredTriggerType : node.type === NodeType.MANUAL_TRIGGER,
            )?.id
            if (!triggerNodeId) {
                throw new NonRetriableError("No matching workflow trigger was found")
            }

            const triggerNode = workflow.nodes.find((node) => node.id === triggerNodeId)
            if (!triggerNode) {
                throw new NonRetriableError(`Trigger node "${triggerNodeId}" was not found`)
            }
            if (![
                NodeType.MANUAL_TRIGGER,
                NodeType.INITIAL,
                NodeType.GOOGLE_FORM_TRIGGER,
                NodeType.STRIPE_TRIGGER,
                //@ts-ignore
            ].includes(triggerNode.type as NodeType)) {
                throw new NonRetriableError(`Node "${triggerNodeId}" is not a trigger`)
            }

            // Only run this trigger and nodes downstream of it. Other triggers
            // are independent entry points and must not execute for this event.
            const reachableNodeIds = new Set([triggerNodeId])
            const pendingNodeIds = [triggerNodeId]
            while (pendingNodeIds.length > 0) {
                const currentNodeId = pendingNodeIds.pop()!
                for (const connection of workflow.connections) {
                    if (connection.fromNodeId === currentNodeId && !reachableNodeIds.has(connection.toNodeId)) {
                        reachableNodeIds.add(connection.toNodeId)
                        pendingNodeIds.push(connection.toNodeId)
                    }
                }
            }

            const reachableNodes = workflow.nodes.filter((node) => reachableNodeIds.has(node.id))
            const reachableConnections = workflow.connections.filter((connection) =>
                reachableNodeIds.has(connection.fromNodeId) && reachableNodeIds.has(connection.toNodeId),
            )

            return topologicalSort(reachableNodes, reachableConnections)

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
                step,
                workflowId,
            })
        }

        return {
            workflowId,
            result: context,
        }

    }
)
