import { NextResponse } from "next/server";

export const revalidate = 86400;

type GeminiModel = {
  name?: string;
  displayName?: string;
  description?: string;
  thinking?: boolean;
  supportedGenerationMethods?: string[];
};

type GeminiModelPage = {
  models?: GeminiModel[];
  nextPageToken?: string;
};

// Google does not expose free-tier eligibility in the Models API response.
// Keep this allowlist aligned with Google's published Gemini API pricing page.
const freeTierModelIds = new Set([
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
]);

// The API catalog can still list this model even though Google rejects it for
// newly provisioned API users. Prefer the currently recommended stable model.
const unavailableForNewUsers = /^gemini-2\.5-flash(?:-\d{3})?$/;

export async function GET() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Generative AI is not configured" },
      { status: 503 },
    );
  }

  try {
    const listedModels: GeminiModel[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
      url.searchParams.set("key", apiKey);
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const response = await fetch(url, { next: { revalidate: 86400 } });
      if (!response.ok) {
        return NextResponse.json(
          { error: "Unable to load Gemini models" },
          { status: response.status === 401 || response.status === 403 ? 502 : response.status },
        );
      }

      const page = (await response.json()) as GeminiModelPage;
      listedModels.push(...(page.models ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);

    const models = listedModels
      .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
      .flatMap((model) => {
        const id = model.name?.replace(/^models\//, "");
        if (!id || unavailableForNewUsers.test(id)) return [];

        const searchText = `${id} ${model.displayName ?? ""} ${model.description ?? ""}`.toLowerCase();
        const badges = ["Text"];
        const freeTier = freeTierModelIds.has(id);
        if (freeTier) badges.push("Free");
        if (model.thinking) badges.push("Thinking");
        if (/\b(image generation|image-generation)\b/.test(searchText) || /(?:^|[-_])image(?:$|[-_])/.test(id)) {
          badges.push("Image generation");
        }
        if (/\b(code|coding|programming|software engineering)\b/.test(searchText)) {
          badges.push("Code");
        }

        return [{ id, displayName: model.displayName || id, description: model.description || "", badges, freeTier }];
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ error: "Unable to load Gemini models" }, { status: 502 });
  }
}
