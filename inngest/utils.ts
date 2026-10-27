import { Connection, Node } from "@/lib/generated/prisma/client";
import toposort from "toposort";

export const topologicalSort = (
    nodes: Node[],
    connections: Connection[],
): Node[] => {
    // if no connections, return node as is (they are all independant)
    if(connections.length === 0 )
        return nodes


    //create edges array for toposort
    const edges: [string, string] [] = connections.map((connection) => [
        connection.fromNodeId,
        connection.toNodeId,
    ])

    //add nodes with no connections as self-edges to ensure they are included 
    const connectedNodeIds = new Set<string>()
    for (const connection of connections) {
        connectedNodeIds.add(connection.fromNodeId);
        connectedNodeIds.add(connection.toNodeId)
    }

    for(const node of nodes) {
        if(!connectedNodeIds.has(node.id)) {
            edges.push([node.id,node.id])
        }
    }

    //perform topological sort
    let sortedNodeIds: string[]

    try{
        sortedNodeIds = toposort(edges)
        //remove duplicated (from self edges)
        sortedNodeIds = [...new Set(sortedNodeIds)]
    }
    catch (error) {
        if(error instanceof Error && error.message.includes("Cyclic")){
            throw new Error("Workflow contains a cycle")
        }
        throw error
    }

    //map sorted ids back to node object
    const nodeMap =  new Map(nodes.map((node) => [node.id,node]))

    //filter out nodes not in the map (safety)
    return sortedNodeIds
    .map((id) => nodeMap.get(id)!).filter(Boolean)
   
}