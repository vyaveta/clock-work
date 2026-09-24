import {generateSlug} from "random-word-slugs"

import prisma from "@/lib/db";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import z from "zod";

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
    query(({ctx}) => {
        return prisma.workFlow.findMany({
            where: {
                userId: ctx.auth.user.id
            },
        })
    })
})