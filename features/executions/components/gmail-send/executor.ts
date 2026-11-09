import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import prisma from "@/lib/db";

type GmailSendData = { variableName?: string; to?: string; subject?: string; body?: string };

export async function sendGmailMessage(userId: string, to: string, subject: string, body: string, attachment?: { fileName: string; mimeType: string; content: Uint8Array }) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "google",
      scope: { contains: "https://www.googleapis.com/auth/gmail.send" },
      refreshToken: { not: null },
    },
  });
  if (!account?.refreshToken) throw new NonRetriableError("Connect a Google account with Gmail send access before running this node.");

  let accessToken = account.accessToken;
  if (!accessToken || !account.accessTokenExpiresAt || account.accessTokenExpiresAt <= new Date()) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new NonRetriableError("Google OAuth credentials are not configured.");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: account.refreshToken, grant_type: "refresh_token" }),
    });
    const tokenData = await tokenResponse.json() as { access_token?: string; expires_in?: number; error_description?: string };
    if (!tokenResponse.ok || !tokenData.access_token) throw new NonRetriableError(tokenData.error_description || "Could not refresh the Google access token. Reconnect Gmail.");
    accessToken = tokenData.access_token;
    await prisma.account.update({
      where: { id: account.id },
      data: { accessToken, accessTokenExpiresAt: new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000) },
    });
  }

  const encodedSubject = Buffer.from(subject.replace(/[\r\n]/g, " "), "utf8").toString("base64");
  const safeName = attachment?.fileName.replace(/[\r\n"]/g, "_");
  const boundary = "clockwork-" + crypto.randomUUID();
  const mime = attachment ? [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
    `--${boundary}`,
    `Content-Type: ${attachment.mimeType}; name="${safeName}"`,
    `Content-Disposition: attachment; filename="${safeName}"`,
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(attachment.content).toString("base64").replace(/.{1,76}/g, "$&\r\n"),
    `--${boundary}--`,
  ].join("\r\n") : [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\r\n");
  const raw = Buffer.from(mime, "utf8").toString("base64url");
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  const result = await response.json() as { id?: string; threadId?: string; error?: { message?: string } };
  if (!response.ok || !result.id) throw new NonRetriableError(result.error?.message || `Gmail send failed (${response.status}).`);
  return { messageId: result.id, threadId: result.threadId, to, sent: true };
}

export const gmailSendExecutor: NodeExecutor<GmailSendData> = async ({ data, nodeId, workflowId, context, step }) => {
  if (!data.variableName || !data.to || !data.subject || !data.body) {
    throw new NonRetriableError("Gmail node requires a variable name, recipient, subject, and message body.");
  }
  const workflow = await step.run(`gmail-owner-${nodeId}`, () =>
    prisma.workFlow.findUnique({ where: { id: workflowId }, select: { userId: true } }),
  );
  if (!workflow) throw new NonRetriableError("Workflow was not found.");
  const to = Handlebars.compile(data.to)(context).trim();
  const subject = Handlebars.compile(data.subject)(context);
  const body = Handlebars.compile(data.body)(context);
  if (!to || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to)) {
    throw new NonRetriableError("Enter one valid recipient email address.");
  }
  const sent = await step.run(`gmail-send-${nodeId}`, () => sendGmailMessage(workflow.userId, to, subject, body));
  return { ...context, [data.variableName]: sent };
};
