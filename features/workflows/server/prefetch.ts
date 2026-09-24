import type {inferInput} from "@trpc/tanstack-react-query";
import {prefetch, trpc} from "@/trpc/server";

type Input = inferInput<typeof trpc.workflows.getMany>


//pre-fetch all workflows

export const prefetchWorkflows = (params: Input) => {
    return prefetch(trpc.workflows.getMany.queryOptions(params))
}