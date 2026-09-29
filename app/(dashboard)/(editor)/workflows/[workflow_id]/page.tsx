import { Editor, EditorError, EditorLoading } from "@/features/editor/components/editor";
import { EditorHeader } from "@/features/editor/components/editor-header";
import { prefetchWorkflowById } from "@/features/workflows/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface PageProps {
  params: Promise<{
    workflow_id: string;
  }>
}

const WorkflowId = async ({ params }: PageProps) => {

  await requireAuth()

  const { workflow_id } = await params
  await prefetchWorkflowById(workflow_id)

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<EditorError />}>
        <Suspense fallback={<EditorLoading />}>
        <EditorHeader workflowId={workflow_id} />
          <main className="flex-1">
            <Editor workflowId={workflow_id} />
          </main>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  )
}

export default WorkflowId