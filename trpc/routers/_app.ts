import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../init';
import prisma from '@/lib/db';
import { inngest } from '@/inngest/client';
 
export const appRouter = createTRPCRouter({
  getWorkFlows: protectedProcedure
    .query(({ctx}) => {
      return prisma.workFlow.findMany()
    }),
    createWorkFlow: protectedProcedure
    .mutation(async() => {

      await inngest.send({
        name: "app/task.created",
        data: {
          id: "testid"
        }
      })

      return prisma.workFlow.create({
        data: {
          name: "tes-workflow"
        }
      })
    })
});
 
// export type definition of API
export type AppRouter = typeof appRouter;