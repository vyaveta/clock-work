"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BriefcaseBusiness, FileText, MapPin, Search, Sparkles } from "lucide-react";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const schema = z.object({
  title: z.string().trim().min(2, "Enter the job title you want to search for"),
  location: z.string().optional(),
  variableName: z.string().trim().regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Use a valid variable name"),
  sources: z.array(z.enum(["linkedin", "indeed", "naukri"])).min(1, "Choose at least one job board"),
  freshness: z.enum(["2days", "week", "all"]),
});

export type JobScraperForm = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: JobScraperForm) => void;
  defaultValues?: Partial<JobScraperForm>;
};

const boards = [
  { id: "linkedin", label: "LinkedIn", color: "bg-sky-500" },
  { id: "indeed", label: "Indeed", color: "bg-blue-700" },
  { id: "naukri", label: "Naukri", color: "bg-orange-500" },
] as const;

const boardIds = boards.map((board) => board.id);
const normalizeSources = (sources?: readonly string[]): JobScraperForm["sources"] => {
  const validSources = (sources ?? []).filter(
    (source): source is JobScraperForm["sources"][number] => boardIds.includes(source as typeof boardIds[number]),
  );
  return validSources.length ? [...new Set(validSources)] : [...boardIds];
};

const commonRoles = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Analyst", "Data Scientist", "Machine Learning Engineer", "Product Manager",
  "Product Designer", "UX Designer", "Business Analyst", "Project Manager",
  "DevOps Engineer", "QA Engineer", "Marketing Manager", "Graphic Designer",
  "Accountant", "Sales Representative", "Customer Success Manager", "HR Manager",
];

async function suggestRoleFromPdf(file: File): Promise<string | undefined> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = await Promise.all(Array.from({ length: Math.min(document.numPages, 8) }, async (_, index) => {
    const page = await document.getPage(index + 1);
    const content = await page.getTextContent();
    return content.items.map((item) => "str" in item ? item.str : "").join(" ");
  }));
  const text = pages.join(" ").toLowerCase();
  return commonRoles.find((role) => text.includes(role.toLowerCase()));
}

export function JobScraperDialog({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const [resumeName, setResumeName] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [variableName, setVariableName] = useState("jobSearch");
  const [sources, setSources] = useState<JobScraperForm["sources"]>(["linkedin", "indeed", "naukri"]);
  const [freshness, setFreshness] = useState<JobScraperForm["freshness"]>("week");
  const [errors, setErrors] = useState<Partial<Record<keyof JobScraperForm, string>>>({});

  useEffect(() => {
    if (open) {
      setTitle(defaultValues?.title ?? "");
      setLocation(defaultValues?.location ?? "");
      setVariableName(defaultValues?.variableName ?? "jobSearch");
      // Older saved nodes may still contain the previous paid provider ids.
      setSources(normalizeSources(defaultValues?.sources));
      setFreshness(defaultValues?.freshness ?? "week");
      setErrors({});
      setResumeName("");
    }
  }, [open, defaultValues]);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = schema.safeParse({ title, location, variableName, sources, freshness });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0],
        variableName: fieldErrors.variableName?.[0],
        sources: fieldErrors.sources?.[0],
      });
      return;
    }

    onSubmit(result.data);
    onOpenChange(false);
  };

  const toggleSource = (id: JobScraperForm["sources"][number]) => {
    setSources((current) => current.includes(id)
      ? current.filter((source) => source !== id)
      : [...current, id]);
    setErrors((current) => ({ ...current, sources: undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BriefcaseBusiness className="size-5" /></div>
          <DialogTitle>Find your next role</DialogTitle>
          <DialogDescription>Search public job listings across free job boards. A resume is optional.</DialogDescription>
        </DialogHeader>

        <form className="mt-3 space-y-5" onSubmit={handleSave}>
          <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
            <div className="space-y-2">
              <Field data-invalid={!!errors.title}>
                <FieldLabel htmlFor="job-title"><Search className="mr-1 inline size-3.5" /> Job title</FieldLabel>
                <Input id="job-title" autoFocus placeholder="e.g. Product Designer" value={title} onChange={(event) => { setTitle(event.target.value); setErrors((current) => ({ ...current, title: undefined })); }} />
                <FieldDescription>Enter a role, or add a resume PDF to suggest one automatically.</FieldDescription>
                {errors.title && <FieldError errors={[{ message: errors.title }]} />}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="job-location"><MapPin className="mr-1 inline size-3.5" /> Location <span className="text-muted-foreground">· optional</span></FieldLabel>
              <Input id="job-location" placeholder="City, region, or Remote" value={location} onChange={(event) => setLocation(event.target.value)} />
            </Field>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Choose job boards</p>
            <div className="grid grid-cols-3 gap-2">
              {boards.map((board) => {
                const active = sources.includes(board.id);
                return <button key={board.id} type="button" aria-pressed={active} onClick={() => toggleSource(board.id)} className={`rounded-xl border p-3 text-left transition hover:border-primary/50 ${active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-background"}`}>
                  <span className={`mb-2 block size-2.5 rounded-full ${board.color}`} />
                  <span className="text-sm font-medium">{board.label}</span>
                </button>;
              })}
            </div>
            {errors.sources && <p className="text-xs text-destructive">{errors.sources}</p>}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Posted within</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["2days", "Past 2 days"],
                ["week", "Past week"],
                ["all", "Any time"],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={freshness === value} onClick={() => setFreshness(value)} className={`rounded-xl border px-3 py-2.5 text-sm transition hover:border-primary/50 ${freshness === value ? "border-primary bg-primary/5 font-medium ring-1 ring-primary/20" : "bg-background text-muted-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Resume <span className="font-normal text-muted-foreground">· optional</span></p>
            <label htmlFor="resume-file" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-3 transition hover:border-primary/50 hover:bg-muted/30">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted"><FileText className="size-5 text-muted-foreground" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{resumeName || "Add a resume PDF"}</span><span className="text-xs text-muted-foreground">PDF only · read on your device</span></span>
              <span className="rounded-lg border px-3 py-1.5 text-xs font-medium">Browse</span>
              <input id="resume-file" className="sr-only" type="file" accept="application/pdf,.pdf" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                  event.currentTarget.value = "";
                  setResumeName("Please choose a PDF file");
                  return;
                }
                setResumeName(file.name);
                try {
                  const suggestedRole = await suggestRoleFromPdf(file);
                  if (suggestedRole && !title.trim()) {
                    setTitle(suggestedRole);
                    setResumeName(`${file.name} · suggested ${suggestedRole}`);
                  } else if (!suggestedRole) {
                    setResumeName(`${file.name} · enter a job title below`);
                  }
                } catch {
                  setResumeName(`${file.name} · enter a job title below`);
                }
              }} />
            </label>
            <p className="text-xs text-muted-foreground">We read the PDF on this device to suggest a job title. Only the title you choose is saved with this workflow.</p>
          </div>

          <div className="rounded-xl bg-muted/40 p-3">
            <label htmlFor="job-variable" className="mb-1 block text-xs font-medium">Save results as</label>
            <Input id="job-variable" className="h-9 bg-background font-mono text-sm" value={variableName} onChange={(event) => { setVariableName(event.target.value); setErrors((current) => ({ ...current, variableName: undefined })); }} />
            <p className="mt-1 text-xs text-muted-foreground">Use <code>{`{{${variableName || "jobSearch"}.jobs}}`}</code> in later steps.</p>
            {errors.variableName && <p className="mt-1 text-xs text-destructive">{errors.variableName}</p>}
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5" /> Free public listings</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="gap-2"><Search className="size-4" /> Save search</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
