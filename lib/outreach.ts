import "server-only";
import { ObjectId } from "mongodb";
import { getMongoDatabase } from "@/lib/mongodb";

export type OutreachDraft = {
  _id: string;
  userId: string;
  jobId: string;
  contactEmail: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  provider: "gemini" | "groq";
  model: string;
  status: "queued" | "drafted" | "sending" | "sent" | "failed";
  subject?: string;
  body?: string;
  error?: string;
  gmailMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const getOutreachCollection = async () =>
  (await getMongoDatabase()).collection<OutreachDraft>("outreach_drafts");

export function outreachId(userId: string, jobId: string, email: string) {
  return [userId, jobId, email.toLowerCase()].join(":");
}

export async function listOutreachDrafts(userId: string) {
  const collection = await getOutreachCollection();
  return collection.find({ userId }).sort({ updatedAt: -1 }).limit(500).toArray();
}

export async function markJobMailSent(userId: string, jobId: string, sentAt: Date) {
  const db = await getMongoDatabase();
  await db.collection("matched_jobs").updateOne(
    { _id: new ObjectId(jobId), userId },
    { $set: { emailSent: true, emailSentAt: sentAt } },
  );
}
