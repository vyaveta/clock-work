import type { JobSource, ScrapedJob } from "./types";

type ProviderSearch = {
    query: string;
    location: string;
    resultsPerSource: number;
};

type ProviderResult = {
    jobs: ScrapedJob[];
    warning?: string;
};

const readJson = async (response: Response) => {
    if (!response.ok) {
        throw new Error(`Job provider returned HTTP ${response.status}`);
    }
    return response.json() as Promise<Record<string, any>>;
};

const asDate = (value: unknown) => {
    if (typeof value !== "string" || !value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

const asNumber = (value: unknown) => {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const asString = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;

const isLinkedInJob = (job: Record<string, any>) => {
    const publisher = String(job.job_publisher ?? "").toLowerCase();
    const links = [job.job_apply_link, job.job_google_link, job.job_publisher_link]
        .filter((value): value is string => typeof value === "string");
    return publisher.includes("linkedin") || links.some((link) => {
        try {
            return new URL(link).hostname.toLowerCase().endsWith("linkedin.com");
        } catch {
            return false;
        }
    });
};

const fetchAdzuna = async ({ query, location, resultsPerSource }: ProviderSearch): Promise<ProviderResult> => {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
        return { jobs: [], warning: "Adzuna skipped: ADZUNA_APP_ID and ADZUNA_APP_KEY are not configured" };
    }

    const url = new URL("https://api.adzuna.com/v1/api/jobs/in/search/1");
    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("results_per_page", String(resultsPerSource));
    url.searchParams.set("what", query);
    url.searchParams.set("where", location);
    url.searchParams.set("content-type", "application/json");

    const payload = await readJson(await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
    }));
    const results = Array.isArray(payload.results) ? payload.results : [];

    return {
        jobs: results.map((job: Record<string, any>): ScrapedJob => ({
            source: "adzuna",
            sourceId: asString(job.id),
            sourceUrl: asString(job.redirect_url),
            jobUrl: asString(job.redirect_url),
            title: asString(job.title),
            company: asString(job.company?.display_name),
            location: {
                displayName: asString(job.location?.display_name),
                country: "India",
            },
            description: asString(job.description),
            employmentType: asString(job.contract_time ?? job.contract_type),
            category: asString(job.category?.label),
            salary: {
                minimum: asNumber(job.salary_min),
                maximum: asNumber(job.salary_max),
                currency: "INR",
                isEstimated: job.salary_is_predicted === "1" || job.salary_is_predicted === 1,
            },
            postedAt: asDate(job.created),
            advertiser: asString(job.adref),
            raw: job,
        })),
    };
};

const fetchJSearch = async ({ query, location, resultsPerSource }: ProviderSearch): Promise<ProviderResult> => {
    const apiKey = process.env.JSEARCH_API_KEY;
    if (!apiKey) {
        return { jobs: [], warning: "JSearch skipped: JSEARCH_API_KEY is not configured" };
    }

    const url = new URL("https://jsearch.p.rapidapi.com/search");
    url.searchParams.set("query", `${query} in ${location}, India`);
    url.searchParams.set("page", "1");
    url.searchParams.set("num_pages", "1");
    url.searchParams.set("country", "IN");
    url.searchParams.set("date_posted", "month");

    const payload = await readJson(await fetch(url, {
        headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
    }));
    const results = Array.isArray(payload.data)
        ? payload.data.filter((job: Record<string, any>) => !isLinkedInJob(job)).slice(0, resultsPerSource)
        : [];

    return {
        jobs: results.map((job: Record<string, any>): ScrapedJob => ({
            source: "jsearch",
            sourceId: asString(job.job_id),
            sourceUrl: asString(job.job_google_link),
            jobUrl: asString(job.job_google_link ?? job.job_apply_link),
            applicationUrl: asString(job.job_apply_link),
            title: asString(job.job_title),
            company: asString(job.employer_name),
            companyUrl: asString(job.employer_website),
            companyDescription: asString(job.employer_company_type),
            location: {
                displayName: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ") || undefined,
                city: asString(job.job_city),
                state: asString(job.job_state),
                country: asString(job.job_country),
                latitude: asNumber(job.job_latitude),
                longitude: asNumber(job.job_longitude),
            },
            description: asString(job.job_description),
            employmentType: asString(job.job_employment_type),
            workplaceType: job.job_is_remote === true ? "Remote" : undefined,
            seniority: asString(job.job_required_experience?.experience_level),
            skills: Array.isArray(job.job_required_skills) ? job.job_required_skills.filter((item: unknown): item is string => typeof item === "string") : undefined,
            requirements: Array.isArray(job.job_highlights?.Qualifications) ? job.job_highlights.Qualifications.filter((item: unknown): item is string => typeof item === "string") : undefined,
            benefits: Array.isArray(job.job_highlights?.Benefits) ? job.job_highlights.Benefits.filter((item: unknown): item is string => typeof item === "string") : undefined,
            salary: {
                minimum: asNumber(job.job_min_salary),
                maximum: asNumber(job.job_max_salary),
                currency: asString(job.job_salary_currency),
                period: asString(job.job_salary_period),
            },
            postedAt: asDate(job.job_posted_at_datetime_utc),
            expiresAt: asDate(job.job_offer_expiration_datetime_utc),
            advertiser: asString(job.employer_name),
            raw: job,
        })),
    };
};

export const searchJobSources = async (input: ProviderSearch, sources: JobSource[]) => {
    const results = await Promise.all(sources.map(async (source) => {
        try {
            const result = source === "adzuna" ? await fetchAdzuna(input) : await fetchJSearch(input);
            return { source, ...result };
        } catch (error) {
            return {
                source,
                jobs: [],
                warning: `${source} search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }));

    return {
        jobs: results.flatMap((result) => result.jobs),
        warnings: results.flatMap((result) => result.warning ? [result.warning] : []),
        configuredSources: results.filter((result) => !result.warning?.includes("not configured")).length,
        failedSources: results.filter((result) => result.warning && !result.warning.includes("not configured")).length,
    };
};
