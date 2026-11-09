import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Sign in to upload a resume." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Choose a PDF resume to upload." }, { status: 400 });
  }
  if (file.size > MAX_RESUME_BYTES) {
    return Response.json({ error: "Resume must be 10 MB or smaller." }, { status: 413 });
  }
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "Upload your resume as a PDF." }, { status: 415 });
  }

  const content = new Uint8Array(await file.arrayBuffer());
  const signature = new TextDecoder().decode(content.subarray(0, 5));
  if (signature !== "%PDF-") {
    return Response.json({ error: "The uploaded file is not a valid PDF." }, { status: 415 });
  }

  const resume = await prisma.resumeAsset.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      fileName: file.name.slice(0, 200),
      mimeType: "application/pdf",
      sizeBytes: file.size,
      content,
    },
    update: {
      fileName: file.name.slice(0, 200),
      mimeType: "application/pdf",
      sizeBytes: file.size,
      content,
    },
    select: { fileName: true, sizeBytes: true, updatedAt: true },
  });

  return Response.json(resume);
}
