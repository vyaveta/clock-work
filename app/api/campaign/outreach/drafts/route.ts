import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { inngest } from "@/inngest/client";
import { getOutreachCollection, listOutreachDrafts } from "@/lib/outreach";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const drafts = await listOutreachDrafts(session.user.id);
  return Response.json(drafts.map(({ _id, userId: _userId, ...draft }) => ({ id: _id, ...draft })));
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { ids } = await request.json() as { ids?: unknown };
  if (!Array.isArray(ids) || !ids.length || !ids.every((id) => typeof id === "string")) return Response.json({ error: "Select prepared drafts to send." }, { status: 400 });
  const collection = await getOutreachCollection();
  const drafts = await collection.find({ _id: { $in: ids as string[] }, userId: session.user.id, status: "drafted" }).toArray();
  if (!drafts.length) return Response.json({ error: "No sendable drafts were selected." }, { status: 400 });
  const events = drafts.map((draft) => ({
    name: "campaign/outreach.process",
    data: { id: draft._id, userId: session.user.id, jobId: draft.jobId, email: draft.contactEmail, provider: draft.provider, model: draft.model, mode: "send", reuseDraft: true },
  }));
  await inngest.send(events);
  return Response.json({ queued: events.length });
}
