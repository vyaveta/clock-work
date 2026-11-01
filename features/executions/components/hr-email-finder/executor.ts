import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { httpRequestChannel } from "@/inngest/channels/http-request";
import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { getMatchedJobsNeedingHrEmails, updateMatchedJobHrEmails } from "../job-scraper/store";
import { findCompanyHrEmails } from "./scrape";

type HrEmailFinderData = {
  maxJobs?: number;
  variableName?: string;
};

export const hrEmailFinderExecutor: NodeExecutor<HrEmailFinderData> = async ({ data, nodeId, context, step, workflowId }) => {
  const channel = httpRequestChannel({ name: nodeId });
  const variableName = data.variableName?.trim() || "hrContacts";
  const maxJobs = Math.min(50, Math.max(1, Math.floor(data.maxJobs ?? 25)));

  await step.realtime.publish(`status-loading-${nodeId}`, channel.status, { nodeId, status: "loading" });
  try {
    const workflow = await step.run(`hr-email-owner-${nodeId}`, () => prisma.workFlow.findUnique({
      where: { id: workflowId },
      select: { userId: true },
    }));
    if (!workflow) throw new NonRetriableError("HR Email Finder: Workflow owner could not be found");

    const jobs = await step.run(`hr-email-load-matched-jobs-${nodeId}`, async () => {
      const matchedJobs = await getMatchedJobsNeedingHrEmails(workflow.userId, maxJobs);
      return matchedJobs.map((job) => ({ ...job, _id: String(job._id) }));
    });
    const results: Array<{
      jobId: string;
      title: string;
      company: string;
      jobUrl: string;
      companyWebsite?: string;
      hrEmails: string[];
      status: "found" | "not_found" | "website_not_found" | "error";
      pagesScanned: number;
      error?: string;
    }> = [];
    const errors: Array<{ company: string; message: string }> = [];

    for (const job of jobs) {
      const jobId = job._id;
      let discovery: Awaited<ReturnType<typeof findCompanyHrEmails>>;
      try {
        //@ts-ignore
        discovery = await step.run(`hr-email-scan-${nodeId}-${jobId}`, () => findCompanyHrEmails({
          company: job.company,
          location: job.location,
          companyWebsite: job.companyWebsite,
          jobUrl: job.url,
        }));
      } catch (error) {
        discovery = {
          companyWebsite: job.companyWebsite,
          hrEmails: [],
          pagesScanned: 0,
          error: error instanceof Error ? error.message : "Could not scan the company website",
        };
      }

      const status = discovery.hrEmails.length
        ? "found"
        : discovery.error === "Could not locate the company website"
          ? "website_not_found"
          : discovery.error ? "error" : "not_found";

      try {
        await step.run(`hr-email-save-${nodeId}-${jobId}`, () => updateMatchedJobHrEmails({
          id: jobId,
          companyWebsite: discovery.companyWebsite,
          hrEmails: discovery.hrEmails,
          status,
          error: discovery.error,
        }));
      } catch (error) {
        throw new Error(`MongoDB HR contact update failed: ${error instanceof Error ? error.message : "Unknown database error"}`);
      }

      if (discovery.error) errors.push({ company: job.company, message: discovery.error });
      results.push({
        jobId,
        title: job.title,
        company: job.company,
        jobUrl: job.url,
        companyWebsite: discovery.companyWebsite,
        hrEmails: discovery.hrEmails,
        status,
        pagesScanned: discovery.pagesScanned,
        ...(discovery.error ? { error: discovery.error } : {}),
      });
    }

    const found = results.filter((result) => result.hrEmails.length > 0).length;
    await step.realtime.publish(`status-success-${nodeId}`, channel.status, { nodeId, status: "success" });
    return {
      ...context,
      [variableName]: {
        scanned: results.length,
        found,
        emailsFound: results.reduce((count, result) => count + result.hrEmails.length, 0),
        websitesFound: results.filter((result) => result.companyWebsite).length,
        pagesScanned: results.reduce((count, result) => count + result.pagesScanned, 0),
        jobs: results,
        errors,
      },
    };
  } catch (error) {
    await inngest.realtime.publish(channel.status, {
      nodeId,
      status: "error",
      error: error instanceof Error ? error.message : "HR email search failed",
    });
    throw error;
  }
};
