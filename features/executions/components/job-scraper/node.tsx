"use client";

import { memo, useMemo, useState } from "react";
import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { BriefcaseBusiness } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { BaseExecutionNode } from "@/features/executions/components/base-execution-node";
import { JobScraperDialog, type JobScraperForm } from "./dialog";

type Data = Partial<JobScraperForm>;
type JobNode = Node<Data>;

export const JobScraperNode = memo((props: NodeProps<JobNode>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const data = props.data;
  const description = data.title ? `${data.title}${data.location ? ` · ${data.location}` : ""}` : "Set a job title to get started";
  const defaults = useMemo(() => data, [data]);
  const handleExecutionError = useCallback((message: string) => {
    toast.error(message.startsWith("MongoDB save failed:") ? message : `Job search failed: ${message}`);
  }, []);

  const handleSubmit = (values: JobScraperForm) => {
    setNodes((nodes) => nodes.map((node) => node.id === props.id ? { ...node, data: { ...node.data, ...values } } : node));
  };

  return <>
    <JobScraperDialog open={open} onOpenChange={setOpen} onSubmit={handleSubmit} defaultValues={defaults} />
    <BaseExecutionNode {...props} name="Job Search" description={description} Icon={BriefcaseBusiness} onSettings={() => setOpen(true)} onDoubleClick={() => setOpen(true)} onExecutionError={handleExecutionError} />
  </>;
});

JobScraperNode.displayName = "JobScraperNode";
