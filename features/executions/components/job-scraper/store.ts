import mongoose, { Schema, type Model } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import type { JobFreshness } from "./types";
import type { JobListing } from "./scrape";

export type MatchedJobDocument = JobListing & {
  userId: string;
  workflowId: string;
  searchTitle: string;
  searchLocation: string;
  freshness: JobFreshness;
  companyWebsite?: string;
  hrEmails: string[];
  emailCheckedAt?: Date;
  emailCheckStatus?: "found" | "not_found" | "website_not_found" | "error";
  emailCheckError?: string;
  emailSent: boolean;
  emailSentAt?: Date;
  firstSeenAt: Date;
  lastSeenAt: Date;
  seenCount: number;
};

const matchedJobSchema = new Schema<MatchedJobDocument>({
  userId: { type: String, required: true },
  workflowId: { type: String, required: true },
  searchTitle: { type: String, required: true },
  searchLocation: { type: String, required: true },
  freshness: { type: String, enum: ["2days", "week", "all"], required: true },
  title: { type: String, required: true },
  description: { type: String },
  company: { type: String, required: true },
  location: { type: String, required: true },
  url: { type: String, required: true },
  source: { type: String, enum: ["linkedin", "indeed", "naukri"], required: true },
  companyWebsite: { type: String },
  hrEmails: { type: [String], default: [] },
  emailCheckedAt: { type: Date },
  emailCheckStatus: { type: String, enum: ["found", "not_found", "website_not_found", "error"] },
  emailCheckError: { type: String },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
  firstSeenAt: { type: Date, required: true },
  lastSeenAt: { type: Date, required: true },
  seenCount: { type: Number, required: true, default: 1 },
}, {
  collection: "matched_jobs",
  timestamps: true,
  strict: true,
});

matchedJobSchema.index({ userId: 1, url: 1 }, { unique: true, name: "unique_user_job_url" });
matchedJobSchema.index({ userId: 1, lastSeenAt: -1 }, { name: "user_job_last_seen" });
matchedJobSchema.index({ userId: 1, emailCheckedAt: 1, lastSeenAt: -1 }, { name: "user_job_email_check" });

const MatchedJob = (mongoose.models.MatchedJob as Model<MatchedJobDocument> | undefined)
  ?? mongoose.model<MatchedJobDocument>("MatchedJob", matchedJobSchema);

export async function upsertMatchedJobs(input: {
  userId: string;
  workflowId: string;
  searchTitle: string;
  searchLocation: string;
  freshness: JobFreshness;
  jobs: JobListing[];
}) {
  if (input.jobs.length === 0) return { inserted: 0, updated: 0 };

  await connectMongoose();
  await MatchedJob.init();
  const now = new Date();
  const uniqueJobs = new Map(input.jobs.map((job) => [`${input.userId}:${job.url}`, job]));
  const operations = [...uniqueJobs.values()].map((job) => ({
    updateOne: {
      filter: { userId: input.userId, url: job.url },
      update: {
        $set: {
          ...job,
          ...(job.companyWebsite ? { companyWebsite: job.companyWebsite } : {}),
          ...(job.hrEmails?.length ? { hrEmails: job.hrEmails } : {}),
          workflowId: input.workflowId,
          searchTitle: input.searchTitle,
          searchLocation: input.searchLocation,
          freshness: input.freshness,
          lastSeenAt: now,
        },
        $setOnInsert: { firstSeenAt: now },
        $inc: { seenCount: 1 },
      },
      upsert: true,
    },
  }));

  const result = await MatchedJob.bulkWrite(operations, { ordered: false });
  return { inserted: result.upsertedCount, updated: result.modifiedCount };
}

export async function getMatchedJobsNeedingHrEmails(userId: string, workflowId: string, limit: number) {
  await connectMongoose();
  await MatchedJob.init();
  return MatchedJob.find({
    userId,
    workflowId,
    // Empty results stay eligible so users can rerun after discovery logic improves
    // or a company publishes a recruiting address.
    $or: [{ hrEmails: { $exists: false } }, { hrEmails: { $size: 0 } }],
  }).sort({ emailCheckedAt: 1, lastSeenAt: -1 }).limit(limit).lean().exec();
}

export async function getMatchedJobsWithHrEmails(userId: string, workflowId: string, limit = 2000) {
  await connectMongoose();
  await MatchedJob.init();
  return MatchedJob.find({ userId, workflowId, hrEmails: { $exists: true, $ne: [] } })
    .sort({ lastSeenAt: -1 })
    .limit(limit)
    .select({ title: 1, company: 1, url: 1, hrEmails: 1 })
    .lean()
    .exec();
}

export async function getMatchedJobsDashboard(userId: string, workflowIds: string[]) {
  if (workflowIds.length === 0) return { jobsFound: 0, jobsWithContacts: 0, jobs: [] };
  await connectMongoose();
  await MatchedJob.init();
  const campaignFilter = { userId, workflowId: { $in: workflowIds } };
  const [jobsFound, jobsWithContacts, jobs] = await Promise.all([
    MatchedJob.countDocuments(campaignFilter),
    MatchedJob.countDocuments({ ...campaignFilter, hrEmails: { $exists: true, $ne: [] } }),
    MatchedJob.find(campaignFilter)
      .sort({ lastSeenAt: -1 })
      .limit(30)
      .select({ title: 1, company: 1, location: 1, url: 1, source: 1, hrEmails: 1, emailCheckStatus: 1, lastSeenAt: 1, workflowId: 1, emailSent: 1, emailSentAt: 1 })
      .lean()
      .exec(),
  ]);
  return {
    jobsFound,
    jobsWithContacts,
    jobs: jobs.map((job) => ({
      id: String(job._id),
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      source: job.source,
      hrEmails: job.hrEmails ?? [],
      emailCheckStatus: job.emailCheckStatus,
      lastSeenAt: job.lastSeenAt,
      workflowId: job.workflowId,
      emailSent: job.emailSent === true,
      emailSentAt: job.emailSentAt,
    })),
  };
}

export async function markMatchedJobEmailSent(userId: string, jobId: string) {
  await connectMongoose();
  const result = await MatchedJob.updateOne(
    { _id: jobId, userId },
    { $set: { emailSent: true, emailSentAt: new Date() } },
  );
  if (result.matchedCount === 0) throw new Error("Matched job not found for this user");
}

export async function updateMatchedJobHrEmails(input: {
  id: string;
  companyWebsite?: string;
  hrEmails: string[];
  status: "found" | "not_found" | "website_not_found" | "error";
  error?: string;
}) {
  await connectMongoose();
  const result = await MatchedJob.updateOne(
    { _id: input.id },
    {
      $set: {
        ...(input.companyWebsite ? { companyWebsite: input.companyWebsite } : {}),
        hrEmails: input.hrEmails,
        emailCheckedAt: new Date(),
        emailCheckStatus: input.status,
        ...(input.error ? { emailCheckError: input.error } : { emailCheckError: "" }),
      },
    },
  );
  if (result.matchedCount === 0) throw new Error(`Matched job ${input.id} no longer exists`);
}
