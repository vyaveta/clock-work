import "server-only";

import * as cheerio from "cheerio";
import type { JobFreshness } from "./types";

export type JobSource = "linkedin" | "indeed" | "naukri";
const supportedSources: JobSource[] = ["linkedin", "indeed", "naukri"];

export function normalizeJobSources(sources: unknown): JobSource[] {
  if (!Array.isArray(sources)) return [...supportedSources];
  const validSources = [...new Set(sources.filter(
    (source): source is JobSource => typeof source === "string" && supportedSources.includes(source as JobSource),
  ))];
  return validSources.length ? validSources : [...supportedSources];
}

export type JobListing = {
  title: string;
  company: string;
  location: string;
  url: string;
  source: JobSource;
  companyWebsite?: string;
  hrEmails?: string[];
  description?: string;
};

const sourceHosts: Record<JobSource, string> = {
  linkedin: "www.linkedin.com",
  indeed: "www.indeed.com",
  naukri: "www.naukri.com",
};

function absoluteUrl(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined;
  try {
    const url = new URL(href, base);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function extractHrEmails(value: string): string[] {
  const decoded = value
    .replace(/&#64;|&#x40;/gi, "@")
    .replace(/\s*(?:\[at\]|\(at\)|\sat\s)\s*/gi, "@")
    .replace(/\s*(?:\[dot\]|\(dot\)|\sdot\s)\s*/gi, ".");
  const matches = decoded.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi) ?? [];
  const roleMailbox = /^(?:hr|humanresources|careers?|jobs?|recruit(?:ment|er|ing)?|talent(?:acquisition)?|people|hiring|join(?:us)?|workwithus)(?:[._+-]|$)/i;
  return [...new Set(matches.map((email) => email.toLowerCase()).filter((email) => roleMailbox.test(email.split("@")[0])))];
}

function companyWebsite(href: string | undefined, base: string): string | undefined {
  const value = absoluteUrl(href, base);
  if (!value) return undefined;
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    if (["linkedin.com", "indeed.com", "naukri.com", "google.com", "facebook.com", "instagram.com", "youtube.com"].some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) return undefined;
    return value;
  } catch {
    return undefined;
  }
}

function parseJsonLd(value: unknown, source: JobSource, base: string): JobListing[] {
  if (!value || typeof value !== "object") return [];
  const entry = value as Record<string, unknown>;
  const items = Array.isArray(entry.itemListElement) ? entry.itemListElement : [];
  return items.flatMap((item): JobListing[] => {
    const listItem = item as Record<string, unknown>;
    const job = (listItem.item ?? item) as Record<string, unknown>;
    if (typeof job.title !== "string") return [];
    const companyValue = job.hiringOrganization as Record<string, unknown> | undefined;
    const locationValue = job.jobLocation as Record<string, unknown> | undefined;
    const address = locationValue?.address as Record<string, unknown> | undefined;
    const url = absoluteUrl(typeof job.url === "string" ? job.url : undefined, base);
    const companyUrlValue = typeof companyValue?.url === "string"
      ? companyValue.url
      : Array.isArray(companyValue?.sameAs) ? companyValue.sameAs.find((value): value is string => typeof value === "string") : undefined;
    const website = companyWebsite(companyUrlValue, base);
    const hrEmails = extractHrEmails([companyValue?.email, job.description].filter((part): part is string => typeof part === "string").join(" "));
    return [{
      title: job.title,
      company: typeof companyValue?.name === "string" ? companyValue.name : "Company not listed",
      location: [address?.addressLocality, address?.addressRegion, address?.addressCountry]
        .filter((part): part is string => typeof part === "string").join(", ") || "Location not listed",
      url: url ?? base,
      source,
      ...(typeof job.description === "string" ? { description: job.description } : {}),
      ...(website ? { companyWebsite: website } : {}),
      ...(hrEmails.length ? { hrEmails } : {}),
    }];
  });
}

function extractListings(html: string, source: JobSource, base: string): JobListing[] {
  const $ = cheerio.load(html);
  const jsonLd = $("script[type='application/ld+json']").toArray().flatMap((script) => {
    try {
      const parsed = JSON.parse($(script).text()) as unknown;
      return Array.isArray(parsed) ? parsed.flatMap((part) => parseJsonLd(part, source, base)) : parseJsonLd(parsed, source, base);
    } catch {
      return [];
    }
  });
  if (jsonLd.length) return jsonLd;

  const selectors: Record<JobSource, string[]> = {
    linkedin: [".base-card", ".jobs-search__results-list li"],
    indeed: [".job_seen_beacon", ".jobsearch-ResultsList > li"],
    naukri: ["article.jobTuple", ".srp-jobtuple-wrapper"],
  };
  const results: JobListing[] = [];
  for (const selector of selectors[source]) {
    $(selector).each((_, element) => {
      const card = $(element);
      const link = card.find("a.base-card__full-link, h2 a, a.title, a[href*='/jobs/view/'], a[href*='/job-listings/']").first();
      const title = link.text().trim() || card.find("h2, h3, .jobTitle, .title").first().text().trim();
      const url = absoluteUrl(link.attr("href"), base);
      if (!title || !url) return;
      const companyLink = card.find(".base-search-card__subtitle a, [data-testid='company-name'], .companyInfo a, .comp-name a").first();
      const website = companyWebsite(companyLink.attr("href"), base);
      const hrEmails = extractHrEmails(`${card.text()} ${card.find("a[href^='mailto:']").map((__, emailLink) => $(emailLink).attr("href")?.replace(/^mailto:/i, "") ?? "").get().join(" ")}`);
      results.push({
        title,
        company: card.find(".base-search-card__subtitle, .companyName, .comp-name, .companyInfo a").first().text().trim() || "Company not listed",
        location: card.find(".job-search-card__location, .companyLocation, .loc, .locWdth").first().text().trim() || "Location not listed",
        url,
        source,
        description: card.find(".description, .job-description, [data-testid='jobDescriptionText']").text().trim() || undefined,
        ...(website ? { companyWebsite: website } : {}),
        ...(hrEmails.length ? { hrEmails } : {}),
      });
    });
    if (results.length) break;
  }
  return results;
}

async function scrapeSource(source: JobSource, title: string, location: string, freshness: JobFreshness): Promise<JobListing[]> {
  const host = sourceHosts[source];
  const url = new URL(`https://${host}/jobs/search`);
  if (source === "linkedin") {
    url.searchParams.set("keywords", title);
    if (location) url.searchParams.set("location", location);
  } else if (source === "indeed") {
    url.pathname = "/jobs";
    url.searchParams.set("q", title);
    if (location) url.searchParams.set("l", location);
  } else {
    url.pathname = "/jobs";
    url.searchParams.set("k", title);
    if (location) url.searchParams.set("l", location);
  }

  if (freshness !== "all") {
    const days = freshness === "2days" ? 2 : 7;
    if (source === "linkedin") url.searchParams.set("f_TPR", `r${days * 24 * 60 * 60}`);
    else if (source === "indeed") url.searchParams.set("fromage", String(days));
    else url.searchParams.set("jobAge", String(days));
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; ClockworkJobSearch/1.0; +https://example.com)",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${source} returned HTTP ${response.status}`);
  return extractListings(await response.text(), source, url.toString()).slice(0, 20);
}

export async function scrapeJobs(title: string, location: string, sources: JobSource[], freshness: JobFreshness) {
  const settled = await Promise.allSettled(sources.map(async (source) => ({ source, jobs: await scrapeSource(source, title, location, freshness) })));
  const jobs = settled.flatMap((result) => result.status === "fulfilled" ? result.value.jobs : []);
  const errors = settled.flatMap((result, index) => result.status === "rejected"
    ? [{ source: sources[index], message: result.reason instanceof Error ? result.reason.message : "Unable to load this job board" }]
    : []);
  const unique = new Map<string, JobListing>();
  for (const job of jobs) unique.set(job.url, job);
  return { jobs: [...unique.values()], errors };
}
