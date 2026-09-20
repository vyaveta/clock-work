"use client"
import { Button } from "@/components/ui/button"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export default function Page() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data } = useQuery(trpc.getWorkFlows.queryOptions())

  const create = useMutation(
    trpc.createWorkFlow.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.getWorkFlows.queryOptions())
      },
    })
  )

  const testAi = useMutation(
    trpc.testAi.mutationOptions({
      onError: () => {
        toast.error("something went wrong")
      },
    })
  )

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          {JSON.stringify(data)}

          <Button disabled={create.isPending} onClick={() => create.mutate()}>
            Create
          </Button>

          <Button disabled={testAi.isPending} onClick={() => testAi.mutate()}>
            Test Ai
          </Button>
        </div>
      </div>
    </div>
  )
}
