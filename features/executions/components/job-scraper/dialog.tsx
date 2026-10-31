"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import type { JobScraperNodeData, JobSource } from "./types"

interface JobScraperDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    value: JobScraperNodeData
    onSave: (value: JobScraperNodeData) => void
}

export const JobScraperDialog = ({ open, onOpenChange, value, onSave }: JobScraperDialogProps) => {
    const [resumeTextPath, setResumeTextPath] = useState(value.resumeTextPath ?? "resumeText")
    const [searchQuery, setSearchQuery] = useState(value.searchQuery ?? "")
    const [location, setLocation] = useState(value.location ?? "India")
    const [sources, setSources] = useState<JobSource[]>(value.sources ?? ["adzuna", "jsearch"])
    const [resultsPerSource, setResultsPerSource] = useState(value.resultsPerSource ?? 20)
    const [minimumMatchScore, setMinimumMatchScore] = useState(value.minimumMatchScore ?? 20)
    const [outputVariable, setOutputVariable] = useState(value.outputVariable ?? "matchedJobs")

    useEffect(() => {
        if (!open) return
        setResumeTextPath(value.resumeTextPath ?? "resumeText")
        setSearchQuery(value.searchQuery ?? "")
        setLocation(value.location ?? "India")
        setSources(value.sources ?? ["adzuna", "jsearch"])
        setResultsPerSource(value.resultsPerSource ?? 20)
        setMinimumMatchScore(value.minimumMatchScore ?? 20)
        setOutputVariable(value.outputVariable ?? "matchedJobs")
    }, [open, value])

    const toggleSource = (source: JobSource, checked: boolean) => {
        setSources((current) => checked
            ? [...new Set([...current, source])]
            : current.filter((item) => item !== source),
        )
    }

    const handleSave = () => {
        onSave({
            resumeTextPath: resumeTextPath.trim() || "resumeText",
            searchQuery: searchQuery.trim(),
            location: location.trim() || "India",
            sources,
            resultsPerSource: Math.min(50, Math.max(1, Math.floor(resultsPerSource || 20))),
            minimumMatchScore: Math.min(100, Math.max(0, Math.floor(minimumMatchScore || 0))),
            outputVariable: outputVariable.trim() || "matchedJobs",
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Configure job search</DialogTitle>
                    <DialogDescription>
                        Search India-focused job sources, score listings against resume text, and save matches to your MongoDB account collection.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="job-resume-path">Resume text context path</Label>
                        <Input id="job-resume-path" value={resumeTextPath} onChange={(event) => setResumeTextPath(event.target.value)} placeholder="resumeText" />
                        <p className="text-xs text-muted-foreground">Manual runs can provide resumeText. For form triggers, use a path such as googleForm.responses.Resume.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="job-search-query">Search query (optional)</Label>
                        <Input id="job-search-query" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Leave blank to infer keywords from the resume" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="job-location">Location in India</Label>
                        <Input id="job-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="India or Bengaluru, Karnataka" />
                    </div>

                    <fieldset className="grid gap-2">
                        <legend className="text-sm font-medium">Job sources</legend>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox checked={sources.includes("adzuna")} onCheckedChange={(checked) => toggleSource("adzuna", checked === true)} />
                            Adzuna India
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox checked={sources.includes("jsearch")} onCheckedChange={(checked) => toggleSource("jsearch", checked === true)} />
                            JSearch (RapidAPI aggregator)
                        </label>
                    </fieldset>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="job-results-limit">Results per source</Label>
                            <Input id="job-results-limit" type="number" min={1} max={50} value={resultsPerSource} onChange={(event) => setResultsPerSource(Number(event.target.value))} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="job-match-score">Minimum match score</Label>
                            <Input id="job-match-score" type="number" min={0} max={100} value={minimumMatchScore} onChange={(event) => setMinimumMatchScore(Number(event.target.value))} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="job-output-variable">Output variable</Label>
                        <Input id="job-output-variable" value={outputVariable} onChange={(event) => setOutputVariable(event.target.value)} placeholder="matchedJobs" />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" onClick={handleSave}>Save node</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
