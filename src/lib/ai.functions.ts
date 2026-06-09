import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callGateway(body: Record<string, unknown>) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export const generateThumbnail = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({ prompt: z.string().min(3).max(500), title: z.string().max(200).optional() })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const fullPrompt = `Cinematic 16:9 YouTube thumbnail, 1280x720, premium black & gold, dramatic lighting, bold focal point, no watermark. ${data.title ? `Title: "${data.title}". ` : ""}Concept: ${data.prompt}`;
    const json = await callGateway({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: fullPrompt }],
      modalities: ["image", "text"],
    });
    const msg = json?.choices?.[0]?.message;
    const url: string | undefined = msg?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("No image returned from AI");
    return { imageDataUrl: url };
  });

export const generateHashtags = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ title: z.string().min(2).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const json = await callGateway({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            'You generate high-performing YouTube hashtags. Return ONLY a JSON object: {"hashtags": string[]}. 10-15 tags, lowercase, no spaces, no # prefix. Mix popular Christian worship tags (worship, jesus, gospel, bible, christianmusic, etc.), Telugu Christian tags (teluguchristiansongs, teluguworship, teluguchristian), and tags specific to the title. Think like a YouTube SEO expert mirroring trending search results.',
        },
        { role: "user", content: `Title: ${data.title}` },
      ],
      response_format: { type: "json_object" },
    });
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { hashtags?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }
    const tags = Array.isArray(parsed.hashtags)
      ? parsed.hashtags
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.replace(/^#/, "").trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 15)
      : [];
    return { hashtags: tags };
  });
