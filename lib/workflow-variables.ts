/**
 * Design-time variable discovery.
 *
 * Maps each node type to the top-level context keys it injects at runtime,
 * along with representative leaf paths that users can reference in templates.
 * This is the static contract — update when a node's executor output changes.
 */
import { NodeType } from "@/lib/generated/prisma/enums";
import type { Node, Edge } from "@xyflow/react";

export interface VariableInfo {
    /** Handlebars path, e.g.  googleForm.respondentEmail */
    path: string;
    /** Human-readable hint, e.g. "Respondent's email address" */
    description: string;
    /** The node that produces this variable */
    nodeId: string;
    /** Display label for the source node */
    nodeLabel: string;
}

// Static schema: node type → variables it contributes to context
const NODE_OUTPUT_SCHEMA: Record<string, (data: Record<string, unknown>) => VariableInfo[]> = {
    [NodeType.GOOGLE_FORM_TRIGGER]: (_data) => [
        { path: "googleForm.formId",          description: "Google Form ID",          nodeId: "", nodeLabel: "" },
        { path: "googleForm.formTitle",        description: "Form title",              nodeId: "", nodeLabel: "" },
        { path: "googleForm.responseId",       description: "Submission response ID",  nodeId: "", nodeLabel: "" },
        { path: "googleForm.timestamp",        description: "Submission timestamp",    nodeId: "", nodeLabel: "" },
        { path: "googleForm.respondentEmail",  description: "Respondent's email",      nodeId: "", nodeLabel: "" },
        { path: "googleForm.responses",        description: "All form responses (object)", nodeId: "", nodeLabel: "" },
    ],

    [NodeType.HTTP_REQUEST]: (data) => {
        const varName = (data.variableName as string | undefined) || "httpRequest";
        return [
            { path: `${varName}.httpResponse.status`,     description: "HTTP status code",   nodeId: "", nodeLabel: "" },
            { path: `${varName}.httpResponse.statusText`, description: "HTTP status text",   nodeId: "", nodeLabel: "" },
            { path: `${varName}.httpResponse.data`,       description: "Response body data", nodeId: "", nodeLabel: "" },
        ];
    },

    [NodeType.JOB_SCRAPER]: (data) => {
        const varName = (data.variableName as string | undefined) || "jobSearch";
        return [
            { path: `${varName}.total`, description: "Number of listings found", nodeId: "", nodeLabel: "" },
            { path: `${varName}.saved`, description: "Listings inserted or updated in MongoDB", nodeId: "", nodeLabel: "" },
            { path: `${varName}.freshness`, description: "Selected posting freshness filter", nodeId: "", nodeLabel: "" },
            { path: `${varName}.jobs`, description: "Job listings with title, company, location, URL, source, and any public HR emails found", nodeId: "", nodeLabel: "" },
            { path: `${varName}.sourceErrors`, description: "Job boards that could not be reached", nodeId: "", nodeLabel: "" },
        ];
    },

    [NodeType.HR_EMAIL_FINDER]: (data) => {
        const varName = (data.variableName as string | undefined) || "hrContacts";
        return [
            { path: `${varName}.scanned`, description: "Matched jobs checked for HR emails", nodeId: "", nodeLabel: "" },
            { path: `${varName}.found`, description: "Jobs with public HR emails found", nodeId: "", nodeLabel: "" },
            { path: `${varName}.emailsFound`, description: "Number of public HR email addresses discovered", nodeId: "", nodeLabel: "" },
            { path: `${varName}.jobs`, description: "Jobs with discovered company websites and HR emails", nodeId: "", nodeLabel: "" },
            { path: `${varName}.errors`, description: "Company sites that could not be checked", nodeId: "", nodeLabel: "" },
        ];
    },

    [NodeType.MANUAL_TRIGGER]: (_data) => [],
    [NodeType.INITIAL]:        (_data) => [],
};

/**
 * Walk the React Flow graph backwards from `targetNodeId` and collect all
 * variables that upstream nodes produce.
 */
export function getUpstreamVariables(
    targetNodeId: string,
    nodes: Node[],
    edges: Edge[],
): VariableInfo[] {
    // Build adjacency: toNodeId → [fromNodeId, ...]
    const incomingEdges = new Map<string, string[]>();
    for (const edge of edges) {
        const arr = incomingEdges.get(edge.target) ?? [];
        arr.push(edge.source);
        incomingEdges.set(edge.target, arr);
    }

    // BFS upstream
    const visited = new Set<string>();
    const queue = [targetNodeId];
    while (queue.length) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        for (const upstream of incomingEdges.get(current) ?? []) {
            queue.push(upstream);
        }
    }
    visited.delete(targetNodeId); // exclude the node itself

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const variables: VariableInfo[] = [];

    for (const nodeId of visited) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;

        const type = node.type as string;
        const schemaFn = NODE_OUTPUT_SCHEMA[type];
        if (!schemaFn) continue;

        const nodeLabel =
            (node.data?.name as string | undefined) ??
            (node.data?.variableName as string | undefined) ??
            type;

        const vars = schemaFn(node.data as Record<string, unknown>).map((v) => ({
            ...v,
            nodeId,
            nodeLabel,
        }));

        variables.push(...vars);
    }

    return variables;
}

