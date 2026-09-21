import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        execution_id: string;
    }>
}

const ExecutionId = async ({params}: PageProps) => {

    await requireAuth()

    const {execution_id} = await params

  return (
    <div>Credential id: {execution_id} </div>
  )
}

export default ExecutionId