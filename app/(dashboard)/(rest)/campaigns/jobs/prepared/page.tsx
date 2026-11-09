import Link from "next/link"
import { ArrowLeft, ArrowUpRight, MailCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/auth-utils"
import { listOutreachDrafts } from "@/lib/outreach"
import { PreparedMailList } from "./prepared-mail-list"

export default async function PreparedMailsPage() {
  const session = await requireAuth()
  const drafts = await listOutreachDrafts(session.user.id)
  const editable = drafts
    .filter((draft) => draft.status === "drafted")
    .map((draft) => ({
      id: draft._id,
      jobTitle: draft.jobTitle,
      company: draft.company,
      contactEmail: draft.contactEmail,
      jobUrl: draft.jobUrl,
      provider: draft.provider,
      model: draft.model,
      subject: draft.subject ?? "",
      body: draft.body ?? "",
      status: draft.status,
    }))

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href="/campaigns/jobs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Job Search Campaign
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-primary uppercase">
            Outreach review
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Prepared mails
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Edit and review each message before sending it to the recruiter with
            your resume attached.
          </p>
        </div>
        <Link
          href="/campaigns/jobs"
          className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Campaign dashboard
          <ArrowUpRight className="size-4" />
        </Link>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-gradient-to-r from-primary/8 via-primary/3 to-transparent p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <MailCheck className="size-5" />
          </div>
          <div>
            <p className="font-semibold">Draft queue</p>
            <p className="text-sm text-muted-foreground">
              Select, edit, then send. Each email runs as an individual
              background task.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {editable.length} waiting for review
        </Badge>
      </section>

      <PreparedMailList drafts={editable} />
    </div>
  )
}
