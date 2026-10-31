"use client"

import { ErrorView, LoadingView } from "@/components/layout/entity-components"
import { nodeComponents } from "@/config/node-components"
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows"
import { Background, BackgroundVariant, Controls, MiniMap, Panel, ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type EdgeChange, type Node, type NodeChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useMemo, useState } from 'react'
import { AddNodeButton } from "./add-node-button"
import { useSetAtom } from "jotai"
import { editorAtom } from "@/store/atoms"
import { NodeType } from "@/lib/generated/prisma/enums"
import ExecuteWorkflowButton from "./execute-workflow-button"

export const EditorLoading = () => {
    return <LoadingView message="loading editor..." />
}

export const EditorError = () => {
    return <ErrorView message="Error loading editor" />
}

export const Editor = ({ workflowId }: { workflowId: string }) => {

    const { data: workflow } = useSuspenseWorkflow(workflowId)

    const setEditor = useSetAtom(editorAtom)

    const [nodes, setNodes] = useState<Node[]>(workflow.nodes);
    const [edges, setEdges] = useState<Edge[]>(workflow.edges);

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)), []);
    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)), []);
    const onConnect = useCallback((params: Connection) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)), []);

    const manualTrigger = useMemo(() => {
        return nodes.find((node) => node.type === NodeType.MANUAL_TRIGGER)
    }, [nodes])

    return (
        <div className="size-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeComponents}
                onInit={setEditor}
                // snapGrid={[10, 10]}
                // snapToGrid
                panOnScroll
                panOnDrag={false}
                selectionOnDrag
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
                <Panel position="top-right">
                    <AddNodeButton />
                </Panel>
                {
                    manualTrigger && (
                        <Panel position="bottom-center" className=''>
                            <ExecuteWorkflowButton workflow_id={workflowId} trigger_node_id={manualTrigger.id} />
                        </Panel>
                    )
                }
            </ReactFlow>
        </div>
    )
}

