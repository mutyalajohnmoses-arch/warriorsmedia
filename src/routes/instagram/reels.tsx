import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clapperboard,
  Sparkles,
  Music,
  Scissors,
  Smartphone,
  Upload,
  Play,
  Zap,
  ChevronRight,
  ArrowLeft,
  Send,
  Calendar,
  Clock,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/reels")({
  head: () => ({
    meta: [
      { title: "Reels Studio — Instagram Creator Studio" },
      { name: "description", content: "Create and publish Instagram Reels" },
    ],
  }),
  component: InstagramReelsStudio,
});

function InstagramReelsStudio() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [music, setMusic] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/instagram" className="p-2 hover:bg-card rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Reels Studio</h1>
              <p className="text-xs text-muted-foreground">Create and publish Instagram Reels</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video rounded-xl border border-border bg-black/50 flex items-center justify-center">
              <Smartphone className="w-16 h-16 text-muted-foreground/30" />
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/40 space-y-6">
              <h3 className="font-bold text-lg">Reel Details</h3>
              
              <div>
                <label className="text-sm font-medium block mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Enter reel title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)]"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Caption</label>
                <textarea
                  placeholder="Write your caption..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)] resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Add Music
                </label>
                <select
                  value={music}
                  onChange={(e) => setMusic(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)]"
                >
                  <option value="">Select music...</option>
                  <option value="worship">Worship Music</option>
                  <option value="uplifting">Uplifting Beats</option>
                  <option value="ambient">Ambient</option>
                </select>
              </div>

              <div className="p-4 rounded-lg bg-[color:var(--gold)]/10 border border-[color:var(--gold)]/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[color:var(--gold)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-2">Creative Tools</p>
                    <p className="text-xs text-muted-foreground mb-2">Use AI to enhance your reel</p>
                    <button className="px-3 py-1 text-xs font-medium bg-[color:var(--gold)]/20 hover:bg-[color:var(--gold)]/30 rounded transition">
                      Generate Ideas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule
              </h3>
              <div>
                <label className="text-sm font-medium block mb-2">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)] text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)] text-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full px-4 py-3 rounded-lg bg-[color:var(--gold)] hover:bg-[color:var(--gold)]/90 text-background font-bold transition flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Publish Now
              </button>
              <button className="w-full px-4 py-3 rounded-lg border border-border hover:bg-card transition font-medium">
                Schedule Reel
              </button>
              <button className="w-full px-4 py-3 rounded-lg border border-border hover:bg-card transition font-medium">
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
