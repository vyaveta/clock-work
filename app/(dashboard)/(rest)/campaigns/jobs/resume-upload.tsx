"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResumeUpload({ existing }: { existing?: { fileName: string; sizeBytes: number; updatedAt: string } }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("resume", file);
      const response = await fetch("/api/campaign/resume", { method: "POST", body: formData });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not upload resume.");
      setMessage("Resume uploaded. It is stored privately with your account.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not upload resume.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return <div className="space-y-3">
    {existing ? <div className="flex items-center gap-3 rounded-lg border p-3">
      <FileText className="size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{existing.fileName}</p><p className="text-xs text-muted-foreground">PDF · {(existing.sizeBytes / (1024 * 1024)).toFixed(1)} MB · Updated {new Date(existing.updatedAt).toLocaleDateString()}</p></div>
    </div> : <p className="text-sm text-muted-foreground">Upload one PDF resume. It stays private to your account.</p>}
    <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} />
    <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
      <Upload className="mr-2 size-4" />{busy ? "Uploading…" : existing ? "Replace resume" : "Upload resume"}
    </Button>
    {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}
    <p className="text-xs text-muted-foreground">PDF only, up to 10 MB. The upload is stored in the app database and is not publicly accessible.</p>
  </div>;
}
