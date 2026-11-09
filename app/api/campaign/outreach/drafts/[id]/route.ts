import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOutreachCollection } from "@/lib/outreach";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  const { subject, body } = await request.json() as { subject?: unknown; body?: unknown };
  if (typeof subject !== "string" || !subject.trim() || typeof body !== "string" || !body.trim()) return Response.json({ error: "Subject and body are required." }, { status: 400 });
  const result = await (await getOutreachCollection()).updateOne({ _id: id, userId: session.user.id, status: "drafted" }, { $set: { subject: subject.trim(), body: body.trim(), updatedAt: new Date() } });
  if (!result.matchedCount) return Response.json({ error: "Draft not found or no longer editable." }, { status: 404 });
  return Response.json({ saved: true });
}
