"use client"
import { EmptyView, EntityContainer, EntityHeader, EntityItem, EntityList, EntityPagination, EntitySearch, ErrorView, LoadingView } from "@/components/layout/entity-components";
import { useCreateWorkflow, useRemoveWorkflow, useSuspenseWorkflows } from "../hooks/use-workflows"
import { ErrorBoundary } from "react-error-boundary";
import React, { Suspense } from "react";
import { useUpgradeModal } from "@/hooks/use-upgrade";
import { useRouter } from "next/navigation";
import { useWorkflowsParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { WorkFlow } from "@/lib/generated/prisma/client"
import { WorkflowIcon } from "lucide-react";
import {formatDistanceToNow} from "date-fns"


export const WorkflowsEmpty = () => {

    const createWorkflow = useCreateWorkflow()
    const router = useRouter()
    const { handleError, modal } = useUpgradeModal()

    const handleCreate = React.useCallback(() => {
        createWorkflow.mutate(undefined, {
            onError: (error) => {
                handleError(error)
            },
            onSuccess: (data) => {
                router.push(`workflows/${data.id}`)
            }
        })
    }, [createWorkflow])

    return (
        <>
            {modal}
            <EmptyView
                onNew={handleCreate}
                newButtonLabel="Create Workflow"
                message="No workflows found. Create a new workflow to proceed" />
        </>
    )
}


export const WorkflowItem = ({ data }: { data: WorkFlow }) => {

    const removeWorkflow = useRemoveWorkflow()

    const handleRemove = () => {
        removeWorkflow.mutate({id: data.id})
    }

    return (
        <EntityItem
            href={`/workflows/${data.id}`}
            title={data.name}
            subtitle={
                <>
                    Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })} {" "}
                    &bull;
                    {" "} Created {formatDistanceToNow(data.createdAt, { addSuffix: true })} {" "}
                </>
            }
            image={
                <div className="flex justify-center items-center size-6 md:size-8 rounded-full overflow-hidden">
                    <WorkflowIcon className="size-5 text-muted-foreground" />
                </div>
            }
            onRemove={handleRemove}
            isRemoving={removeWorkflow.isPending}

        />
    )
}

export const WorkflowsList = () => {
    const workflows = useSuspenseWorkflows();

    return (
        <EntityList
            items={workflows.data.items}
            getKey={(workflow) => workflow.id}
            emptyView={<WorkflowsEmpty />}
            renderItem={(workflow) => <WorkflowItem data={workflow} />} 
        />
    )
}

export const WorkflowsHeader = ({ disabled }: { disabled?: boolean }) => {

    const createWorkfow = useCreateWorkflow()
    const router = useRouter()
    const { handleError, modal } = useUpgradeModal()

    const handleCreate = React.useCallback(() => {
        createWorkfow.mutate(undefined, {
            onError: (error) => {
                handleError(error)
            },
            onSuccess: (data) => {
                router.push(`workflows/${data.id}`)
            }
        })
    }, [createWorkfow])

    return (
        <>
            {modal}
            <EntityHeader title="Workflows" description="Create and manage your workflows"
                onNew={() => { handleCreate() }}
                disabled={disabled}
                newButtonLabel="New Workflow"
                isCreating={createWorkfow.isPending}
            />
        </>
    )
}

export const WorkflowsSearch = () => {

    const [params, setParams] = useWorkflowsParams()

    const { searchValue, setSearchChange } = useEntitySearch({
        params,
        setParams
    })

    return (
        <EntitySearch value={searchValue} onChange={setSearchChange}
            placeholder="Search workflows..."
        />
    )
}


const WorkflowsPaginationInner = () => {
    const workflows = useSuspenseWorkflows()
    const [params, setParams] = useWorkflowsParams()

    const handlePageChange = React.useCallback((page: number) => {
        setParams({ ...params, page })
    }, [params, setParams])

    return (
        <EntityPagination
            page={params.page}
            totalPages={workflows.data?.totalPages}
            onPageChange={handlePageChange}
            disabled={workflows.isFetching}
        />
    )
}

export const WorkflowsPagination = () => {
    return (
        <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
                <WorkflowsPaginationInner />
            </Suspense>
        </ErrorBoundary>
    )
}

export const WorkflowsContainer = ({ children }: { children: React.ReactNode }) => {
    return (
        <EntityContainer
            header={<WorkflowsHeader />}
            search={<WorkflowsSearch />}
            pagination={<WorkflowsPagination />}
        >
            {children}
        </EntityContainer>
    )
}


export const WorkflowsLoading = () => {
    return (
        <LoadingView message={"loading workflows..."} />
    )
}
export const WorkflowsError = () => {
    return (
        <ErrorView message={"Failed to load workflows"} />
    )
}