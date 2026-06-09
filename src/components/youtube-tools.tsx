import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Youtube, Download, Copy, Check, Loader2, Info, Music } from "lucide-react";
import { getYouTubeMeta, getYouTubeStreams } from "@/lib/youtube.functions";

type MetaResult = Awaited<ReturnType<typeof getYouTubeMeta>>;
type StreamResult = Awaited<ReturnType<typeof getYouTubeStreams>>;

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border hover:border-[color:var(--gold)]/60 text-[11px] transition"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : (label ?? "Copy")}
    </button>
  );
}

function fmtDuration(secs: number | null | undefined) {
  if (!secs || secs <= 0) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export function YouTubeDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StreamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchStreams = useServerFn(getYouTubeStreams);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const r = await fetchStreams({ data: { url } });
      if (r.error) setError(r.error);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-5 rounded-2xl border border-[color:var(--gold)]/30 bg-card/60 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-600/20 border border-red-500/30">
          <Youtube className="w-5 h-5 text-red-500" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="font-display text-lg">YouTube Downloader</h3>
          <p className="text-xs text-muted-foreground">
            Paste a link · pick a resolution · save the file
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-background/60 border border-border focus:border-[color:var(--gold)]/60 outline-none text-sm"
          required
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold-gradient text-[color:var(--primary-foreground)] text-sm font-medium glow-gold disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {loading ? "Fetching" : "Fetch"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-xs text-red-400">{error}. Try again or use a different link.</p>
      )}

      {result && result.video.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            {result.thumbnail && (
              <img
                src={result.thumbnail}
                alt=""
                className="w-20 h-14 object-cover rounded-md border border-border"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{result.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {result.uploader}
                {result.duration ? ` · ${fmtDuration(result.duration)}` : ""}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--gold-soft)] mb-2">
              Video
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.video.map((v, i) => (
                <a
                  key={i}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border hover:border-[color:var(--gold)]/60 transition group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Download className="w-3.5 h-3.5 text-[color:var(--gold)] shrink-0" />
                    <span className="text-sm">{v.quality}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{v.ext}</span>
                    {v.videoOnly && (
                      <span className="text-[9px] uppercase tracking-wider text-indigo-300/80">
                        video-only
                      </span>
                    )}
                  </div>
                  {v.fps && <span className="text-[10px] text-muted-foreground">{v.fps}fps</span>}
                </a>
              ))}
            </div>
          </div>

          {result.audio.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--gold-soft)] mb-2">
                Audio only
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.audio.slice(0, 4).map((a, i) => (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border hover:border-[color:var(--gold)]/60 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-3.5 h-3.5 text-[color:var(--gold)]" />
                      <span className="text-sm">{a.quality || "audio"}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">{a.ext}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round((a.bitrate ?? 0) / 1000)}k
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            Right-click → "Save link as…" if the browser opens the file instead of downloading.
            Video-only streams have no audio (use a separate audio file). Only download content you
            own or are licensed to use.
          </p>
        </div>
      )}
    </section>
  );
}

export function YouTubeMetaExtractor() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MetaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchMeta = useServerFn(getYouTubeMeta);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const r = await fetchMeta({ data: { url } });
      if (r.error) setError(r.error);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const tagsString = result?.tags?.length
    ? result.tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")
    : "";

  return (
    <section className="p-5 rounded-2xl border border-[color:var(--gold)]/30 bg-card/60 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[color:var(--gold)]/15 border border-[color:var(--gold)]/40">
          <Info className="w-5 h-5 text-[color:var(--gold)]" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="font-display text-lg">YouTube Metadata</h3>
          <p className="text-xs text-muted-foreground">
            Title · description · tags — copy in one tap
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste any YouTube video link"
          className="flex-1 px-4 py-2.5 rounded-xl bg-background/60 border border-border focus:border-[color:var(--gold)]/60 outline-none text-sm"
          required
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold-gradient text-[color:var(--primary-foreground)] text-sm font-medium glow-gold disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Info className="w-4 h-4" />}
          {loading ? "Reading" : "Extract"}
        </button>
      </form>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      {result && (result.title || result.description) && (
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3">
            {result.thumbnail && (
              <img
                src={result.thumbnail}
                alt=""
                className="w-24 h-16 object-cover rounded-md border border-border shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{result.title}</p>
                {result.title && <CopyButton value={result.title} />}
              </div>
              {result.channel && (
                <p className="text-xs text-muted-foreground mt-1">{result.channel}</p>
              )}
            </div>
          </div>

          {result.description && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--gold-soft)]">
                  Description
                </p>
                <CopyButton value={result.description} />
              </div>
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-background/40 border border-border rounded-lg p-3 max-h-48 overflow-auto font-sans leading-relaxed">
                {result.description}
              </pre>
            </div>
          )}

          {result.tags && result.tags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--gold-soft)]">
                  Tags ({result.tags.length})
                </p>
                <div className="flex gap-1.5">
                  <CopyButton value={result.tags.join(", ")} label="Copy tags" />
                  <CopyButton value={tagsString} label="As #hashtags" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.tags.map((t, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-background/60 border border-border text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
