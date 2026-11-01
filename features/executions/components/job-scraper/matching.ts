import { createHash } from "node:crypto";
import type { ScrapedJob } from "./types";

const stopWords = new Set([
    "about", "above", "after", "again", "against", "also", "among", "and", "any", "are", "because",
    "been", "before", "being", "below", "between", "both", "but", "can", "could", "does", "doing",
    "each", "for", "from", "further", "have", "having", "here", "into", "its", "more", "most",
    "other", "our", "out", "over", "same", "should", "some", "such", "than", "that", "the", "their",
    "them", "then", "there", "these", "they", "this", "those", "through", "under", "until", "very",
    "was", "were", "what", "when", "where", "which", "while", "will", "with", "would", "you", "your",
    "experience", "years", "year", "work", "working", "responsibilities", "responsibility", "required",
    "skills", "skill", "role", "team", "company", "job", "candidate", "candidate's", "including",
]);

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();

export const extractResumeKeywords = (resumeText: string, limit = 18) => {
    const frequencies = new Map<string, number>();
    for (const token of normalize(resumeText).split(/\s+/)) {
        if (token.length < 2 || stopWords.has(token) || /^\d+$/.test(token)) continue;
        frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    }

    return [...frequencies.entries()]
        .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
        .slice(0, limit)
        .map(([word]) => word);
};

export const scoreJobMatch = (resumeKeywords: string[], job: ScrapedJob) => {
    if (resumeKeywords.length === 0) {
        return { score: 0, matchedSkills: [] as string[] };
    }

    const titleTokens = new Set(normalize(job.title ?? "").split(/\s+/).filter(Boolean));
    const descriptionTokens = new Set(normalize([
        job.description,
        ...(job.skills ?? []),
        ...(job.requirements ?? []),
        ...(job.qualifications ?? []),
        job.category,
        job.industry,
    ].filter(Boolean).join(" ")).split(/\s+/).filter(Boolean));

    const matchedSkills = resumeKeywords.filter((keyword) => titleTokens.has(keyword) || descriptionTokens.has(keyword));
    const titleMatches = resumeKeywords.filter((keyword) => titleTokens.has(keyword)).length;
    const coverage = matchedSkills.length / resumeKeywords.length;
    const titleCoverage = titleMatches / resumeKeywords.length;

    return {
        score: Math.min(100, Math.round(coverage * 80 + titleCoverage * 20)),
        matchedSkills,
    };
};

const normalizedUrl = (value?: string) => {
    if (!value) return undefined;
    try {
        const url = new URL(value);
        url.hash = "";
        url.search = "";
        url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
        url.pathname = url.pathname.replace(/\/$/, "");
        return url.toString().toLowerCase();
    } catch {
        return value.trim().toLowerCase();
    }
};

export const getJobDedupeKey = (job: ScrapedJob) => {
    const title = normalize(job.title ?? "");
    const company = normalize(job.company ?? "");
    const location = normalize(job.location?.city ?? job.location?.displayName?.split(",")[0] ?? "");
    let identity: string;

    if (title && company) {
        identity = `title-company-location|${title}|${company}|${location}`;
    } else {
        const url = normalizedUrl(job.applicationUrl ?? job.jobUrl ?? job.sourceUrl);
        if (url) identity = `url|${url}`;
        else if (job.sourceId) identity = `source-id|${job.source ?? "unknown"}|${job.sourceId}`;
        else identity = `raw|${JSON.stringify(job.raw ?? job)}`;
    }

    return createHash("sha256").update(identity).digest("hex");
};
