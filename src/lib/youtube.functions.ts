import { createServerFn } from "@tanstack/react-start";

function extractVideoId(input: string): string | null {
  const s = input.trim();
  // Plain 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com") || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      // /shorts/ID, /embed/ID, /live/ID
      if (parts.length >= 2 && /^[a-zA-Z0-9_-]{11}$/.test(parts[1])) return parts[1];
    }
  } catch {
    // ignore
  }
  return null;
}

const validateUrl = (data: { url: string }) => {
  if (!data?.url || typeof data.url !== "string" || data.url.length > 500) {
    throw new Error("Invalid URL");
  }
  const id = extractVideoId(data.url);
  if (!id) throw new Error("Could not extract YouTube video ID");
  return { url: data.url, videoId: id };
};

export const getYouTubeMeta = createServerFn({ method: "GET" })
  .inputValidator(validateUrl)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(`https://www.youtube.com/watch?v=${data.videoId}&hl=en`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (!res.ok) return { error: `HTTP ${res.status}`, title: null, description: null, tags: [], thumbnail: null, channel: null };
      const html = await res.text();

      // Pull ytInitialPlayerResponse
      const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;(?:var|<\/script>)/s);
      let title: string | null = null;
      let description: string | null = null;
      let tags: string[] = [];
      let thumbnail: string | null = null;
      let channel: string | null = null;
      let duration: string | null = null;
      let viewCount: string | null = null;

      if (m) {
        try {
          const json = JSON.parse(m[1]);
          const vd = json?.videoDetails;
          if (vd) {
            title = vd.title ?? null;
            description = vd.shortDescription ?? null;
            tags = Array.isArray(vd.keywords) ? vd.keywords : [];
            channel = vd.author ?? null;
            duration = vd.lengthSeconds ?? null;
            viewCount = vd.viewCount ?? null;
            const thumbs = vd.thumbnail?.thumbnails;
            if (Array.isArray(thumbs) && thumbs.length) {
              thumbnail = thumbs[thumbs.length - 1].url ?? null;
            }
          }
        } catch {
          // fallthrough
        }
      }

      // Fallback to og: meta
      if (!title) {
        const t = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
        title = t?.[1] ?? null;
      }
      if (!description) {
        const d = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
        description = d?.[1] ?? null;
      }
      if (!thumbnail) {
        thumbnail = `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`;
      }

      return {
        videoId: data.videoId,
        title,
        description,
        tags,
        thumbnail,
        channel,
        duration,
        viewCount,
        error: null,
      };
    } catch (e) {
      return {
        videoId: data.videoId,
        title: null,
        description: null,
        tags: [],
        thumbnail: null,
        channel: null,
        duration: null,
        viewCount: null,
        error: e instanceof Error ? e.message : "Failed",
      };
    }
  });

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.r4fo.com",
  "https://pipedapi.leptons.xyz",
  "https://api.piped.private.coffee",
];

export const getYouTubeStreams = createServerFn({ method: "GET" })
  .inputValidator(validateUrl)
  .handler(async ({ data }) => {
    let lastErr = "";
    for (const base of PIPED_INSTANCES) {
      try {
        const res = await fetch(`${base}/streams/${data.videoId}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          lastErr = `HTTP ${res.status} from ${base}`;
          continue;
        }
        const json = (await res.json()) as {
          title?: string;
          uploader?: string;
          duration?: number;
          thumbnailUrl?: string;
          videoStreams?: Array<{
            url: string;
            quality: string;
            mimeType: string;
            format: string;
            videoOnly: boolean;
            fps?: number;
            codec?: string;
            bitrate?: number;
          }>;
          audioStreams?: Array<{
            url: string;
            quality: string;
            mimeType: string;
            format: string;
            bitrate: number;
            codec?: string;
          }>;
        };

        // Keep progressive (with audio) MP4/WebM streams first, then video-only
        const video = (json.videoStreams ?? []).map((v) => ({
          url: v.url,
          quality: v.quality,
          mime: v.mimeType,
          ext: v.format?.toLowerCase().includes("webm") ? "webm" : "mp4",
          videoOnly: v.videoOnly,
          fps: v.fps ?? null,
          bitrate: v.bitrate ?? null,
        }));

        // Deduplicate by quality+videoOnly, prefer mp4
        const seen = new Map<string, (typeof video)[number]>();
        for (const s of video) {
          const key = `${s.quality}-${s.videoOnly ? "vo" : "p"}-${s.ext}`;
          if (!seen.has(key)) seen.set(key, s);
        }
        const sorted = Array.from(seen.values()).sort((a, b) => {
          // progressive first
          if (a.videoOnly !== b.videoOnly) return a.videoOnly ? 1 : -1;
          const pa = parseInt(a.quality) || 0;
          const pb = parseInt(b.quality) || 0;
          return pb - pa;
        });

        const audio = (json.audioStreams ?? [])
          .map((a) => ({
            url: a.url,
            quality: a.quality,
            mime: a.mimeType,
            ext: a.format?.toLowerCase().includes("webm") ? "webm" : "m4a",
            bitrate: a.bitrate,
          }))
          .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

        return {
          videoId: data.videoId,
          title: json.title ?? null,
          uploader: json.uploader ?? null,
          duration: json.duration ?? null,
          thumbnail: json.thumbnailUrl ?? `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`,
          video: sorted,
          audio,
          source: base,
          error: null,
        };
      } catch (e) {
        lastErr = e instanceof Error ? e.message : "Failed";
      }
    }
    return {
      videoId: data.videoId,
      title: null,
      uploader: null,
      duration: null,
      thumbnail: `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`,
      video: [],
      audio: [],
      source: null,
      error: lastErr || "All providers failed",
    };
  });
