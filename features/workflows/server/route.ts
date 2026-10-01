import {generateSlug} from "random-word-slugs"

import prisma from "@/lib/db";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { NodeType } from "@/lib/generated/prisma/enums";
import { Edge, Node } from "@xyflow/react";

export const workflowsRouter = createTRPCRouter({
    create: premiumProcedure.mutation(({ctx}) => {
        return prisma.workFlow.create({
            data: {
                name: generateSlug(3),
                userId: ctx.auth.user.id,
                nodes: {
                    create: {
                        type: NodeType.INITIAL,
                        position: {x: 0, y: 0},
                        name: NodeType.INITIAL,
                    }
                }
            }
        })
    }),

    remove: protectedProcedure.
    input(z.object({id: z.string()})).
    mutation(({ctx, input}) => {
        return prisma.workFlow.delete({
            where: {
                userId: ctx.auth.user.id,
                id: input.id
            }
        })
    }),

    updateName: protectedProcedure.input(z.object({id: z.string(), name: z.string()})).
    mutation(({ctx, input}) => {
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

    getOne: protectedProcedure.
    input(z.object({id: z.string()})).
    query(async({ctx, input}) => {
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
            position: node.position as {x: number, y: number} ,
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

        return {...workflow, nodes, edges}
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
    query(async ({ctx, input}) => {

        const {page, pageSize, search} = input

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

        return {items, totalCount, hasNextPage, hasPrevPage, totalPages, page}
    })
})