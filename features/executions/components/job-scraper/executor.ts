import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { httpRequestChannel } from "@/inngest/channels/http-request";
import { inngest } from "@/inngest/client";
import { normalizeJobSources, scrapeJobs } from "./scrape";
import type { JobFreshness } from "./types";
import { upsertMatchedJobs } from "./store";
import prisma from "@/lib/db";

type JobScraperData = {
  title?: string;
  location?: string;
  sources?: unknown;
  variableName?: string;
  freshness?: JobFreshness;
};

export const jobScraperExecutor: NodeExecutor<JobScraperData> = async ({ data, nodeId, context, step, workflowId }) => {
  const channel = httpRequestChannel({ name: nodeId });
  const title = data.title?.trim();
  if (!title) {
    await inngest.realtime.publish(channel.status, { nodeId, status: "error", error: "Add a job title in the node settings" });
    throw new NonRetriableError("Job Scraper: Add a job title in the node settings");
  }
  const sources = normalizeJobSources(data.sources);
  const variableName = data.variableName?.trim() || "jobSearch";
  const freshness = data.freshness === "2days" || data.freshness === "all" ? data.freshness : "week";

  await step.realtime.publish(`status-loading-${nodeId}`, channel.status, { nodeId, status: "loading" });
  try {
    const location = data.location?.trim() || "Anywhere";
    const result = await step.run(`job-scraper-${nodeId}`, () => scrapeJobs(title, location, sources, freshness));
    let persistence: { inserted: number; updated: number };
    try {
      persistence = await step.run(`job-scraper-mongodb-${nodeId}`, async () => {
        const workflow = await prisma.workFlow.findUnique({
          where: { id: workflowId },
          select: { userId: true },
        });
        if (!workflow) throw new Error("The workflow owner could not be found");

        return upsertMatchedJobs({
          userId: workflow.userId,
          workflowId,
          searchTitle: title,
          searchLocation: location,
          freshness,
          jobs: result.jobs,
        });
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown database error";
      throw new Error(`MongoDB save failed: ${detail}`);
    }

    await step.realtime.publish(`status-success-${nodeId}`, channel.status, { nodeId, status: "success" });
    return {
      ...context,
      [variableName]: {
        title,
        location,
        freshness,
        total: result.jobs.length,
        saved: persistence.inserted + persistence.updated,
        inserted: persistence.inserted,
        updated: persistence.updated,
        jobs: result.jobs,
        sourceErrors: result.errors,
      },
    };
  } catch (error) {
    await inngest.realtime.publish(channel.status, {
      nodeId,
      status: "error",
      error: error instanceof Error ? error.message : "Unable to scrape and save job listings",
    });
    throw error;
  }
};
