"use client";

import { useEffect, useState } from "react";
import { useRealtime } from "inngest/react";
import { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { httpRequestChannel } from "@/inngest/channels/http-request";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";

type SupportedChannel =
  | ReturnType<typeof httpRequestChannel>
  | ReturnType<typeof googleFormTriggerChannel>;

interface UseNodeStatusOptions {
  nodeId: string;
  refreshToken: () => Promise<any>; // subscription token from your server
  channel?: SupportedChannel;
}

export function useNodeStatus({
  nodeId,
  refreshToken,
  channel: channelProp,
}: UseNodeStatusOptions) {
  const [status, setStatus] = useState<NodeStatus>("initial");

  const channel = channelProp ?? httpRequestChannel({ name: "http-request-execution" });

  const { messages, connectionStatus } = useRealtime({
    channel,
    topics: ["status"] as const,
    token: () => refreshToken(),
  });

  useEffect(() => {
    // Prefer scanning history so late-mounted nodes still pick up past updates
    const relevant = messages.all
      .filter(
        (m) =>
          m.kind === "data" &&
          m.topic === "status" &&
          m.data?.nodeId === nodeId
      )
      .at(-1); // latest for this node

    if (!relevant) return;

    //@ts-ignore
    const next = relevant?.data?.status! as "loading" | "success" | "error";

    // Map channel status → your NodeStatus type
    if (next === "loading") setStatus("loading");
    else if (next === "success") setStatus("success");
    else if (next === "error") setStatus("error");
  }, [messages.all, nodeId]);

  return {
    status,
    connectionStatus,
    // optional: expose last error for this node
    error:
      messages.all
        .filter(
          (m) =>
            m.kind === "data" &&
            m.topic === "status" &&
            m.data?.nodeId === nodeId &&
            m.data?.status === "error"
        ) //@ts-ignore
        .at(-1)?.data?.error ?? null,
  };
}
