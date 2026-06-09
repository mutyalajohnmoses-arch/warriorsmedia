import { createServerFn } from "@tanstack/react-start";

function extractVideoId(input: string): string | null {
  const s = input.trim();
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

// Rotating set of public Invidious instances (CORS-allowed JSON API)
const INVIDIOUS_INSTANCES = [
  "https://invidious.nerdvpn.de",
  "https://inv.nadeko.net",
  "https://invidious.jing.rocks",
  "https://yewtu.be",
  "https://invidious.privacyredirect.com",
  "https://iv.melmac.space",
  "https://invidious.f5.si",
  "https://invidious.projectsegfau.lt",
  "https://invidious.tiekoetter.com",
  "https://inv.tux.pizza",
  "https://invidious.perennialte.ch",
  "https://invidious.lunar.icu",
  "https://inv.n8pjl.ca",
  "https://invidious.drgns.space",
];

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.r4fo.com",
  "https://pipedapi.leptons.xyz",
  "https://api.piped.private.coffee",
  "https://pipedapi.drgns.space",
  "https://pipedapi.reallyaweso.me",
  "https://pipedapi.astre.lt",
  "https://pipedapi.ducks.party",
  "https://pipedapi.mha.fi",
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

type MetaResult = {
  videoId: string;
  title: string | null;
  description: string | null;
  tags: string[];
  thumbnail: string | null;
  channel: string | null;
  duration: string | null;
  viewCount: string | null;
  source?: string | null;
  error: string | null;
};

async function scrapeYouTubeWatch(videoId: string): Promise<MetaResult | null> {
  const urls = [
    `https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US`,
    `https://m.youtube.com/watch?v=${videoId}&hl=en&gl=US`,
  ];
  const fallbackThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  ];

  for (const url of urls) {
    for (const agent of agents) {
      try {
        const res = await fetchWithTimeout(
          url,
          {
            headers: {
              "User-Agent": agent,
              "Accept-Language": "en-US,en;q=0.9",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
          },
          8000,
        );
        if (!res.ok) continue;
        const html = await res.text();
      
      // Try multiple markers and extraction methods
      const markers = ["ytInitialPlayerResponse", "ytInitialData"];
      let pr: any = null;
      let vd: any = null;
      
      for (const marker of markers) {
        const idx = html.indexOf(marker);
        if (idx < 0) continue;
        const eq = html.indexOf("{", idx);
        if (eq < 0) continue;
        
        let depth = 0;
        let end = -1;
        let inStr = false;
        let esc = false;
        for (let i = eq; i < html.length; i++) {
          const c = html[i];
          if (inStr) {
            if (esc) esc = false;
            else if (c === "\\") esc = true;
            else if (c === '"') inStr = false;
          } else {
            if (c === '"') inStr = true;
            else if (c === "{") depth++;
            else if (c === "}") {
              depth--;
              if (depth === 0) {
                end = i + 1;
                break;
              }
            }
          }
        }
        
        if (end > 0) {
          try {
            const parsed = JSON.parse(html.slice(eq, end));
            if (marker === "ytInitialPlayerResponse") {
              pr = parsed;
              vd = parsed.videoDetails;
            } else if (marker === "ytInitialData") {
              // Extract from ytInitialData if player response fails
              const contents = parsed.contents?.twoColumnWatchNextResults?.results?.results?.contents;
              const primary = contents?.find((c: any) => c.videoPrimaryInfoRenderer)?.videoPrimaryInfoRenderer;
              const secondary = contents?.find((c: any) => c.videoSecondaryInfoRenderer)?.videoSecondaryInfoRenderer;
              
              if (primary || secondary) {
                return {
                  videoId,
                  title: primary?.title?.runs?.[0]?.text || null,
                  description: secondary?.description?.runs?.map((r: any) => r.text).join("") || null,
                  tags: primary?.tags?.map((t: any) => t.metadataBadgeRenderer?.label).filter(Boolean) || [],
                  thumbnail: fallbackThumb,
                  channel: secondary?.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text || null,
                  duration: null,
                  viewCount: primary?.viewCount?.videoViewCountRenderer?.viewCount?.simpleText || null,
                  source: "youtube-data",
                  error: null,
                };
              }
            }
          } catch {
            continue;
          }
        }
      }

      if (vd?.title) {
        const thumbs = vd.thumbnail?.thumbnails ?? [];
        const thumb =
          thumbs.sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0]?.url || fallbackThumb;
        return {
          videoId,
          title: vd.title ?? null,
          description: vd.shortDescription ?? null,
          tags: Array.isArray(vd.keywords) ? vd.keywords : [],
          thumbnail: thumb,
          channel: vd.author ?? null,
          duration: vd.lengthSeconds ?? null,
          viewCount: vd.viewCount ?? null,
          source: "youtube",
          error: null,
        };
      }
      
      // Fallback to meta tags and regex if JSON extraction fails or is incomplete
      const titleMatch = html.match(/<meta name="title" content="(.*?)">/) || html.match(/<title>(.*?)<\/title>/);
      const descMatch = html.match(/<meta name="description" content="(.*?)">/);
      const keywordsMatch = html.match(/<meta name="keywords" content="(.*?)">/);
      
      // Filter out generic YouTube descriptions
      let description = descMatch ? descMatch[1] : null;
      if (description?.includes("Enjoy the videos and music that you love")) {
        description = null;
      }
      
      // Try to find description in ld+json if meta is generic
      if (!description) {
        const ldJsonMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
        if (ldJsonMatch) {
          try {
            const ld = JSON.parse(ldJsonMatch[1]);
            description = ld.description || null;
          } catch { /* ignore */ }
        }
      }

      if (titleMatch || description || keywordsMatch) {
        return {
          videoId,
          title: titleMatch ? titleMatch[1].replace(" - YouTube", "") : null,
          description: description,
          tags: keywordsMatch ? keywordsMatch[1].split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          thumbnail: fallbackThumb,
          channel: null,
          duration: null,
          viewCount: null,
          source: "youtube-scrape",
          error: null,
        };
      }
      } catch {
        // try next agent
      }
    }
  }
  return null;
}

export const getYouTubeMeta = createServerFn({ method: "GET" })
  .inputValidator(validateUrl)
  .handler(async ({ data }): Promise<MetaResult> => {
    const fallbackThumb = `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`;

    // 0) Direct YouTube watch-page scrape (most reliable for description + tags)
    const direct = await scrapeYouTubeWatch(data.videoId);
    if (direct) return direct;

    // 1) Try Invidious instances (JSON, no rate-limit on YouTube)
    for (const base of shuffle(INVIDIOUS_INSTANCES)) {
      try {
        const res = await fetchWithTimeout(
          `${base}/api/v1/videos/${data.videoId}?fields=title,description,keywords,author,lengthSeconds,viewCount,videoThumbnails`,
          { headers: { Accept: "application/json" } },
          6000,
        );
        if (!res.ok) continue;
        const j = (await res.json()) as {
          title?: string;
          description?: string;
          keywords?: string[];
          author?: string;
          lengthSeconds?: number;
          viewCount?: number;
          videoThumbnails?: Array<{ url: string; width: number }>;
        };
        if (!j?.title) continue;
        const thumb =
          (j.videoThumbnails || []).sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || fallbackThumb;
        return {
          videoId: data.videoId,
          title: j.title ?? null,
          description: j.description ?? null,
          tags: Array.isArray(j.keywords) ? j.keywords : [],
          thumbnail: thumb,
          channel: j.author ?? null,
          duration: j.lengthSeconds != null ? String(j.lengthSeconds) : null,
          viewCount: j.viewCount != null ? String(j.viewCount) : null,
          source: base,
          error: null,
        };
      } catch {
        // try next
      }
    }

    // 2) Try Piped as backup
    for (const base of shuffle(PIPED_INSTANCES)) {
      try {
        const res = await fetchWithTimeout(`${base}/streams/${data.videoId}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) continue;
        const j = (await res.json()) as {
          title?: string;
          description?: string;
          uploader?: string;
          duration?: number;
          views?: number;
          thumbnailUrl?: string;
          tags?: string[];
        };
        if (!j?.title) continue;
        return {
          videoId: data.videoId,
          title: j.title ?? null,
          description: j.description?.replace(/<[^>]+>/g, "") ?? null,
          tags: Array.isArray(j.tags) ? j.tags : [],
          thumbnail: j.thumbnailUrl || fallbackThumb,
          channel: j.uploader ?? null,
          duration: j.duration != null ? String(j.duration) : null,
          viewCount: j.views != null ? String(j.views) : null,
          source: base,
          error: null,
        };
      } catch {
        // continue
      }
    }

    // 3) Try NoEmbed (reliable title/author)
    try {
      const res = await fetchWithTimeout(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${data.videoId}`);
      if (res.ok) {
        const j = await res.json();
        if (j.title) {
          return {
            videoId: data.videoId,
            title: j.title ?? null,
            description: null,
            tags: [],
            thumbnail: j.thumbnail_url || fallbackThumb,
            channel: j.author_name ?? null,
            duration: null,
            viewCount: null,
            source: "noembed",
            error: "Description/tags unavailable (providers busy). Title only.",
          };
        }
      }
    } catch { /* ignore */ }

    // 4) Try Return YouTube Dislike API (often has metadata too)
    try {
      const res = await fetchWithTimeout(`https://returnyoutubedislikeapi.com/votes?videoId=${data.videoId}`);
      if (res.ok) {
        const j = await res.json();
        if (j.title) {
          return {
            videoId: data.videoId,
            title: j.title ?? null,
            description: null,
            tags: [],
            thumbnail: fallbackThumb,
            channel: j.author ?? null,
            duration: null,
            viewCount: j.viewCount ? String(j.viewCount) : null,
            source: "ryd",
            error: "Description/tags unavailable. Title only.",
          };
        }
      }
    } catch { /* ignore */ }

    // 5) Last-ditch oEmbed
    try {
      const res = await fetchWithTimeout(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${data.videoId}&format=json`,
      );
      if (res.ok) {
        const j = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
        return {
          videoId: data.videoId,
          title: j.title ?? null,
          description: null,
          tags: [],
          thumbnail: j.thumbnail_url || fallbackThumb,
          channel: j.author_name ?? null,
          duration: null,
          viewCount: null,
          source: "oembed",
          error: "Description/tags unavailable (providers busy). Title only.",
        };
      }
    } catch {
      // ignore
    }

    return {
      videoId: data.videoId,
      title: null,
      description: null,
      tags: [],
      thumbnail: fallbackThumb,
      channel: null,
      duration: null,
      viewCount: null,
      source: null,
      error: "All metadata providers are busy. Please try again in a moment.",
    };
  });

type StreamItem = {
  url: string;
  quality: string;
  mime: string;
  ext: string;
  videoOnly: boolean;
  fps: number | null;
  bitrate: number | null;
};
type AudioItem = { url: string; quality: string; mime: string; ext: string; bitrate: number };

export const getYouTubeStreams = createServerFn({ method: "GET" })
  .inputValidator(validateUrl)
  .handler(async ({ data }) => {
    const fallbackThumb = `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`;
    let lastErr = "";

    // Try Piped first (gives direct stream URLs)
    for (const base of shuffle(PIPED_INSTANCES)) {
      try {
        const res = await fetchWithTimeout(`${base}/streams/${data.videoId}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          lastErr = `HTTP ${res.status}`;
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
            bitrate?: number;
          }>;
          audioStreams?: Array<{
            url: string;
            quality: string;
            mimeType: string;
            format: string;
            bitrate: number;
          }>;
        };

        const video: StreamItem[] = (json.videoStreams ?? []).map((v) => ({
          url: v.url,
          quality: v.quality,
          mime: v.mimeType,
          ext: v.format?.toLowerCase().includes("webm") ? "webm" : "mp4",
          videoOnly: v.videoOnly,
          fps: v.fps ?? null,
          bitrate: v.bitrate ?? null,
        }));
        const seen = new Map<string, StreamItem>();
        for (const s of video) {
          const key = `${s.quality}-${s.videoOnly ? "vo" : "p"}-${s.ext}`;
          if (!seen.has(key)) seen.set(key, s);
        }
        const sorted = Array.from(seen.values()).sort((a, b) => {
          if (a.videoOnly !== b.videoOnly) return a.videoOnly ? 1 : -1;
          return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0);
        });

        const audio: AudioItem[] = (json.audioStreams ?? [])
          .map((a) => ({
            url: a.url,
            quality: a.quality,
            mime: a.mimeType,
            ext: a.format?.toLowerCase().includes("webm") ? "webm" : "m4a",
            bitrate: a.bitrate,
          }))
          .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

        if (sorted.length === 0 && audio.length === 0) {
          lastErr = "No streams returned";
          continue;
        }

        return {
          videoId: data.videoId,
          title: json.title ?? null,
          uploader: json.uploader ?? null,
          duration: json.duration ?? null,
          thumbnail: json.thumbnailUrl ?? fallbackThumb,
          video: sorted,
          audio,
          source: base,
          error: null,
        };
      } catch (e) {
        lastErr = e instanceof Error ? e.message : "Failed";
      }
    }

    // Fallback: Invidious /api/v1/videos with formatStreams + adaptiveFormats
    for (const base of shuffle(INVIDIOUS_INSTANCES)) {
      try {
        const res = await fetchWithTimeout(`${base}/api/v1/videos/${data.videoId}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          lastErr = `HTTP ${res.status} from ${base}`;
          continue;
        }
        const j = (await res.json()) as {
          title?: string;
          author?: string;
          lengthSeconds?: number;
          videoThumbnails?: Array<{ url: string; width: number }>;
          formatStreams?: Array<{ url: string; qualityLabel?: string; container?: string; fps?: number; bitrate?: string }>;
          adaptiveFormats?: Array<{
            url: string;
            qualityLabel?: string;
            container?: string;
            fps?: number;
            bitrate?: string;
            type?: string;
            audioQuality?: string;
          }>;
        };

        const video: StreamItem[] = [];
        for (const s of j.formatStreams ?? []) {
          video.push({
            url: s.url,
            quality: s.qualityLabel || "video",
            mime: s.container || "video/mp4",
            ext: (s.container || "mp4").toLowerCase().includes("webm") ? "webm" : "mp4",
            videoOnly: false,
            fps: s.fps ?? null,
            bitrate: s.bitrate ? parseInt(s.bitrate) : null,
          });
        }
        for (const s of j.adaptiveFormats ?? []) {
          if (!s.type?.startsWith("video/")) continue;
          video.push({
            url: s.url,
            quality: s.qualityLabel || "video",
            mime: s.type,
            ext: s.type.includes("webm") ? "webm" : "mp4",
            videoOnly: true,
            fps: s.fps ?? null,
            bitrate: s.bitrate ? parseInt(s.bitrate) : null,
          });
        }
        const audio: AudioItem[] = (j.adaptiveFormats ?? [])
          .filter((s) => s.type?.startsWith("audio/"))
          .map((s) => ({
            url: s.url,
            quality: s.audioQuality?.replace("AUDIO_QUALITY_", "").toLowerCase() || "audio",
            mime: s.type!,
            ext: s.type!.includes("webm") ? "webm" : "m4a",
            bitrate: s.bitrate ? parseInt(s.bitrate) : 0,
          }))
          .sort((a, b) => b.bitrate - a.bitrate);

        if (video.length === 0 && audio.length === 0) {
          lastErr = "No streams returned";
          continue;
        }

        const seen = new Map<string, StreamItem>();
        for (const s of video) {
          const key = `${s.quality}-${s.videoOnly ? "vo" : "p"}-${s.ext}`;
          if (!seen.has(key)) seen.set(key, s);
        }
        const sorted = Array.from(seen.values()).sort((a, b) => {
          if (a.videoOnly !== b.videoOnly) return a.videoOnly ? 1 : -1;
          return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0);
        });

        const thumb =
          (j.videoThumbnails || []).sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || fallbackThumb;

        return {
          videoId: data.videoId,
          title: j.title ?? null,
          uploader: j.author ?? null,
          duration: j.lengthSeconds ?? null,
          thumbnail: thumb,
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
      thumbnail: fallbackThumb,
      video: [] as StreamItem[],
      audio: [] as AudioItem[],
      source: null,
      error: lastErr
        ? `Providers busy (${lastErr}). Please try again in a moment.`
        : "All providers are busy. Please try again in a moment.",
    };
  });
