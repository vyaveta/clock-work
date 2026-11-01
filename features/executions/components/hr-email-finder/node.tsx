"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { MailSearch } from "lucide-react";
import { toast } from "sonner";
import { BaseExecutionNode } from "@/features/executions/components/base-execution-node";
import { HrEmailFinderDialog, type HrEmailFinderForm } from "./dialog";

type HrEmailFinderNodeData = Partial<HrEmailFinderForm>;
type HrEmailFinderNodeType = Node<HrEmailFinderNodeData>;

export const HrEmailFinderNode = memo((props: NodeProps<HrEmailFinderNodeType>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const data = props.data;
  const defaults = useMemo(() => data, [data]);
  const description = `${data.maxJobs ?? 25} matched jobs · public company sites`;

  const handleSubmit = (values: HrEmailFinderForm) => {
    setNodes((nodes) => nodes.map((node) => node.id === props.id
      ? { ...node, data: { ...node.data, ...values } }
      : node));
  };
  const handleExecutionError = useCallback((message: string) => {
    toast.error(message.startsWith("MongoDB") ? message : `HR email search failed: ${message}`);
  }, []);

  return <>
    <HrEmailFinderDialog open={open} onOpenChange={setOpen} onSubmit={handleSubmit} defaultValues={defaults} />
    <BaseExecutionNode {...props} name="Find HR Emails" description={description} Icon={MailSearch} onSettings={() => setOpen(true)} onDoubleClick={() => setOpen(true)} onExecutionError={handleExecutionError} />
  </>;
});

HrEmailFinderNode.displayName = "HrEmailFinderNode";
