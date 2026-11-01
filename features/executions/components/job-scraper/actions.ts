"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { inngest } from "@/inngest/client";
import { jobScraperChannel } from "@/inngest/channels/job-scraper";

export async function getJobScraperRealtimeToken(nodeId: string) {
  if (!nodeId) throw new Error("nodeId is required");

  const channel = jobScraperChannel({ name: "job-scraper-execution" });
  return getClientSubscriptionToken(inngest, {
    channel,
    topics: ["status"],
  });
}
