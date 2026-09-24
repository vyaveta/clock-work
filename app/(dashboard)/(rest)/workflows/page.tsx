import { prefetchWorkflows } from '@/features/workflows/server/prefetch'
import { requireAuth } from '@/lib/auth-utils'
import { HydrateClient } from '@/trpc/server'
import {ErrorBoundary} from "react-error-boundary"
import React, { Suspense } from 'react'
import { WorkflowsContainer, WorkflowsList } from '@/features/workflows/components/workflows'

const WorkFlows = async () => {

    await requireAuth()

    prefetchWorkflows();

  return (
    <WorkflowsContainer>
      <HydrateClient>
      <ErrorBoundary fallback={<h1>Something went wrong</h1>}>
        <Suspense fallback={<h1>Loading...</h1>}>
          <WorkflowsList />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
    </WorkflowsContainer>
  )
}

export default WorkFlows