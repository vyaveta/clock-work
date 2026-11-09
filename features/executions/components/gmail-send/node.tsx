"use client";

import { memo, useMemo, useState } from "react";
import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { Mail } from "lucide-react";
import { BaseExecutionNode } from "@/features/executions/components/base-execution-node";
import { GmailSendDialog, type GmailSendForm } from "./dialog";
import { getUpstreamVariables } from "@/lib/workflow-variables";

type GmailNodeData = Partial<GmailSendForm>;
export const GmailSendNode = memo((props: NodeProps<Node<GmailNodeData>>) => {
  const { setNodes, getNodes, getEdges } = useReactFlow();
  const [open, setOpen] = useState(false);
  const variables = useMemo(() => getUpstreamVariables(props.id, getNodes(), getEdges()), [open, props.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = (values: GmailSendForm) => setNodes((nodes) => nodes.map((node) => node.id === props.id ? { ...node, data: { ...node.data, ...values } } : node));
  return <>
    <GmailSendDialog open={open} onOpenChange={setOpen} onSubmit={submit} defaultValues={props.data} availableVariables={variables} />
    <BaseExecutionNode {...props} name="Send Gmail" description={props.data.to || "Not Configured"} Icon={Mail} onSettings={() => setOpen(true)} onDoubleClick={() => setOpen(true)} />
  </>;
});
GmailSendNode.displayName = "GmailSendNode";
