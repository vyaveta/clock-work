"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Check, MailCheck, Send, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Draft = {
  id: string
  jobTitle: string
  company: string
  contactEmail: string
  jobUrl: string
  provider: string
  model: string
  subject: string
  body: string
  status: string
}

export function PreparedMailList({ drafts }: { drafts: Draft[] }) {
  const router = useRouter()
  const [values, setValues] = useState(drafts)
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const allSelected =
    values.length > 0 && values.every((draft) => selected.includes(draft.id))

  const update = (id: string, key: "subject" | "body", value: string) =>
    setValues((items) =>
      items.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    )

  const save = async (draft: Draft) => {
    const response = await fetch(
      "/api/campaign/outreach/drafts/" + encodeURIComponent(draft.id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: draft.subject, body: draft.body }),
      }
    )
    const result = (await response.json()) as { error?: string }
    if (!response.ok) throw new Error(result.error || "Could not save draft.")
  }

  const send = async () => {
    setBusy(true)
    setMessage("")
    try {
      for (const id of selected) {
        const draft = values.find((item) => item.id === id)
        if (draft) await save(draft)
      }

      const response = await fetch("/api/campaign/outreach/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      })
      const result = (await response.json()) as {
        queued?: number
        error?: string
      }
      if (!response.ok)
        throw new Error(result.error || "Could not queue selected drafts.")

      setMessage(
        "Queued " +
          result.queued +
          " email" +
          (result.queued === 1 ? "" : "s") +
          " for sending."
      )
      setSelected([])
      router.refresh()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not send drafts."
      )
    } finally {
      setBusy(false)
    }
  }

  if (!values.length) {
    return (
      <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </div>
        <h2 className="font-semibold">No drafts waiting for review</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Choose jobs with recruiter emails and prepare drafts. They will appear
          here for editing before you send.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="checkbox"
            aria-label={
              allSelected ? "Clear all selected drafts" : "Select all drafts"
            }
            checked={allSelected}
            onChange={(event) =>
              setSelected(
                event.target.checked ? values.map((draft) => draft.id) : []
              )
            }
            className="size-4 accent-primary"
          />
          <div>
            <p className="text-sm font-semibold">
              {selected.length} selected{" "}
              <span className="font-normal text-muted-foreground">
                of {values.length} drafts
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Messages are sent individually in the background.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setSelected([])}
            >
              Clear
            </Button>
          )}
          <Button
            disabled={!selected.length || busy}
            onClick={() => void send()}
          >
            {busy ? (
              <MailCheck className="size-4 animate-pulse" />
            ) : (
              <Send className="size-4" />
            )}
            {busy ? "Queueing…" : "Send selected"}
          </Button>
        </div>
      </div>

      {message && (
        <p
          role={message.startsWith("Queued ") ? "status" : "alert"}
          className="rounded-xl border bg-muted/30 px-4 py-3 text-sm"
        >
          {message}
        </p>
      )}

      <div className="space-y-4">
        {values.map((draft) => {
          const isSelected = selected.includes(draft.id)

          return (
            <article
              key={draft.id}
              className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors"
              data-state={isSelected ? "selected" : undefined}
            >
              <header className="flex flex-wrap items-start gap-3 border-b bg-muted/20 px-4 py-4 sm:px-5">
                <input
                  className="mt-1 size-4 accent-primary"
                  type="checkbox"
                  aria-label={"Select draft for " + draft.jobTitle}
                  checked={isSelected}
                  onChange={(event) =>
                    setSelected((ids) =>
                      event.target.checked
                        ? Array.from(new Set([...ids, draft.id]))
                        : ids.filter((id) => id !== draft.id)
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <a
                    href={draft.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold hover:text-primary hover:underline"
                  >
                    {draft.jobTitle}
                    <ArrowUpRight className="ml-1 inline size-3.5" />
                  </a>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {draft.company} <span aria-hidden="true">·</span>{" "}
                    {draft.contactEmail}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {draft.provider}
                </Badge>
                <Badge
                  variant="outline"
                  className="max-w-full font-mono text-xs"
                >
                  {draft.model}
                </Badge>
              </header>

              <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-4 p-4 sm:p-5">
                  <label className="block space-y-2 text-sm font-medium">
                    Email subject
                    <Input
                      value={draft.subject}
                      onChange={(event) =>
                        update(draft.id, "subject", event.target.value)
                      }
                      placeholder="Subject line"
                      className="bg-background"
                    />
                  </label>
                  <label className="block space-y-2 text-sm font-medium">
                    Message
                    <Textarea
                      className="min-h-48 resize-y bg-background leading-6"
                      value={draft.body}
                      onChange={(event) =>
                        update(draft.id, "body", event.target.value)
                      }
                      placeholder="Your personalized message"
                    />
                  </label>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void save(draft)
                          .then(() => setMessage("Draft saved."))
                          .catch((error) => setMessage(error.message))
                      }
                    >
                      <Save className="size-4" />
                      Save edits
                    </Button>
                  </div>
                </div>

                <aside className="space-y-4 border-t bg-muted/15 p-4 sm:p-5 lg:border-t-0 lg:border-l">
                  <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Recipient
                    </p>
                    <p className="mt-1 text-sm font-medium break-all">
                      {draft.contactEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Source job
                    </p>
                    <a
                      href={draft.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View listing
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>
                  <div className="rounded-xl border bg-background p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Check className="size-4 text-emerald-600" />
                      Ready for review
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Your resume will be attached when this message is sent.
                    </p>
                  </div>
                </aside>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
