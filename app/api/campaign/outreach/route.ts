import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";
import { inngest } from "@/inngest/client";
import { outreachId, getOutreachCollection } from "@/lib/outreach";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const input = await request.json() as { jobIds?: unknown; provider?: unknown; model?: unknown; mode?: unknown };
  const ids = Array.isArray(input.jobIds) ? [...new Set(input.jobIds.filter((id): id is string => typeof id === "string" && ObjectId.isValid(id)))] : [];
  const provider = input.provider === "groq" ? "groq" : input.provider === "gemini" ? "gemini" : null;
  const model = typeof input.model === "string" && /^[a-zA-Z0-9._/-]{1,120}$/.test(input.model) ? input.model : null;
  const mode = input.mode === "send" ? "send" : input.mode === "prepare" ? "prepare" : null;
  if (!ids.length || !provider || !model || !mode) return Response.json({ error: "Select jobs, an AI provider/model, and an action." }, { status: 400 });

  const db = await getMongoDatabase();
  const jobs = await db.collection("matched_jobs").find({ _id: { $in: ids.map((id) => new ObjectId(id)) }, userId: session.user.id, hrEmails: { $exists: true, $ne: [] } }).toArray();
  if (!jobs.length) return Response.json({ error: "No selected jobs with HR contacts were found." }, { status: 400 });
  const drafts = await getOutreachCollection();
  const events = [];
  for (const job of jobs) {
    for (const email of [...new Set((job.hrEmails as string[]).map((value) => value.toLowerCase()))]) {
      const id = outreachId(session.user.id, String(job._id), email);
      const existing = await drafts.findOne({ _id: id });
      if (existing?.status === "sent" || existing?.status === "sending") continue;
      await drafts.updateOne({ _id: id }, { $set: {
        userId: session.user.id, jobId: String(job._id), contactEmail: email,
        jobTitle: job.title, company: job.company, jobUrl: job.url, provider,
        status: "queued", model, error: "", updatedAt: new Date(),
      }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
      events.push({ name: "campaign/outreach.process", data: { id, userId: session.user.id, jobId: String(job._id), email, provider, model, mode } });
    }
  }
  if (events.length) await inngest.send(events);
  return Response.json({ queued: events.length });
}
