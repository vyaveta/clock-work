import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateText, type LanguageModel } from "ai";
import { NonRetriableError } from "inngest";
import { ObjectId } from "mongodb";
import prisma from "@/lib/db";
import { getMongoDatabase } from "@/lib/mongodb";
import { getOutreachCollection, markJobMailSent } from "@/lib/outreach";
import { sendGmailMessage } from "@/features/executions/components/gmail-send/executor";
import { inngest } from "./client";

type EventData = { id: string; userId: string; jobId: string; email: string; provider: "gemini" | "groq"; model: string; mode: "prepare" | "send"; reuseDraft?: boolean };

export const processOutreach = inngest.createFunction(
  { id: "process-job-outreach", triggers: { event: "campaign/outreach.process" }, concurrency: { limit: 1, key: "event.data.userId" } },
  async ({ event, step }) => {
    const data = event.data as EventData;
    const drafts = await getOutreachCollection();
    const db = await getMongoDatabase();
    try {
      const job = await step.run("load-job", () => db.collection("matched_jobs").findOne({
        _id: new ObjectId(data.jobId), userId: data.userId, hrEmails: data.email,
      }));
      if (!job) throw new NonRetriableError("Job or HR contact is no longer available.");
      const apiKey = data.provider === "gemini" ? process.env.GOOGLE_GENERATIVE_AI_API_KEY : process.env.GROQ_API_KEY;
      if (!apiKey) throw new NonRetriableError(data.provider === "gemini" ? "GOOGLE_GENERATIVE_AI_API_KEY is not configured." : "GROQ_API_KEY is not configured.");
      const existingDraft = data.reuseDraft ? await drafts.findOne({ _id: data.id, userId: data.userId, status: "drafted" }) : null;
      if (data.reuseDraft && !existingDraft) throw new NonRetriableError("Prepared draft is missing or already processed.");
      const generated = existingDraft?.subject && existingDraft.body ? { subject: existingDraft.subject, body: existingDraft.body } : await step.run("draft-email", async () => {
        const model = (data.provider === "gemini"
          ? createGoogleGenerativeAI({ apiKey })(data.model)
          : createGroq({ apiKey })(data.model)) as unknown as LanguageModel;
        const result = await generateText({
          model,
          system: "Write concise, professional job inquiry emails. Use only facts supported by the resume. Never invent experience. Return only JSON with string fields subject and body.",
          prompt: JSON.stringify({ jobTitle: job.title, company: job.company, location: job.location, jobDescription: job.description || "Not available", recipient: data.email, resumeText: "The user's resume is attached. Do not claim facts not present in the job details; keep the email general where resume details are unavailable." }),
        });
        const match = result.text.match(/\{[\s\S]*\}/);
        if (!match) throw new NonRetriableError("AI did not return a valid email draft.");
        const parsed = JSON.parse(match[0]) as { subject?: string; body?: string };
        if (!parsed.subject || !parsed.body) throw new NonRetriableError("AI draft is missing a subject or body.");
        return { subject: parsed.subject, body: parsed.body };
      });
      await drafts.updateOne({ _id: data.id, userId: data.userId }, { $set: { ...generated, status: data.mode === "send" ? "sending" : "drafted", error: "", updatedAt: new Date() } });
      if (data.mode === "send") {
        const resume = await step.run("load-resume", () => prisma.resumeAsset.findUnique({ where: { userId: data.userId } }));
        if (!resume) throw new NonRetriableError("Upload a PDF resume before sending campaign emails.");
        const sent = await step.run("send-email", () => sendGmailMessage(data.userId, data.email, generated.subject, generated.body, {
          fileName: resume.fileName, mimeType: resume.mimeType, content: new Uint8Array(Object.values(resume.content)),
        }));
        await step.run("save-send-result", async () => {
          await drafts.updateOne({ _id: data.id, userId: data.userId }, { $set: { status: "sent", gmailMessageId: sent.messageId, updatedAt: new Date() } });
          await markJobMailSent(data.userId, data.jobId, new Date());
        });
      }
      return { id: data.id, status: data.mode === "send" ? "sent" : "drafted" };
    } catch (error) {
      await drafts.updateOne({ _id: data.id, userId: data.userId }, { $set: { status: "failed", error: error instanceof Error ? error.message : "Outreach failed", updatedAt: new Date() } });
      throw error;
    }
  },
);
