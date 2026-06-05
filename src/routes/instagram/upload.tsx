import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  Video,
  Image as ImageIcon,
  X,
  Plus,
  Sparkles,
  Hash,
  ChevronRight,
  FileVideo,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/upload")({
  component: InstagramVideoUpload,
});

function InstagramVideoUpload() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="font-display text-3xl tracking-tight">Video Upload Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Publish high-quality cinematic videos to your feed.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className={`aspect-video rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center space-y-4 p-12 text-center ${
              dragActive
                ? "border-pink-500 bg-pink-500/5"
                : "border-border bg-card/40 hover:border-pink-500/30 hover:bg-card/60"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
          >
            <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-pink-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Drag & drop video files</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                MP4, MOV, or AVI formats. Up to 4GB. Recommended 1080p for best quality.
              </p>
            </div>
            <button className="px-6 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold transition shadow-lg shadow-pink-500/20">
              Select File
            </button>
          </div>

          {/* Details Form */}
          <div className="p-8 rounded-2xl border border-border bg-card/40 space-y-6">
            <h2 className="font-display text-xl">Video Details</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title</label>
                <input
                  placeholder="Enter a compelling title"
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                  <button className="text-[10px] font-bold text-pink-500 flex items-center gap-1 hover:underline">
                    <Sparkles className="w-3 h-3" /> AI Generate
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="What's this video about?"
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Options */}
        <div className="space-y-6">
          {/* Thumbnail Selection */}
          <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-4">
            <h3 className="font-semibold text-sm">Thumbnail</h3>
            <div className="aspect-video rounded-xl bg-accent/50 border border-border border-dashed flex flex-col items-center justify-center space-y-2 text-center p-4 cursor-pointer hover:bg-accent/70 transition">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">Upload custom thumbnail</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-video rounded-lg bg-accent/30 border border-border" />
              <div className="aspect-video rounded-lg bg-accent/30 border border-border" />
              <div className="aspect-video rounded-lg bg-accent/30 border border-border" />
            </div>
          </div>

          {/* Hashtags */}
          <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Hashtags</h3>
              <button className="text-[10px] font-bold text-pink-500 flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> Add AI
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {["#warriorsmedia", "#worship", "#christian"].map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-accent/50 text-[10px] font-medium flex items-center gap-1 border border-border">
                  {tag} <X className="w-2 h-2 cursor-pointer" />
                </span>
              ))}
            </div>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                placeholder="Add hashtag..."
                className="w-full bg-background/50 border border-border rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-pink-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Publishing Options */}
          <div className="space-y-3">
            <button className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm transition shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2">
              Publish Now <ChevronRight className="w-4 h-4" />
            </button>
            <button className="w-full py-3 rounded-xl border border-border bg-card/40 hover:bg-accent transition text-sm font-medium">
              Schedule for Later
            </button>
            <button className="w-full py-3 rounded-xl text-muted-foreground hover:text-foreground transition text-xs font-medium">
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
