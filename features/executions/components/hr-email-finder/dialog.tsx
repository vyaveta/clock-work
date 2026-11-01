"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MailSearch, Search } from "lucide-react";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const schema = z.object({
  maxJobs: z.number().int().min(1).max(50),
  variableName: z.string().trim().regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Use a valid variable name"),
});

export type HrEmailFinderForm = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: HrEmailFinderForm) => void;
  defaultValues?: Partial<HrEmailFinderForm>;
};

export function HrEmailFinderDialog({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const [maxJobs, setMaxJobs] = useState(25);
  const [variableName, setVariableName] = useState("hrContacts");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMaxJobs(defaultValues?.maxJobs ?? 25);
    setVariableName(defaultValues?.variableName ?? "hrContacts");
    setError("");
  }, [open, defaultValues]);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = schema.safeParse({ maxJobs, variableName });
    if (!result.success) {
      setError(result.error.flatten().fieldErrors.variableName?.[0] ?? "Choose a valid search limit");
      return;
    }
    onSubmit(result.data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MailSearch className="size-5" /></div>
          <DialogTitle>Find public HR contacts</DialogTitle>
          <DialogDescription>Check matched jobs for public recruiting emails, then search each company website and its contact or careers pages.</DialogDescription>
        </DialogHeader>

        <form className="mt-3 space-y-5" onSubmit={handleSave}>
          <Field>
            <FieldLabel htmlFor="hr-max-jobs">Maximum jobs to check</FieldLabel>
            <select id="hr-max-jobs" className="h-10 rounded-lg border bg-background px-3 text-sm" value={maxJobs} onChange={(event) => setMaxJobs(Number(event.target.value))}>
              <option value={10}>10 jobs</option>
              <option value={25}>25 jobs</option>
              <option value={50}>50 jobs</option>
            </select>
            <FieldDescription>We only search for publicly listed, role based email addresses.</FieldDescription>
          </Field>

          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="hr-output-variable">Save results as</FieldLabel>
            <Input id="hr-output-variable" value={variableName} onChange={(event) => { setVariableName(event.target.value); setError(""); }} />
            <FieldDescription>Use <code>{`{{${variableName || "hrContacts"}.jobs}}`}</code> in later workflow steps.</FieldDescription>
            {error && <FieldError errors={[{ message: error }]} />}
          </Field>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="gap-2"><Search className="size-4" /> Save settings</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
