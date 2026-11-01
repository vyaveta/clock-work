"use client";

import { useEffect, useState } from "react";
import { useRealtime } from "inngest/react";
import { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { httpRequestChannel } from "@/inngest/channels/http-request";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";
import { schedulerTriggerChannel } from "@/inngest/channels/scheduler-trigger";
import { jobScraperChannel } from "@/inngest/channels/job-scraper";

type SupportedChannel =
  | ReturnType<typeof httpRequestChannel>
  | ReturnType<typeof googleFormTriggerChannel>
  | ReturnType<typeof manualTriggerChannel>
  | ReturnType<typeof schedulerTriggerChannel>
  | ReturnType<typeof jobScraperChannel>;

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

  const channel = channelProp ?? httpRequestChannel({ name: nodeId });

  const { messages, connectionStatus, runStatus } = useRealtime({
    channel,
    topics: ["status"] as const,
    token: () => refreshToken(),
    // Node status subscriptions outlive an individual workflow run.
    autoCloseOnTerminal: false,
    // Keep receiving terminal updates while the user switches tabs.
    pauseOnHidden: false,
  });

  useEffect(() => {
    // The node-specific channel keeps this as the most recent state for this node.
    const relevant = messages.byTopic.status;

    if (!relevant) return;

    //@ts-ignore
    const next = relevant?.data?.status! as "loading" | "success" | "error";

    // Map channel status → your NodeStatus type
    if (next === "loading" && runStatus === "completed") setStatus("success");
    else if (next === "loading" && (runStatus === "failed" || runStatus === "cancelled")) setStatus("error");
    else if (next === "loading") setStatus("loading");
    else if (next === "success") setStatus("success");
    else if (next === "error") setStatus("error");
  }, [messages.all, nodeId, runStatus]);

  return {
    status,
    connectionStatus,
    // optional: expose last error for this node
    error: (() => {
      // @ts-ignore realtime data is narrowed by the status channel schema above.
      const latest = messages.byTopic.status?.data;
      if (latest?.status === "error") return latest.error ?? "Workflow node failed";
      if (latest?.status === "loading" && runStatus === "failed") {
        return "The workflow run failed before this node reported completion";
      }
      return null;
    })(),
  };
}
