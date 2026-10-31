import type { AnyBulkWriteOperation } from "mongodb";
import { getMongoDatabase } from "@/lib/mongodb";
import type { ScrapedJob } from "./types";
import { getJobDedupeKey } from "./matching";

export type MatchedJobDocument = Omit<ScrapedJob, "source"> & {
    source?: string;
    sources?: string[];
    userId: string;
    dedupeKey: string;
    createdAt: Date;
    updatedAt: Date;
    lastSeenAt: Date;
};

const withoutUndefined = (value: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined));

export const upsertMatchedJobs = async (userId: string, jobs: ScrapedJob[]) => {
    const database = await getMongoDatabase();
    const collection = database.collection<MatchedJobDocument>("matched_jobs");
    const now = new Date();

    const uniqueJobs = new Map<string, { job: ScrapedJob; sources: Set<string> }>();
    for (const job of jobs) {
        const dedupeKey = getJobDedupeKey(job);
        const existing = uniqueJobs.get(dedupeKey);
        if (existing) {
            existing.job = { ...existing.job, ...withoutUndefined(job as unknown as Record<string, unknown>) } as ScrapedJob;
            if (job.source) existing.sources.add(job.source);
        } else {
            uniqueJobs.set(dedupeKey, {
                job,
                sources: new Set(job.source ? [job.source] : []),
            });
        }
    }

    if (uniqueJobs.size === 0) return 0;

    const operations: AnyBulkWriteOperation<MatchedJobDocument>[] = [...uniqueJobs.entries()].map(([dedupeKey, { job, sources }]) => ({
        updateOne: {
            filter: { userId, dedupeKey },
            update: {
                $set: {
                    ...withoutUndefined(job as unknown as Record<string, unknown>),
                    updatedAt: now,
                    lastSeenAt: now,
                },
                $setOnInsert: {
                    userId,
                    dedupeKey,
                    createdAt: now,
                },
                ...(sources.size ? { $addToSet: { sources: { $each: [...sources] } } } : {}),
            },
            upsert: true,
        },
    }));

    const result = await collection.bulkWrite(operations, { ordered: false });
    return result.upsertedCount + result.matchedCount;
};
