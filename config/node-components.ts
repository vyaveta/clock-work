import { InitialNode } from "@/components/layout/initial-node";
import { HttpRequestNode } from "@/features/executions/components/http-request/node";
import { GoogleFormTriggerNode } from "@/features/triggers/google-form-trigger/node";
import { ManualTriggerNode } from "@/features/triggers/manual-trigger/node";
import { StripeTriggerNode } from "@/features/triggers/stripe-trigger/node";
import { SchedulerNode } from "@/features/triggers/scheduler-trigger/node";
import { NodeType } from "@/lib/generated/prisma/enums";
import { NodeTypes } from "@xyflow/react";

export const nodeComponents = {
    [NodeType.INITIAL]: InitialNode,
    [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
    [NodeType.HTTP_REQUEST]: HttpRequestNode,
    [NodeType.GOOGLE_FORM_TRIGGER]: GoogleFormTriggerNode,
    [NodeType.STRIPE_TRIGGER]: StripeTriggerNode,
    [NodeType.SCHEDULE_TRIGGER]: SchedulerNode,
} as const satisfies NodeTypes

export type RegisterNodeType = keyof typeof nodeComponents
