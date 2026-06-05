import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";

export const Route = createFileRoute("/instagram/stories")({
  component: InstagramStoryPublisher,
});

function InstagramStoryPublisher() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Story Publisher</h1>
          <p className="text-muted-foreground text-sm mt-1">Share daily updates and engage with your audience through stories.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Story Canvas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[9/16] max-w-sm mx-auto bg-black rounded-[2.5rem] border-[6px] border-card shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Plus className="w-8 h-8 text-pink-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Create New Story</h3>
                <p className="text-xs text-muted-foreground">Upload image or video (max 60s)</p>
              </div>
              <div className="flex gap-3">
                <button className="p-3 rounded-full bg-accent/50 hover:bg-pink-500/20 transition text-pink-500">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-full bg-accent/50 hover:bg-pink-500/20 transition text-pink-500">
                  <Video className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Top Progress Bar Simulation */}
            <div className="absolute top-6 left-6 right-6 flex gap-1">
              <div className="h-1 flex-1 bg-white/40 rounded-full" />
              <div className="h-1 flex-1 bg-white/20 rounded-full" />
              <div className="h-1 flex-1 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Story Tools */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-6">
            <h3 className="font-semibold text-sm">Story Elements</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Type, label: "Add Text" },
                { icon: LinkIcon, label: "Add Link" },
                { icon: Smile, label: "Stickers" },
                { icon: Calendar, label: "Countdown" },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <button key={tool.label} className="p-4 rounded-xl border border-border bg-background hover:border-pink-500/30 transition flex flex-col items-center gap-2 group">
                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-pink-500 transition" />
                    <span className="text-[10px] font-medium">{tool.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Schedule</label>
                <button className="w-full p-3 rounded-xl border border-border bg-background hover:bg-accent transition text-xs flex items-center justify-between">
                  <span className="text-muted-foreground">Select date & time</span>
                  <Calendar className="w-4 h-4 text-pink-500" />
                </button>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm transition shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2">
                Share to Story <Send className="w-4 h-4" />
              </button>
              <button className="w-full py-3 rounded-xl border border-border bg-card/40 hover:bg-accent transition text-sm font-medium">
                Add to Highlights
              </button>
            </div>
          </div>

          {/* Tips Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/20 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-pink-500">Creator Tip</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Stories with interactive stickers like Polls or Questions get 2x more engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
