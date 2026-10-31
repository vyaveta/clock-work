import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { jobScraperChannel } from "@/inngest/channels/job-scraper";
import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { extractResumeKeywords, scoreJobMatch } from "./matching";
import { searchJobSources } from "./providers";
import { upsertMatchedJobs } from "./store";
import type { JobScraperNodeData, JobSource, ScrapedJob } from "./types";

const channel = jobScraperChannel({ name: "job-scraper-execution" });

const getContextValue = (context: Record<string, unknown>, path: string) => {
    const normalizedPath = path.replace(/\[(?:"|')?([^\]'\"]+)(?:"|')?\]/g, ".$1");
    return normalizedPath.split(".").filter(Boolean).reduce<unknown>((value, key) => {
        if (!value || typeof value !== "object") return undefined;
        return (value as Record<string, unknown>)[key];
    }, context);
};

const normalizeSources = (sources: unknown): JobSource[] => {
    if (!Array.isArray(sources)) return ["adzuna", "jsearch"];
    return [...new Set(sources.filter((source): source is JobSource => source === "adzuna" || source === "jsearch"))];
};

export const jobScraperExecutor: NodeExecutor<JobScraperNodeData> = async ({
    data,
    nodeId,
    context,
    step,
    workflowId,
}) => {
    try {
        await step.realtime.publish(`job-scraper-loading-${nodeId}`, channel.status, {
            nodeId,
            status: "loading",
        });

        const result = await step.run(`job-scraper-${nodeId}`, async () => {
            const resumePath = data.resumeTextPath?.trim() || "resumeText";
            const configuredResume = getContextValue(context, resumePath);
            const resumeValue = typeof configuredResume === "string" ? configuredResume : context.resumeText;
            const resumeText = typeof resumeValue === "string" ? resumeValue.trim() : "";
            if (!resumeText) {
                throw new NonRetriableError(`No resume text was found at workflow context path "${resumePath}"`);
            }

            const resumeKeywords = extractResumeKeywords(resumeText);
            const query = data.searchQuery?.trim() || resumeKeywords.slice(0, 7).join(" ");
            if (!query) {
                throw new NonRetriableError("Add a search query or provide a resume with searchable text");
            }

            const owner = await prisma.workFlow.findUnique({
                where: { id: workflowId },
                select: { userId: true },
            });
            if (!owner) throw new NonRetriableError("Workflow owner was not found");

            const sources = normalizeSources(data.sources);
            if (sources.length === 0) {
                throw new NonRetriableError("Select at least one job source");
            }

            const search = await searchJobSources({
                query,
                location: data.location?.trim() || "India",
                resultsPerSource: Math.min(50, Math.max(1, Math.floor(data.resultsPerSource ?? 20))),
            }, sources);

            if (search.configuredSources === 0) {
                throw new NonRetriableError("Configure ADZUNA_APP_ID and ADZUNA_APP_KEY, or JSEARCH_API_KEY, for the selected job sources");
            }
            if (search.failedSources === search.configuredSources) {
                throw new Error(`All configured job sources failed: ${search.warnings.join("; ")}`);
            }

            const matchedJobs = search.jobs.map((job: ScrapedJob) => {
                const match = scoreJobMatch(resumeKeywords, job);
                return {
                    ...job,
                    matchScore: match.score,
                    matchedSkills: match.matchedSkills,
                };
            }).filter((job) => job.matchScore >= Math.min(100, Math.max(0, data.minimumMatchScore ?? 20)));

            const storedCount = await upsertMatchedJobs(owner.userId, matchedJobs);
            const outputJobs = matchedJobs.map((job) => ({
                source: job.source,
                sourceId: job.sourceId,
                title: job.title,
                company: job.company,
                location: job.location,
                employmentType: job.employmentType,
                salary: job.salary,
                postedAt: job.postedAt?.toISOString(),
                applicationUrl: job.applicationUrl,
                jobUrl: job.jobUrl,
                matchScore: job.matchScore,
                matchedSkills: job.matchedSkills,
            }));

            return {
                query,
                location: data.location?.trim() || "India",
                count: matchedJobs.length,
                storedCount,
                jobs: outputJobs,
                warnings: search.warnings,
            };
        });

        await step.realtime.publish(`job-scraper-success-${nodeId}`, channel.status, {
            nodeId,
            status: "success",
        });

        const outputVariable = data.outputVariable?.trim() || "matchedJobs";
        return { ...context, [outputVariable]: result };
    } catch (error) {
        await inngest.realtime.publish(channel.status, {
            nodeId,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
    }
};
