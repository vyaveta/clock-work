import { Button } from '@/components/ui/button'
import { useExecuteWorkflow } from '@/features/workflows/hooks/use-workflows'
import { FlaskConicalIcon } from 'lucide-react'
import React from 'react'
import { useAtomValue } from 'jotai'
import { editorAtom } from '@/store/atoms'
import { useUpdateWorkflow } from '@/features/workflows/hooks/use-workflows'

const ExecuteWorkflowButton = ({workflow_id, trigger_node_id}: {workflow_id: string, trigger_node_id: string}) => {

    const executeWorkflow = useExecuteWorkflow()
    const saveWorkflow = useUpdateWorkflow()
    const editor = useAtomValue(editorAtom)

    const handleExecute = async () => {
        if (!editor) return

        try {
            await saveWorkflow.mutateAsync({
                id: workflow_id,
                nodes: editor.getNodes(),
                edges: editor.getEdges(),
            })
            await executeWorkflow.mutateAsync({id: workflow_id, triggerNodeId: trigger_node_id})
        } catch {
            // Both mutations surface their own error toast.
        }
    }

  return (
    <Button size={"lg"} onClick={handleExecute} disabled={!editor || saveWorkflow.isPending || executeWorkflow.isPending} >
        <FlaskConicalIcon className='size-4' />
        Execute workflow
    </Button>
  )
}

export default ExecuteWorkflowButton
