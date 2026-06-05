import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  Send,
  Copy,
  RefreshCw,
  Hash,
  Type,
  Music,
  Clapperboard,
  History,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/ai")({
  component: InstagramAIAssistant,
});

function InstagramAIAssistant() {
  const [prompt, setPrompt] = useState("");

  const templates = [
    { icon: Zap, label: "Viral Caption", desc: "Generate high-engagement captions" },
    { icon: History, label: "Story Ideas", desc: "Daily engagement prompts" },
    { icon: Clapperboard, label: "Reel Script", desc: "Short-form video outlines" },
    { icon: Hash, label: "Hashtag Set", desc: "Trending niche hashtags" },
  ];

  return (
    <div className="p-8 h-full flex flex-col space-y-8">
      <header>
        <h1 className="font-display text-3xl tracking-tight">AI Content Assistant</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate viral content, captions, and ideas using Warriors AI.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
        {/* Left - Templates & Input */}
        <div className="lg:col-span-2 space-y-6 flex flex-col overflow-hidden">
          <div className="grid grid-cols-2 gap-4">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <button key={template.label} className="p-4 rounded-xl border border-border bg-card/40 hover:border-pink-500/30 transition text-left group">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition">
                      <Icon className="w-4 h-4 text-pink-500" />
                    </div>
                    <span className="text-sm font-semibold">{template.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-10">{template.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col rounded-2xl border border-border bg-card/40 overflow-hidden">
            <div className="p-4 border-b border-border bg-accent/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-bold uppercase tracking-widest">Assistant Chat</span>
              </div>
              <button className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition">
                <RefreshCw className="w-3 h-3" /> Clear Chat
              </button>
            </div>
            
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* AI Message */}
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-accent/50 border border-border space-y-3">
                  <p className="text-sm leading-relaxed">
                    Hello! I'm your Warriors AI assistant. I can help you generate captions, brainstorm reel ideas, or optimize your hashtags for the Christian creative niche.
                  </p>
                  <p className="text-sm leading-relaxed">
                    What would you like to create today?
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-accent/20 border-t border-border">
              <div className="relative">
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask AI to generate a caption for a worship reel..."
                  className="w-full bg-background/50 border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-pink-500/50 transition-colors resize-none"
                />
                <button className="absolute right-3 bottom-3 p-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition shadow-lg shadow-pink-500/20">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Suggestions & Presets */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-6">
            <h3 className="font-semibold text-sm">Christian Creator Presets</h3>
            <div className="space-y-3">
              {[
                "Worship Session Caption",
                "Sunday Service Highlight",
                "Daily Bible Verse Story",
                "Behind the Scenes - Music",
                "Testimony Reel Script",
              ].map((preset) => (
                <button key={preset} className="w-full p-3 rounded-lg border border-border bg-background hover:bg-accent hover:border-pink-500/30 transition text-left text-xs font-medium flex items-center justify-between group">
                  {preset}
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-pink-500 transition" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-blue-500">Music AI</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generate background tracks or song ideas that match your visual content's mood.
            </p>
            <button className="w-full py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-500 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600/30 transition">
              Open Music AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
