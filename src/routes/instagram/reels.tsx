import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";

export const Route = createFileRoute("/instagram/reels")({
  component: InstagramReelsStudio,
});

function InstagramReelsStudio() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Reels Studio</h1>
          <p className="text-muted-foreground text-sm mt-1">Create viral short-form content with AI assistance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg border border-border bg-card/40 hover:bg-accent transition text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            AI Reel Generator
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Tools */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Creative Tools</h2>
          {[
            { icon: Scissors, label: "AI Video Trimmer", desc: "Auto-detect best moments" },
            { icon: Music, label: "Audio Sync", desc: "Sync video to beats" },
            { icon: Sparkles, label: "Smart Captions", desc: "Animated dynamic text" },
            { icon: Zap, label: "Viral Enhancer", desc: "Add trending effects" },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button key={tool.label} className="w-full p-4 rounded-xl border border-border bg-card/40 hover:border-pink-500/30 transition text-left group">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-lg bg-accent/50 group-hover:bg-pink-500/10 transition">
                    <Icon className="w-4 h-4 text-pink-500" />
                  </div>
                  <span className="text-sm font-semibold">{tool.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground ml-10">{tool.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Center - Preview */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[320px] aspect-[9/16] bg-black rounded-[3rem] border-[8px] border-card shadow-2xl relative overflow-hidden group">
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-card rounded-b-2xl z-20" />
            
            {/* Content Preview */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-pink-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Upload Vertical Video</h3>
                <p className="text-xs text-muted-foreground">9:16 aspect ratio recommended for Reels</p>
              </div>
            </div>

            {/* UI Overlay Simulation */}
            <div className="absolute bottom-10 left-4 right-12 space-y-2 pointer-events-none opacity-40">
              <div className="w-24 h-4 bg-white/20 rounded" />
              <div className="w-full h-3 bg-white/10 rounded" />
              <div className="w-2/3 h-3 bg-white/10 rounded" />
            </div>
            <div className="absolute bottom-10 right-2 flex flex-col gap-4 opacity-40">
              <div className="w-8 h-8 rounded-full bg-white/20" />
              <div className="w-8 h-8 rounded-full bg-white/20" />
              <div className="w-8 h-8 rounded-full bg-white/20" />
            </div>
          </div>
        </div>

        {/* Right Column - Publishing */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-6">
            <h3 className="font-semibold text-sm">Publishing Options</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Caption</label>
                  <button className="text-[10px] font-bold text-pink-500 flex items-center gap-1 hover:underline">
                    <Sparkles className="w-3 h-3" /> AI Suggest
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Write a viral caption..."
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500/50 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cover Image</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="aspect-[9/16] rounded-lg bg-accent/50 border border-border flex flex-col items-center justify-center gap-2 hover:bg-accent transition">
                    <Play className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">From Video</span>
                  </button>
                  <button className="aspect-[9/16] rounded-lg border border-border border-dashed flex flex-col items-center justify-center gap-2 hover:bg-accent transition">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Upload</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm transition shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2">
                Share Reel <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full py-3 rounded-xl border border-border bg-card/40 hover:bg-accent transition text-sm font-medium">
                Schedule Reel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
