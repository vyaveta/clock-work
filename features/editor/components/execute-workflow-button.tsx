import { Button } from '@/components/ui/button'
import { useExecuteWorkflow } from '@/features/workflows/hooks/use-workflows'
import { FlaskConicalIcon } from 'lucide-react'
import React from 'react'

const ExecuteWorkflowButton = ({workflow_id, trigger_node_id}: {workflow_id: string, trigger_node_id: string}) => {

    const executeWorkflow = useExecuteWorkflow()

    const handleExecute = () => {
        executeWorkflow.mutate({id: workflow_id, triggerNodeId: trigger_node_id})
    }

  return (
    <Button size={"lg"} onClick={handleExecute} disabled={executeWorkflow.isPending} >
        <FlaskConicalIcon className='size-4' />
        Execute workflow
    </Button>
  )
}

export default ExecuteWorkflowButton
