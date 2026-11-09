"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { getGmailConnectionStatus } from "./actions";
import type { VariableInfo } from "@/lib/workflow-variables";

const schema = z.object({
  variableName: z.string().min(1, "Variable name is required").regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Use letters, numbers, and underscores; start with a letter or underscore."),
  to: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
});
export type GmailSendForm = z.infer<typeof schema>;

export function GmailSendDialog({ open, onOpenChange, onSubmit, defaultValues, availableVariables = [] }: {
  open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (values: GmailSendForm) => void;
  defaultValues?: Partial<GmailSendForm>; availableVariables?: VariableInfo[];
}) {
  const [connection, setConnection] = useState<
    | { connected: true }
    | { connected: false; reason: "not_signed_in" | "not_linked" | "missing_gmail_scope" | "missing_refresh_token" }
    | null
  >(null);
  const [checking, setChecking] = useState(false);
  const form = useForm<GmailSendForm>({
    resolver: zodResolver(schema),
    defaultValues: { variableName: defaultValues?.variableName ?? "emailResult", to: defaultValues?.to ?? "", subject: defaultValues?.subject ?? "", body: defaultValues?.body ?? "" },
  });
  useEffect(() => {
    if (!open) return;
    form.reset({ variableName: defaultValues?.variableName ?? "emailResult", to: defaultValues?.to ?? "", subject: defaultValues?.subject ?? "", body: defaultValues?.body ?? "" });
    setChecking(true);
    getGmailConnectionStatus().then(setConnection).finally(() => setChecking(false));
  }, [open, defaultValues, form]);

  const connect = async () => {
    await authClient.linkSocial({
      provider: "google",
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
      callbackURL: window.location.href,
    });
  };
  const labels = { variableName: "Result variable", to: "To", subject: "Subject" } as const;
  const placeholders = { variableName: "emailResult", to: "person@example.com", subject: "Hello" } as const;
  const connectionMessage = checking
    ? "Checking Google connection…"
    : connection?.connected
      ? "Google account connected"
      : connection?.reason === "not_signed_in"
        ? "Sign in to Clock Work before connecting Gmail"
        : connection?.reason === "not_linked"
          ? "Google account not connected"
          : connection?.reason === "missing_gmail_scope"
            ? "Google is linked, but Gmail send permission is missing. Connect Gmail to grant it."
            : connection?.reason === "missing_refresh_token"
              ? "Gmail permission is present, but Google did not provide ongoing access. Reconnect the account."
              : "Checking Google connection…";

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] min-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>Send Gmail</DialogTitle><DialogDescription>Send a plain text email from the Google account connected to your user profile.</DialogDescription></DialogHeader>
      <div className="flex items-center justify-between rounded-md border p-3 text-sm">
        <span>{connectionMessage}</span>
        <Button type="button" variant="outline" onClick={connect}>{connection?.connected ? "Reconnect Google" : "Connect Gmail"}</Button>
      </div>
      <form onSubmit={form.handleSubmit((values) => { onSubmit(values); onOpenChange(false); })} className="mt-4 space-y-6">
        <FieldGroup>
          {(["variableName", "to", "subject"] as const).map((name) => <Controller key={name} name={name} control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={"gmail-" + name}>{labels[name]}</FieldLabel>
            <Input {...field} id={"gmail-" + name} aria-invalid={fieldState.invalid} placeholder={placeholders[name]} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>} />)}
          <Controller name="body" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="gmail-body">Message</FieldLabel><Textarea {...field} id="gmail-body" className="min-h-36" aria-invalid={fieldState.invalid} placeholder="Write your message…" />
            <FieldDescription>Use {"{{variable.path}}"} to insert values from earlier workflow nodes.</FieldDescription>{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>} />
          {availableVariables.length > 0 && <div className="rounded-md border bg-muted/40 p-3"><p className="mb-2 text-xs font-medium text-muted-foreground">Available workflow variables</p><ul className="space-y-1">{availableVariables.map((v) => <li key={v.path} className="text-xs"><code>{"{{" + v.path + "}}"}</code> — {v.description}</li>)}</ul></div>}
        </FieldGroup>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
