import { generateSlug } from "random-word-slugs"

import prisma from "@/lib/db";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { NodeType } from "@/lib/generated/prisma/enums";
import { Edge, Node, Position } from "@xyflow/react";
import { inngest } from "@/inngest/client";
import { queueNextSchedulerOccurrence } from "@/inngest/scheduling";

export const workflowsRouter = createTRPCRouter({
    create: premiumProcedure.mutation(({ ctx }) => {
        return prisma.workFlow.create({
            data: {
                name: generateSlug(3),
                userId: ctx.auth.user.id,
                nodes: {
                    create: {
                        type: NodeType.INITIAL,
                        position: { x: 0, y: 0 },
                        name: NodeType.INITIAL,
                    }
                }
            }
        })
    }),

    remove: protectedProcedure.
        input(z.object({ id: z.string() })).
        mutation(({ ctx, input }) => {
            return prisma.workFlow.delete({
                where: {
                    userId: ctx.auth.user.id,
                    id: input.id
                }
            })
        }),

    updateName: premiumProcedure.input(z.object({ id: z.string(), name: z.string() })).
        mutation(({ ctx, input }) => {
            return prisma.workFlow.update({
                where: {
                    userId: ctx.auth.user.id,
                    id: input.id
                },
                data: {
                    name: input.name
                }
            })
        }),
    update: premiumProcedure.input(z.object({
        id: z.string(),
        nodes: z.array(
            z.object({
                id: z.string(),
                type: z.string().nullish(),
                position: z.object({ x: z.number(), y: z.number() }),
                data: z.record(z.string(), z.any()).optional(),
            })
        ),
        edges: z.array(
            z.object({
                source: z.string(),
                target: z.string(),
                sourceHandle: z.string().nullish(),
                targetHandle: z.string().nullish()
            })
        )
    })).
        mutation(async ({ ctx, input }) => {

            const { id, nodes, edges } = input

            const workflow = await prisma.workFlow.findUniqueOrThrow({
                where: { id, userId: ctx.auth.user.id }
            })
            // transaction to ensure consistency

            const savedWorkflow = await prisma.$transaction(async (tx) => {
                // delete all existing nodes and cascade deletes connections
                await tx.node.deleteMany({
                    where: {
                        workflowId: id
                    }
                })

                // create new nodes
                await tx.node.createMany({
                    data: nodes.map(node => ({
                        id: node.id,
                        workflowId: id,
                        name: node.type || "unknown",
                        type: node.type as NodeType,
                        position: node.position,
                        data: node.data || {},
                    }))
                })

                //create connections
                await tx.connection.createMany({
                    data: edges.map((edge) => ({
                        workflowId: id,
                        fromNodeId: edge.source,
                        toNodeId: edge.target,
                        fromOutput: edge.sourceHandle || "main",
                        toInput: edge.targetHandle || "main",
                    }))
                })

                //update workflows updateAt timestamp
                await tx.workFlow.update({
                    where: { id },
                    data: { updatedAt: new Date() }
                })
                return workflow
            })

            const schedulerNodes = nodes.filter((node) => node.type === NodeType.SCHEDULE_TRIGGER)
            await Promise.all(schedulerNodes.map((node) => queueNextSchedulerOccurrence({
                workflowId: id,
                nodeId: node.id,
                schedule: node.data?.schedule,
            })))

            return savedWorkflow
        }),

    getOne: protectedProcedure.
        input(z.object({ id: z.string() })).
        query(async ({ ctx, input }) => {
            const workflow = await prisma.workFlow.findUniqueOrThrow({
                where: {
                    userId: ctx.auth.user.id,
                    id: input.id
                },
                include: {
                    nodes: true,
                    connections: true
                }
            })

            //transform server nodes to react-flow compatalbe nodes
            const nodes: Node[] = workflow.nodes.map((node) => ({
                id: node.id,
                type: node.type,
                position: node.position as { x: number, y: number },
                data: (node.data as Record<string, unknown>) || {},
            }))

            // transform server connections to react-flow compatable edges
            const edges: Edge[] = workflow.connections.map((connection) => ({
                id: connection.id,
                source: connection.fromNodeId,
                target: connection.toNodeId,
                sourceHandle: connection.fromOutput,
                targetHandle: connection.toInput,
            }))

            return { ...workflow, nodes, edges }
        }),

    getMany: protectedProcedure
        .input(
            z.object({
                page: z
                    .number()
                    .int()
                    .min(1)
                    .optional()
                    .default(PAGINATION.DEFAULT_PAGE),

                pageSize: z
                    .number()
                    .int()
                    .min(PAGINATION.MIN_PAGE_SIZE)
                    .max(PAGINATION.MAX_PAGE_SIZE)
                    .default(PAGINATION.DEFAULT_PAGE_SIZE),

                search: z.string().optional().default(""),
            })
        ).
        query(async ({ ctx, input }) => {

            const { page, pageSize, search } = input

            const [items, totalCount] = await Promise.all([
                prisma.workFlow.findMany({
                    where: {
                        userId: ctx.auth.user.id,
                        name: {
                            contains: search,
                            mode: "insensitive"
                        }
                    },
                    take: pageSize,
                    skip: (page - 1) * pageSize,
                    orderBy: {
                        updatedAt: "desc"
                    }
                }),
                prisma.workFlow.count({
                    where: {
                        userId: ctx.auth.user.id,
                        name: {
                            contains: search,
                            mode: "insensitive"
                        }
                    }
                })
            ])

            const totalPages = Math.ceil(totalCount / pageSize)
            const hasNextPage = page < totalPages
            const hasPrevPage = page > 1

            return { items, totalCount, hasNextPage, hasPrevPage, totalPages, page }
        }),


    execute: premiumProcedure.
        input(z.object({ id: z.string(), triggerNodeId: z.string() })).
        mutation(async ({ ctx, input }) => {
           const workflow = await prisma.workFlow.findUniqueOrThrow({
            where: {
                id: input.id,
                userId: ctx.auth.user.id,
            }
           })

           await inngest.send({
            name: "workflow/execute",
            data: {workflowId: input.id, triggerNodeId: input.triggerNodeId}
           })

           return workflow
        })
})
