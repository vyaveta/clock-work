import {generateSlug} from "random-word-slugs"

import prisma from "@/lib/db";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";

export const workflowsRouter = createTRPCRouter({
    create: premiumProcedure.mutation(({ctx}) => {
        return prisma.workFlow.create({
            data: {
                name: generateSlug(3),
                userId: ctx.auth.user.id
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
    query(({ctx, input}) => {
        return prisma.workFlow.findUnique({
            where: {
                userId: ctx.auth.user.id,
                id: input.id
            }
        })
    }),

    getMany: protectedProcedure.
    input(
        z.object({
            page: z.number().optional().default(PAGINATION.DEFAULT_PAGE),
            pageSize: z.number().min(PAGINATION.MIN_PAGE_SIZE).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
            search: z.string().optional().default("")
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