import { NextResponse } from "next/server";

export const revalidate = 300;

type GroqModel = {
  id?: string;
  active?: boolean;
  context_window?: number;
};

type GroqModelList = {
  data?: GroqModel[];
};

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Groq is not configured. Set GROQ_API_KEY on the server." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to load Groq models" },
        { status: response.status === 401 || response.status === 403 ? 502 : response.status },
      );
    }

    const result = (await response.json()) as GroqModelList;
    const models = (result.data ?? [])
      .filter((model) => model.id && model.active !== false)
      // Audio-only models use a different API and cannot run through this text node.
      .filter((model) => !/whisper|orpheus/i.test(model.id!))
      .map((model) => ({
        id: model.id!,
        displayName: model.id!,
        description: model.context_window
          ? `Context window: ${model.context_window.toLocaleString()} tokens`
          : "",
        badges: ["Text"],
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ error: "Unable to load Groq models" }, { status: 502 });
  }
}
