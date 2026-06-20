import { Button } from "@/components/ui/button"
import { useTRPC } from "@/trpc/client";
import { caller } from "@/trpc/server"
import { useQuery } from "@tanstack/react-query";

export default async function Page() {
  const users = await caller.getusers();

  const trpc = useTRPC();

  // const {data: users} = useQuery(trpc.getusers.queryOptions());



  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          {users.map((user) => (
            <div key={user.id}>{user.name}</div>
          ))}
         </div>
      </div>
    </div>
  )
}
