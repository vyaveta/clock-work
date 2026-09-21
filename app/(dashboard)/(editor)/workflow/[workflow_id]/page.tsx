import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        workflow_id: string;
    }>
}

const WorkflowId = async ({params}: PageProps) => {

    await requireAuth()

    const {workflow_id} = await params

  return (
    <div>Credential id: {workflow_id} </div>
  )
}

export default WorkflowId