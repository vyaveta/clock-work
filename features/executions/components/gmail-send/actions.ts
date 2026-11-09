"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function getGmailConnectionStatus() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { connected: false as const, reason: "not_signed_in" as const };
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id, providerId: "google" },
    select: { scope: true, refreshToken: true },
  });
  if (accounts.length === 0) return { connected: false as const, reason: "not_linked" as const };

  const gmailAccount = accounts.find((account) =>
    account.scope?.split(/[ ,]+/).includes("https://www.googleapis.com/auth/gmail.send"),
  );
  if (!gmailAccount) return { connected: false as const, reason: "missing_gmail_scope" as const };
  if (!gmailAccount.refreshToken) return { connected: false as const, reason: "missing_refresh_token" as const };
  return { connected: true as const };
}
