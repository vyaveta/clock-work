import "server-only";

import * as cheerio from "cheerio";

const blockedHosts = [
  "duckduckgo.com", "google.com", "bing.com", "linkedin.com", "indeed.com", "naukri.com",
  "glassdoor.com", "facebook.com", "instagram.com", "youtube.com", "x.com", "twitter.com",
  "wikipedia.org", "crunchbase.com", "wellfound.com", "zoominfo.com", "rocketreach.co",
];

const careerPlatforms = [
  "greenhouse.io", "lever.co", "ashbyhq.com", "workable.com", "bamboohr.com",
  "smartrecruiters.com", "personio.com", "jobvite.com", "teamtailor.com", "applytojob.com",
];

const roleMailbox = /^(?:hr|humanresources|careers?|jobs?|recruit(?:ment|er|ing)?|talent(?:acquisition)?|people|hiring|join(?:us)?|workwithus)(?:[._+-]|$)/i;
const recruitingContext = /\b(?:human\s*resources?|\bhr\b|recruit(?:er|ment|ing)|talent(?:\s+acquisition|\s+team)?|hiring|people\s+(?:team|ops)|career(?:s)?|job\s+application|send\s+(?:your\s+)?(?:resume|cv)|apply\s+(?:here|to|for)|application\s+questions?)\b/i;
const emailPattern = /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;

function isBlockedHost(host: string, allowSearchEngine = false) {
  return blockedHosts.some((blocked) => {
    if (allowSearchEngine && ["duckduckgo.com", "bing.com"].includes(blocked)) return false;
    return host === blocked || host.endsWith(`.${blocked}`);
  });
}

function safePublicUrl(value: string, base?: string, allowSearchEngine = false, allowJobBoard = false): URL | undefined {
  try {
    const url = new URL(value, base);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!(url.protocol === "http:" || url.protocol === "https:") || url.username || url.password) return undefined;
    if (!host.includes(".") || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return undefined;
    const isJobBoard = ["linkedin.com", "indeed.com", "naukri.com"].some((board) => host === board || host.endsWith(`.${board}`));
    if (isBlockedHost(host, allowSearchEngine) && !(allowJobBoard && isJobBoard)) return undefined;
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":")) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

type HtmlPage = { url: URL; html: string };

async function fetchPublicHtml(value: string, allowSearchEngine = false, allowJobBoard = false): Promise<HtmlPage> {
  const initialUrl = safePublicUrl(value, undefined, allowSearchEngine, allowJobBoard);
  if (!initialUrl) throw new Error("The URL is not a supported public website");
  let current: URL = initialUrl;

  for (let redirectCount = 0; redirectCount <= 4; redirectCount += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; ClockworkPublicContactFinder/1.1)",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      const next = location ? safePublicUrl(location, current.toString(), allowSearchEngine, allowJobBoard) : undefined;
      if (!next) throw new Error("The website redirected to an unsupported address");
      current = next;
      continue;
    }
    if (!response.ok) throw new Error(`Website returned HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("The page did not return HTML");
    }
    return { url: current, html: (await response.text()).slice(0, 2_000_000) };
  }

  throw new Error("Website redirected too many times");
}

function decodeCloudflareEmail(encoded: string): string | undefined {
  if (!/^[a-f\d]+$/i.test(encoded) || encoded.length < 4 || encoded.length % 2 !== 0) return undefined;
  const bytes = encoded.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16));
  if (!bytes?.length) return undefined;
  const key = bytes[0];
  return bytes.slice(1).map((byte) => String.fromCharCode(byte ^ key)).join("");
}

function decodeObfuscatedEmails(value: string) {
  return value
    .replace(/&#x0*40;|&#0*64;|&commat;/gi, "@")
    .replace(/&#x0*2e;|&#0*46;|&period;/gi, ".")
    .replace(/\s*(?:\[at\]|\(at\)|\s+at\s+)\s*/gi, "@")
    .replace(/\s*(?:\[dot\]|\(dot\)|\s+dot\s+)\s*/gi, ".")
    .replace(/\s+\(at\)\s+/gi, "@");
}

function cleanEmail(value: string) {
  return value.toLowerCase().replace(/^[<([{]+|[>\])},;:.]+$/g, "");
}

function extractHrEmails(html: string): string[] {
  const $ = cheerio.load(html);
  const evidence: string[] = [];
  const visibleText = $("body").text().replace(/\s+/g, " ");
  evidence.push(visibleText);
  $("script[type='application/ld+json']").each((_, script) => {
    evidence.push($(script).text());
  });
  $("[itemprop='email'], meta[name*='email' i], meta[property*='email' i]").each((_, element) => {
    evidence.push($(element).attr("content") ?? $(element).text());
  });

  $("a[href^='mailto:']").each((_, anchor) => {
    let href = $(anchor).attr("href") ?? "";
    try { href = decodeURIComponent(href); } catch { /* Keep the original mailto value. */ }
    href = href.replace(/^mailto:/i, "").split(/[?;]/)[0];
    evidence.push(`${href} ${$(anchor).text()} ${$(anchor).parent().text()}`);
  });

  $("[data-cfemail]").each((_, element) => {
    const email = decodeCloudflareEmail($(element).attr("data-cfemail") ?? "");
    if (email) evidence.push(`${email} ${$(element).parent().text()}`);
  });

  const decoded = decodeObfuscatedEmails(evidence.join(" "));
  const emails = [...decoded.matchAll(emailPattern)];
  const accepted = emails.flatMap((match) => {
    const email = cleanEmail(match[0]);
    const localPart = email.split("@")[0] ?? "";
    const emailDomain = email.split("@")[1] ?? "";
    const start = Math.max(0, (match.index ?? 0) - 180);
    const end = Math.min(decoded.length, (match.index ?? 0) + email.length + 180);
    const context = decoded.slice(start, end);
    if (!localPart || !emailDomain || isBlockedHost(emailDomain) || /^(?:no-?reply|do-?not-?reply|example|test)$/i.test(localPart)) return [];
    if (!roleMailbox.test(localPart) && !recruitingContext.test(context)) return [];
    return [email];
  });

  return [...new Set(accepted)];
}

function isCareerPlatform(host: string) {
  return careerPlatforms.some((platform) => host === platform || host.endsWith(`.${platform}`));
}

function extractSiteCandidates(html: string, baseUrl: URL, company: string): string[] {
  const $ = cheerio.load(html);
  const companyWords = company.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  const candidates: Array<{ url: string; score: number }> = [];

  const addCandidate = (value: string | undefined, hint = "") => {
    if (!value) return;
    const target = safePublicUrl(value, baseUrl.toString());
    if (!target) return;
    const host = target.hostname.toLowerCase().replace(/^www\./, "");
    if (target.origin === baseUrl.origin) return;
    const text = `${host} ${hint}`.toLowerCase();
    const matches = companyWords.filter((word) => text.includes(word)).length;
    const score = matches * 3 + (/company|official|website|employer/i.test(hint) ? 2 : 0);
    const url = target.origin;
    const existing = candidates.find((candidate) => candidate.url === url);
    if (existing) existing.score = Math.max(existing.score, score);
    else candidates.push({ url, score });
  };

  $("script[type='application/ld+json']").each((_, script) => {
    try {
      const parsed = JSON.parse($(script).text()) as unknown;
      const visit = (value: unknown) => {
        if (Array.isArray(value)) return value.forEach(visit);
        if (!value || typeof value !== "object") return;
        const record = value as Record<string, unknown>;
        const org = (record.hiringOrganization ?? record.organization) as Record<string, unknown> | undefined;
        if (org) {
          addCandidate(typeof org.url === "string" ? org.url : undefined, typeof org.name === "string" ? org.name : "company");
          if (Array.isArray(org.sameAs)) org.sameAs.forEach((url) => addCandidate(typeof url === "string" ? url : undefined, "company"));
        }
        if (typeof record.url === "string" && /organization|company/i.test(String(record["@type"]))) addCandidate(record.url, "company official website");
        Object.values(record).forEach(visit);
      };
      visit(parsed);
    } catch {
      // Ignore malformed structured data and continue with public links.
    }
  });

  $("a[href]").each((_, anchor) => {
    const text = $(anchor).text().trim();
    const href = $(anchor).attr("href");
    if (/company|employer|official\s+site|website/i.test(text)) addCandidate(href, text);
  });

  return candidates.sort((a, b) => b.score - a.score).map((candidate) => candidate.url).slice(0, 5);
}

function getRecruitingPages(html: string, baseUrl: URL): string[] {
  const $ = cheerio.load(html);
  const pages: string[] = [];
  $("a[href]").each((_, anchor) => {
    const href = $(anchor).attr("href");
    if (!href) return;
    const target = safePublicUrl(href, baseUrl.toString());
    if (!target) return;
    const host = target.hostname.toLowerCase().replace(/^www\./, "");
    const hint = `${target.pathname} ${$(anchor).text()}`.toLowerCase();
    const relevantPath = /(contact|career|recruit|talent|people|about|team|join|work-with-us|jobs|human-resource|hr|apply)/.test(hint);
    if (!relevantPath || (target.origin !== baseUrl.origin && !isCareerPlatform(host))) return;
    target.hash = "";
    target.search = "";
    if (!pages.includes(target.toString())) pages.push(target.toString());
  });

  const commonPaths = ["/contact", "/contact-us", "/careers", "/jobs", "/about", "/team"];
  for (const path of commonPaths) {
    const candidate = new URL(path, baseUrl.origin).toString();
    if (!pages.includes(candidate)) pages.push(candidate);
  }
  return pages.slice(0, 8);
}

type SearchCandidate = { url: string; score: number };

async function searchCompanyWebsites(company: string, location: string): Promise<string[]> {
  const query = `"${company}" ${location} official company website`;
  const ddgUrl = new URL("https://html.duckduckgo.com/html/");
  ddgUrl.searchParams.set("q", query);
  const bingUrl = new URL("https://www.bing.com/search");
  bingUrl.searchParams.set("q", query);
  const searchResults = await Promise.allSettled([
    fetchPublicHtml(ddgUrl.toString(), true),
    fetchPublicHtml(bingUrl.toString(), true),
  ]);
  const companyWords = company.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  const candidates: SearchCandidate[] = [];

  for (const result of searchResults) {
    if (result.status !== "fulfilled") continue;
    const { url: searchUrl, html } = result.value;
    const $ = cheerio.load(html);
    const selectors = searchUrl.hostname.includes("duckduckgo")
      ? "a.result__a"
      : "li.b_algo h2 a";
    $(selectors).each((_, anchor) => {
      const href = $(anchor).attr("href");
      if (!href) return;
      let linked: URL;
      try { linked = new URL(href, searchUrl.toString()); } catch { return; }
      if (linked.hostname.endsWith("duckduckgo.com")) {
        const target = linked.searchParams.get("uddg");
        if (!target) return;
        try { linked = new URL(target); } catch { return; }
      }
      const safe = safePublicUrl(linked.toString());
      if (!safe) return;
      const host = safe.hostname.toLowerCase().replace(/^www\./, "");
      const resultText = `${host} ${$(anchor).text()} ${$(anchor).parent().text()}`.toLowerCase();
      const matches = companyWords.filter((word) => resultText.includes(word)).length;
      const score = matches * 3 + (/official|company|website/i.test(resultText) ? 2 : 0);
      const existing = candidates.find((candidate) => candidate.url === safe.origin);
      if (existing) existing.score = Math.max(existing.score, score);
      else candidates.push({ url: safe.origin, score });
    });
  }

  return candidates.sort((a, b) => b.score - a.score).map((candidate) => candidate.url).slice(0, 6);
}

async function searchIndexedHrEmails(company: string, website?: string) {
  const domain = website ? safePublicUrl(website)?.hostname.replace(/^www\./, "") : undefined;
  const queries = [`"${company}" (HR OR recruiter OR recruiting OR careers) email`];
  if (domain) queries.push(`site:${domain} (HR OR recruiter OR recruiting OR careers) (email OR contact)`);

  const searchUrls = queries.flatMap((query) => {
    const ddg = new URL("https://html.duckduckgo.com/html/");
    ddg.searchParams.set("q", query);
    const bing = new URL("https://www.bing.com/search");
    bing.searchParams.set("q", query);
    return [ddg.toString(), bing.toString()];
  });
  const pages = await Promise.allSettled(searchUrls.map((url) => fetchPublicHtml(url, true)));
  const companyWords = company.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  const hrEmails = new Set<string>();
  let pagesScanned = 0;

  for (const pageResult of pages) {
    if (pageResult.status !== "fulfilled") continue;
    pagesScanned += 1;
    const { url, html } = pageResult.value;
    const $ = cheerio.load(html);
    const resultSelector = url.hostname.includes("duckduckgo") ? ".result" : "li.b_algo";
    $(resultSelector).each((_, result) => {
      const resultHtml = $.html(result);
      const text = $(result).text().toLowerCase();
      const mentionsCompany = (domain && text.includes(domain)) || companyWords.some((word) => text.includes(word));
      if (!mentionsCompany) return;
      extractHrEmails(resultHtml).forEach((email) => hrEmails.add(email));
    });
  }

  return { hrEmails: [...hrEmails], pagesScanned };
}

export async function findCompanyHrEmails(input: {
  company: string;
  location: string;
  companyWebsite?: string;
  jobUrl?: string;
}) {
  const websites = new Set<string>();
  const foundEmails = new Set<string>();
  let pagesScanned = 0;
  const providedWebsite = safePublicUrl(input.companyWebsite ?? "");
  if (providedWebsite) websites.add(providedWebsite.origin);

  const jobPage = input.jobUrl ? safePublicUrl(input.jobUrl, undefined, false, true) : undefined;
  if (jobPage) {
    pagesScanned += 1;
    try {
      const page = await fetchPublicHtml(jobPage.toString(), false, true);
      extractSiteCandidates(page.html, page.url, input.company).forEach((website) => websites.add(website));
      extractHrEmails(page.html).forEach((email) => foundEmails.add(email));
    } catch {
      // Job-board pages frequently block automated requests; continue with the employer site.
    }
  }

  if (!websites.size) {
    try {
      (await searchCompanyWebsites(input.company, input.location)).forEach((website) => websites.add(website));
    } catch {
      // A blocked search engine should not prevent using the known company or job URL.
    }
  }

  let lastError: string | undefined;
  let finalWebsite: string | undefined;

  for (const website of [...websites].slice(0, 3)) {
    let homepage: HtmlPage;
    try {
      homepage = await fetchPublicHtml(website);
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Could not read the company website";
      continue;
    }

    finalWebsite = homepage.url.origin;
    pagesScanned += 1;
    extractHrEmails(homepage.html).forEach((email) => foundEmails.add(email));

    const pages = getRecruitingPages(homepage.html, homepage.url);
    const scanned = await Promise.all(pages.map(async (url) => {
      try { return await fetchPublicHtml(url); } catch { return undefined; }
    }));
    for (const page of scanned) {
      if (!page) continue;
      pagesScanned += 1;
      extractHrEmails(page.html).forEach((email) => foundEmails.add(email));
    }

    if (foundEmails.size) break;
  }

  // If the saved company URL is dead or blocks requests, try another official-site
  // result before recording a failed lookup. This also recovers stale job-board links.
  if (!finalWebsite && !foundEmails.size) {
    try {
      const alternatives = await searchCompanyWebsites(input.company, input.location);
      for (const website of alternatives) {
        if (websites.has(website)) continue;
        websites.add(website);
        try {
          const homepage = await fetchPublicHtml(website);
          finalWebsite = homepage.url.origin;
          pagesScanned += 1;
          extractHrEmails(homepage.html).forEach((email) => foundEmails.add(email));
          const pages = getRecruitingPages(homepage.html, homepage.url);
          const scanned = await Promise.all(pages.map(async (url) => {
            try { return await fetchPublicHtml(url); } catch { return undefined; }
          }));
          for (const page of scanned) {
            if (!page) continue;
            pagesScanned += 1;
            extractHrEmails(page.html).forEach((email) => foundEmails.add(email));
          }
          if (foundEmails.size || finalWebsite) break;
        } catch (error) {
          lastError = error instanceof Error ? error.message : "Could not read the company website";
        }
      }
    } catch {
      // Keep the original website error when search itself is unavailable.
    }
  }

  // Last-chance discovery layer: inspect free search-engine snippets for
  // publicly indexed recruiter addresses, including profiles and old postings.
  try {
    const indexed = await searchIndexedHrEmails(input.company, finalWebsite ?? providedWebsite?.origin);
    indexed.hrEmails.forEach((email) => foundEmails.add(email));
    pagesScanned += indexed.pagesScanned;
  } catch {
    // Search indexing is supplemental; retain emails found on the source pages.
  }

  if (!finalWebsite && !websites.size && !foundEmails.size) {
    return { companyWebsite: undefined, hrEmails: [], pagesScanned, error: "Could not locate the company website" };
  }

  return {
    companyWebsite: finalWebsite ?? [...websites][0],
    hrEmails: [...foundEmails],
    pagesScanned,
    error: foundEmails.size ? undefined : lastError,
  };
}
