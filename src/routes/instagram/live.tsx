import { createFileRoute } from "@tanstack/react-router";
import {
  Radio,
  Settings,
  Users,
  Heart,
  MessageCircle,
  Camera,
  Mic,
  Activity,
  Maximize2,
  MoreVertical,
  X,
  Send,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/live")({
  component: InstagramLiveStudio,
});

function InstagramLiveStudio() {
  const [isLive, setIsLive] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-border bg-card/20 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Radio className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h1 className="font-display text-xl tracking-tight">Live Studio</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              {isLive ? (
                <span className="text-pink-500 animate-pulse flex items-center gap-1">
                  <Activity className="w-3 h-3" /> LIVE NOW
                </span>
              ) : (
                "Ready to broadcast"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg border border-border hover:bg-accent transition">
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition shadow-lg ${
              isLive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20"
            }`}
          >
            {isLive ? "End Live" : "Start Live"}
          </button>
        </div>
      </header>

      {/* Studio Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Stream Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="aspect-video bg-black rounded-2xl relative overflow-hidden group shadow-2xl border border-border">
            {/* Preview Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {!isLive && (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto">
                    <Camera className="w-10 h-10 text-pink-500" />
                  </div>
                  <p className="text-muted-foreground text-sm">Camera Preview Inactive</p>
                </div>
              )}
            </div>

            {/* Top UI Overlay */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                {isLive && (
                  <div className="px-3 py-1 rounded bg-red-600 text-[10px] font-bold text-white flex items-center gap-1">
                    LIVE
                  </div>
                )}
                <div className="px-3 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                  00:00:00
                </div>
              </div>
              <div className="flex items-center gap-2 pointer-events-auto">
                <button className="p-2 rounded-lg bg-black/60 backdrop-blur-md hover:bg-black/80 text-white transition">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 pointer-events-auto">
                <button className="p-3 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white transition">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white transition">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stream Settings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-pink-500" /> RTMP Configuration
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Stream URL</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value="rtmps://live-api-s.instagram.com:443/rtmp/"
                      className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                    <button className="px-3 py-2 rounded-lg border border-border hover:bg-accent text-xs transition font-medium">Copy</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Stream Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      readOnly
                      value="••••••••••••••••"
                      className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                    <button className="px-3 py-2 rounded-lg border border-border hover:bg-accent text-xs transition font-medium">Copy</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Stream Health
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-emerald-500 font-bold">Excellent</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Bitrate</span>
                  <span className="font-medium">4,500 Kbps</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Resolution</span>
                  <span className="font-medium">1080p60</span>
                </div>
                <div className="w-full bg-accent/50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[85%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 border-l border-border bg-card/20 backdrop-blur-md flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Live Chat</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-accent/50 px-2 py-1 rounded">
                <Users className="w-3 h-3" /> 0
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Chat Messages would go here */}
            <div className="text-center py-10 space-y-2">
              <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground">No messages yet. Start your live to see chat.</p>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-card/40">
            <div className="flex gap-2">
              <input
                disabled={!isLive}
                placeholder={isLive ? "Type a message..." : "Go live to chat"}
                className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-pink-500/50 transition-colors disabled:opacity-50"
              />
              <button
                disabled={!isLive}
                className="p-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
