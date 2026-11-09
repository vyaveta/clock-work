"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDownUp,
  ArrowUpRight,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Job = {
  id: string
  title: string
  company: string
  location: string
  url: string
  source: string
  hrEmails: string[]
  emailCheckStatus?: string
  lastSeenAt: string
  workflowId: string
  emailSent: boolean
  emailSentAt?: string
}

type ModelOption = {
  id: string
  displayName: string
  description?: string
  badges?: string[]
}

export function JobsTable({
  jobs,
  workflowNames,
  hasResume,
}: {
  jobs: Job[]
  workflowNames: Record<string, string>
  hasResume: boolean
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [contact, setContact] = useState("all")
  const [mail, setMail] = useState("all")
  const [sort, setSort] = useState("newest")
  const [selected, setSelected] = useState<string[]>([])
  const [provider, setProvider] = useState<"gemini" | "groq">("gemini")
  const [models, setModels] = useState<ModelOption[]>([])
  const [model, setModel] = useState("")
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelError, setModelError] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  const visible = useMemo(
    () =>
      jobs
        .filter((job) => {
          const haystack = [
            job.title,
            job.company,
            job.location,
            ...job.hrEmails,
          ]
            .join(" ")
            .toLowerCase()

          return (
            (!query || haystack.includes(query.toLowerCase())) &&
            (contact === "all" ||
              (contact === "found"
                ? job.hrEmails.length > 0
                : job.hrEmails.length === 0)) &&
            (mail === "all" ||
              (mail === "sent" ? job.emailSent : !job.emailSent))
          )
        })
        .sort((a, b) =>
          sort === "newest"
            ? new Date(b.lastSeenAt).getTime() -
              new Date(a.lastSeenAt).getTime()
            : new Date(a.lastSeenAt).getTime() -
              new Date(b.lastSeenAt).getTime()
        ),
    [jobs, query, contact, mail, sort]
  )

  const selectableVisible = visible.filter((job) => job.hrEmails.length > 0)
  const selectedContacts = selected.reduce((total, id) => {
    const job = jobs.find((candidate) => candidate.id === id)
    return (
      total +
      (job ? new Set(job.hrEmails.map((email) => email.toLowerCase())).size : 0)
    )
  }, 0)
  const currentModel = models.find((option) => option.id === model)

  useEffect(() => {
    const controller = new AbortController()
    setLoadingModels(true)
    setModelError("")
    setModels([])
    setModel("")

    fetch(provider === "gemini" ? "/api/gemini/models" : "/api/groq/models", {
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          models?: ModelOption[]
          error?: string
        }
        if (!response.ok)
          throw new Error(result.error || "Could not load models.")
        setModels(result.models ?? [])
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setModelError(error.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingModels(false)
      })

    return () => controller.abort()
  }, [provider])

  const selectVisible = () => {
    setSelected((current) =>
      Array.from(
        new Set([...current, ...selectableVisible.map((job) => job.id)])
      )
    )
  }

  const clearSelection = () => setSelected([])

  return (
    <div className="space-y-5">
      <section className="mx-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-gradient-to-r from-primary/8 via-primary/3 to-transparent px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-primary/10 p-2.5 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">Create personalized outreach</h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Select job listings with recruiter emails, choose an AI model,
                then prepare drafts or send them.
              </p>
            </div>
          </div>
          <Link
            href="/campaigns/jobs/prepared"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <WandSparkles className="size-4" />
            Draft review
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </Link>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>1. AI provider</span>
              <Select
                value={provider}
                onValueChange={(value) =>
                  setProvider(value as "gemini" | "groq")
                }
              >
                <SelectTrigger className="h-11 w-full bg-background">
                  <SelectValue placeholder="Choose provider" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                </SelectContent>
              </Select>
              <span className="block text-xs font-normal text-muted-foreground">
                Uses the provider key configured for this app.
              </span>
            </label>

            <label className="space-y-2 text-sm font-medium">
              <span>2. Model</span>
              <Select
                value={model}
                onValueChange={setModel}
                disabled={loadingModels || !models.length}
              >
                <SelectTrigger className="h-11 w-full bg-background">
                  <SelectValue
                    placeholder={
                      loadingModels
                        ? "Loading available models…"
                        : modelError
                          ? "Models unavailable"
                          : "Choose a model"
                    }
                  />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="start"
                  className="max-h-80"
                >
                  {models.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{option.displayName}</span>
                        <span className="max-w-72 truncate text-xs text-muted-foreground">
                          {option.id}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="block text-xs font-normal text-muted-foreground">
                {modelError ||
                  (loadingModels
                    ? "Loading models from the selected provider…"
                    : currentModel?.description ||
                      (models.length
                        ? "Choose the model that will write each message."
                        : "No models are available."))}
              </span>
            </label>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-xl bg-muted/35 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">3. Review the batch</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.length} job{selected.length === 1 ? "" : "s"}{" "}
                  selected
                  <span aria-hidden="true"> · </span>
                  {selectedContacts} contact email
                  {selectedContacts === 1 ? "" : "s"}
                </p>
              </div>
              {selected.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void queue("prepare")}
                disabled={busy || !selected.length || !model}
              >
                {busy ? "Queueing…" : "Prepare drafts"}
              </Button>
              <Button
                onClick={() => void queue("send")}
                disabled={busy || !selected.length || !model || !hasResume}
                title={
                  !hasResume ? "Upload a resume before sending." : undefined
                }
              >
                {busy ? "Queueing…" : "Generate & send"}
              </Button>
              {!hasResume && (
                <Link
                  href="#resume"
                  className="self-center px-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Upload a resume to enable sending
                </Link>
              )}
            </div>
          </div>
        </div>

        {(modelError || message) && (
          <div className="border-t px-5 py-3 sm:px-6">
            {modelError && (
              <p role="alert" className="text-sm text-destructive">
                {modelError}
              </p>
            )}
            {message && (
              <p role="status" className="text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search role, company, location, or email"
            className="h-10 bg-background pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter by contact"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">All contacts</option>
            <option value="found">Has contact</option>
            <option value="missing">No contact</option>
          </select>
          <select
            aria-label="Filter by email status"
            value={mail}
            onChange={(event) => setMail(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">All mail states</option>
            <option value="sent">Mail sent</option>
            <option value="unsent">Not sent</option>
          </select>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}
          >
            <ArrowDownUp className="size-4" />
            {sort === "newest" ? "Newest first" : "Oldest first"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 text-sm">
        <p className="text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{visible.length}</span>{" "}
          of {jobs.length} jobs
          <span aria-hidden="true"> · </span>
          {selectableVisible.length} with recruiter emails
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={selectVisible}
          disabled={!selectableVisible.length}
        >
          Select visible contacts
        </Button>
      </div>

      {visible.length ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-16 pl-5">Select</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>HR contacts</TableHead>
                  <TableHead>Mail</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Workflow</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((job) => {
                  const isSelected = selected.includes(job.id)

                  return (
                    <TableRow
                      key={job.id}
                      data-state={isSelected ? "selected" : undefined}
                    >
                      <TableCell className="pl-5">
                        <input
                          aria-label={"Select " + job.title}
                          type="checkbox"
                          disabled={!job.hrEmails.length}
                          checked={isSelected}
                          onChange={(event) =>
                            setSelected((ids) =>
                              event.target.checked
                                ? Array.from(new Set([...ids, job.id]))
                                : ids.filter((id) => id !== job.id)
                            )
                          }
                          className="size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </TableCell>
                      <TableCell className="min-w-56 py-4">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {job.title}
                          <ArrowUpRight className="ml-1 inline size-3.5" />
                        </a>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {job.company} · {job.source}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-52 text-sm text-muted-foreground">
                        {job.location}
                      </TableCell>
                      <TableCell className="min-w-64">
                        {job.hrEmails.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {job.hrEmails.map((email) => (
                              <Badge
                                key={email}
                                variant="secondary"
                                className="font-normal"
                              >
                                {email}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {job.emailCheckStatus === "not_found"
                              ? "No email found"
                              : "Still searching"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.emailSent ? "default" : "outline"}>
                          {job.emailSent ? "Sent" : "Not sent"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {new Date(job.lastSeenAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {workflowNames[job.workflowId] ?? "Job search"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed px-5 py-12 text-center">
          <p className="font-medium">No jobs match these filters</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Change a filter or try a shorter search.
          </p>
        </div>
      )}
    </div>
  )

  async function queue(mode: "prepare" | "send") {
    if (mode === "send" && !hasResume) return
    setBusy(true)
    setMessage("")

    try {
      const response = await fetch("/api/campaign/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: selected, provider, model, mode }),
      })
      const result = (await response.json()) as {
        queued?: number
        error?: string
      }
      if (!response.ok)
        throw new Error(result.error || "Could not queue campaign emails.")

      setMessage(
        "Queued " +
          result.queued +
          " individual job/contact email task" +
          (result.queued === 1 ? "." : "s.")
      )
      setSelected([])
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Queue failed.")
    } finally {
      setBusy(false)
    }
  }
}
