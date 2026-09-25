"use client"
import { EntityContainer, EntityHeader, EntityPagination, EntitySearch } from "@/components/layout/entity-components";
import { useCreateWorkflow, useSuspenseWorkflows } from "../hooks/use-workflows"
import React from "react";
import { useUpgradeModal } from "@/hooks/use-upgrade";
import { useRouter } from "next/navigation";
import { useWorkflowsParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";

export const WorkflowsList = () => {
    const workflows = useSuspenseWorkflows();

    return (
        <div className="flex flex-1 justify-center items-center">
            <p>{JSON.stringify(workflows.data, null, 2)}</p>
        </div>
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

    const {searchValue, setSearchChange} = useEntitySearch({
        params,
        setParams
    })

    return (
        <EntitySearch value={searchValue} onChange={setSearchChange}
            placeholder="Search workflows..."
        />
    )
}


export const WorkflowsPagination = () => {
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


