export type JobSource = "linkedin" | "indeed" | "naukri";
export type JobFreshness = "2days" | "week" | "all";

// Provider fields stay optional because listings frequently omit details.
export type ScrapedJob = {
    source?: JobSource;
    sourceId?: string;
    sourceUrl?: string;
    title?: string;
    company?: string;
    companyUrl?: string;
    companyDescription?: string;
    location?: {
        displayName?: string;
        city?: string;
        state?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    description?: string;
    employmentType?: string;
    workplaceType?: string;
    seniority?: string;
    category?: string;
    industry?: string;
    skills?: string[];
    requirements?: string[];
    qualifications?: string[];
    benefits?: string[];
    salary?: {
        minimum?: number;
        maximum?: number;
        currency?: string;
        period?: string;
        isEstimated?: boolean;
    };
    postedAt?: Date;
    expiresAt?: Date;
    applicationUrl?: string;
    jobUrl?: string;
    advertiser?: string;
    matchScore?: number;
    matchedSkills?: string[];
    raw?: unknown;
};

export type JobScraperNodeData = {
    title?: string;
    location?: string;
    sources?: JobSource[];
    freshness?: JobFreshness;
    variableName?: string;
};
