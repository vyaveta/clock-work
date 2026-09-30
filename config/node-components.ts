import { InitialNode } from "@/components/layout/initial-node";
import { NodeType } from "@/lib/generated/prisma/enums";
import { NodeTypes } from "@xyflow/react";

export const nodeComponents = {
    [NodeType.INITIAL]: InitialNode,
    // [NodeType.MANUAL_TRIGGER]: () => "Manual Trigger",
    // [NodeType.HTTP_REQUEST]: () => "HTTP Request",
} as const satisfies NodeTypes

export type RegisterNodeType =  keyof typeof nodeComponents