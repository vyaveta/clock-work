import Link from "next/link"
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Mail,
  MailCheck,
  MessageSquareText,
  Workflow,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ResumeUpload } from "./resume-upload"
import { JobsTable } from "./jobs-table"
import { NodeType } from "@/lib/generated/prisma/enums"
import prisma from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"
import { getMatchedJobsDashboard } from "@/features/executions/components/job-scraper/store"

function MetricCard({
  title,
  value,
  description,
  Icon,
}: {
  title: string
  value: number
  description: string
  Icon: typeof BriefcaseBusiness
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-3xl">
            {value.toLocaleString()}
          </CardTitle>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default async function JobSearchCampaignPage() {
  const session = await requireAuth()
  const campaignWorkflows = await prisma.workFlow.findMany({
    where: {
      userId: session.user.id,
      nodes: {
        some: {
          type: { in: [NodeType.JOB_SCRAPER, NodeType.HR_EMAIL_FINDER] },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  })
  const workflowIds = campaignWorkflows.map((workflow) => workflow.id)
  const [mongoData, outreachTasks, resume] = await Promise.all([
    getMatchedJobsDashboard(session.user.id, workflowIds).catch(() => ({
      jobsFound: 0,
      jobsWithContacts: 0,
      jobs: [],
    })),
    workflowIds.length
      ? prisma.outreachTask.findMany({
          where: { userId: session.user.id, workflowId: { in: workflowIds } },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            jobTitle: true,
            company: true,
            jobUrl: true,
            contactEmail: true,
            status: true,
            workflowId: true,
          },
        })
      : Promise.resolve([]),
    prisma.resumeAsset.findUnique({
      where: { userId: session.user.id },
      select: { fileName: true, sizeBytes: true, updatedAt: true },
    }),
  ])
  const sent = outreachTasks.filter((task) => task.status === "sent").length
  const replied = 0
  const workflowNames = Object.fromEntries(
    campaignWorkflows.map((workflow) => [workflow.id, workflow.name])
  )
  const jobs = mongoData.jobs.map((job) => ({
    ...job,
    lastSeenAt: job.lastSeenAt.toISOString(),
    emailSentAt: job.emailSentAt?.toISOString(),
  }))

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-primary uppercase">
            Campaign workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Job Search Campaign
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Discover jobs and recruiter contacts in bulk, then manage each
            opportunity from one focused workspace.
          </p>
        </div>
        <Link
          href="/workflows"
          className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Workflow className="size-4" />
          Open workflows
          <ArrowUpRight className="size-4" />
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Jobs found"
          value={mongoData.jobsFound}
          description="Unique job listings saved"
          Icon={BriefcaseBusiness}
        />
        <MetricCard
          title="Jobs with contacts"
          value={mongoData.jobsWithContacts}
          description="Listings with at least one email"
          Icon={Mail}
        />
        <MetricCard
          title="Outreach candidates"
          value={outreachTasks.length}
          description="One row per job and email"
          Icon={MessageSquareText}
        />
        <MetricCard
          title="Emails sent"
          value={sent}
          description="Recorded successful sends"
          Icon={MailCheck}
        />
        <MetricCard
          title="Replies"
          value={replied}
          description="Reply sync is not connected yet"
          Icon={MessageSquareText}
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/15">
          <CardTitle>Jobs collected</CardTitle>
          <CardDescription>
            Find recruiter contacts, review freshness, and prepare or send
            personalized messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 py-5">
          {jobs.length ? (
            <JobsTable
              jobs={jobs}
              workflowNames={workflowNames}
              hasResume={Boolean(resume)}
            />
          ) : (
            <div className="mx-6 rounded-xl border border-dashed px-5 py-10 text-center">
              <p className="font-medium">
                Your job list is ready for its first results
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Run a workflow with a Job Search node to collect listings here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card id="resume">
          <CardHeader>
            <CardTitle>Your resume</CardTitle>
            <CardDescription>
              Stored privately and attached to emails you send from this
              campaign.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeUpload
              existing={
                resume
                  ? {
                      fileName: resume.fileName,
                      sizeBytes: resume.sizeBytes,
                      updatedAt: resume.updatedAt.toISOString(),
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job campaign workflows</CardTitle>
            <CardDescription>
              Only workflows containing Job Search or Find HR Emails appear
              here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaignWorkflows.length ? (
              campaignWorkflows.map((workflow) => (
                <Link
                  key={workflow.id}
                  href={"/workflows/" + workflow.id}
                  className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50"
                >
                  <span>
                    <span className="block font-medium">{workflow.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Updated {workflow.updatedAt.toLocaleDateString()}
                    </span>
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No job-search workflows yet. Add a Job Search or Find HR Emails
                node to a workflow.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/15">
          <CardTitle>Recruiter contacts</CardTitle>
          <CardDescription>
            Each row tracks one job and recruiter email. Background drafting and
            sending process each contact separately.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {outreachTasks.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="pl-6">Job</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outreachTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="min-w-56 pl-6">
                        <a
                          href={task.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {task.jobTitle}
                          <ArrowUpRight className="ml-1 inline size-3" />
                        </a>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {task.company}
                        </div>
                      </TableCell>
                      <TableCell>{task.contactEmail}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {workflowNames[task.workflowId] ?? "Job search"}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize">
                          {task.status.replaceAll("_", " ")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              No recruiter contacts yet. Add and run Find HR Emails in a
              job-search workflow.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
