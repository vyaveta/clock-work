import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../init"
import prisma from "@/lib/db"
import { inngest } from "@/inngest/client"

import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { TRPCError } from "@trpc/server"

export const appRouter = createTRPCRouter({
  getWorkFlows: protectedProcedure.query(({ ctx }) => {
    return prisma.workFlow.findMany()
  }),
  createWorkFlow: protectedProcedure.mutation(async () => {
    await inngest.send({
      name: "app/task.created",
      data: {
        id: "testid",
      },
    })

    return prisma.workFlow.create({
      data: {
        name: "tes-workflow",
      },
    })
  }),

  testAi: protectedProcedure.mutation(async () => {
   

    await inngest.send({
      name: "execute/ai",
    })

    return { success: true, message: "queued" }
  }),
})

// export type definition of API
export type AppRouter = typeof appRouter
