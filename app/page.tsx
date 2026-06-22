import { requireAuth } from "@/lib/auth-utils"




export default async function Page() {

  await requireAuth()

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
         
         </div>
      </div>
    </div>
  )
}
