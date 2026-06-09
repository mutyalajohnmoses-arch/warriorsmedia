import { createFileRoute, Link } from "@tanstack/react-router";
import {
  History,
  Image as ImageIcon,
  Video,
  Type,
  Link as LinkIcon,
  Smile,
  Calendar,
  Send,
  Upload,
  Plus,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/stories")({
  head: () => ({
    meta: [
      { title: "Story Publisher — Instagram Creator Studio" },
      { name: "description", content: "Create and schedule Stories" },
    ],
  }),
  component: InstagramStoryPublisher,
});

function InstagramStoryPublisher() {
  const [storyText, setStoryText] = useState("");
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
              <h1 className="font-display text-2xl font-bold">Story Publisher</h1>
              <p className="text-xs text-muted-foreground">Create and schedule Stories</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-[9/16] rounded-xl border border-border bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            </div>

            <div className="p-6 rounded-xl border border-border bg-card/40 space-y-6">
              <h3 className="font-bold text-lg">Story Content</h3>

              <div className="space-y-3">
                <button className="w-full p-4 rounded-lg border border-dashed border-border hover:border-[color:var(--gold)] transition flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Image/Video
                </button>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Add Text
                </label>
                <textarea
                  placeholder="Add text to your story..."
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)] resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button className="p-3 rounded-lg border border-border hover:bg-card transition flex items-center justify-center gap-2">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg border border-border hover:bg-card transition flex items-center justify-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg border border-border hover:bg-card transition flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                </button>
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
                Publish Story
              </button>
              <button className="w-full px-4 py-3 rounded-lg border border-border hover:bg-card transition font-medium">
                Schedule Story
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
