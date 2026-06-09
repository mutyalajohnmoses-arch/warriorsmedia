import { createFileRoute, Link } from "@tanstack/react-router";
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
  ArrowLeft,
  Calendar,
  Clock,
  Send,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/upload")({
  head: () => ({
    meta: [
      { title: "Upload Center — Instagram Creator Studio" },
      { name: "description", content: "Upload and schedule feed posts" },
    ],
  }),
  component: InstagramVideoUpload,
});

function InstagramVideoUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith("image/") || files[i].type.startsWith("video/")) {
          setUploadedFiles((prev) => [...prev, files[i].name]);
        }
      }
    }
  };

  const handlePublish = () => {
    console.log("Publishing post...", { title, description, hashtags, uploadedFiles });
  };

  const handleSchedule = () => {
    console.log("Scheduling post...", {
      title,
      description,
      hashtags,
      uploadedFiles,
      scheduleDate,
      scheduleTime,
    });
  };

  const handleDraft = () => {
    console.log("Saving as draft...", { title, description, hashtags, uploadedFiles });
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/instagram" className="p-2 hover:bg-card rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Upload Center</h1>
              <p className="text-xs text-muted-foreground">Upload and schedule feed posts</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drag and Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-12 rounded-xl border-2 border-dashed transition ${
                dragActive
                  ? "border-[color:var(--gold)] bg-[color:var(--gold)]/5"
                  : "border-border bg-card/40 hover:border-[color:var(--gold)]/50"
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 rounded-lg bg-[color:var(--gold)]/10">
                  <Upload className="w-8 h-8 text-[color:var(--gold)]" />
                </div>
                <div className="text-center">
                  <p className="font-bold mb-1">Drag and drop your files here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <button className="px-6 py-2 rounded-lg bg-[color:var(--gold)]/20 hover:bg-[color:var(--gold)]/30 text-[color:var(--gold)] font-medium transition">
                  Browse Files
                </button>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <FileVideo className="w-5 h-5" />
                  Uploaded Files ({uploadedFiles.length})
                </h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <Video className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{file}</span>
                      </div>
                      <button
                        onClick={() =>
                          setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
                        }
                        className="p-1 hover:bg-card rounded transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post Details */}
            <div className="p-6 rounded-xl border border-border bg-card/40 space-y-6">
              <h3 className="font-bold text-lg">Post Details</h3>

              {/* Title */}
              <div>
                <label className="text-sm font-medium block mb-2">Post Title</label>
                <input
                  type="text"
                  placeholder="Enter post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium block mb-2">Caption</label>
                <textarea
                  placeholder="Write your caption here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {description.length} / 2200 characters
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <label className="text-sm font-medium block mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Hashtags
                </label>
                <input
                  type="text"
                  placeholder="#worship #christian #faith"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)]"
                />
                <p className="text-xs text-muted-foreground mt-2">Separate hashtags with spaces</p>
              </div>

              {/* AI Suggestions */}
              <div className="p-4 rounded-lg bg-[color:var(--gold)]/10 border border-[color:var(--gold)]/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[color:var(--gold)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-2">AI Suggestions</p>
                    <p className="text-xs text-muted-foreground">
                      Use AI to generate captions and hashtags based on your content
                    </p>
                    <button className="mt-2 px-3 py-1 text-xs font-medium bg-[color:var(--gold)]/20 hover:bg-[color:var(--gold)]/30 rounded transition">
                      Generate with AI
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Scheduling & Preview */}
          <div className="space-y-6">
            {/* Thumbnail Selection */}
            {uploadedFiles.length > 0 && (
              <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
                <h3 className="font-bold">Thumbnail</h3>
                <div className="aspect-square rounded-lg bg-black/50 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                </div>
                <button className="w-full px-4 py-2 rounded-lg border border-border hover:bg-card transition font-medium text-sm">
                  Change Thumbnail
                </button>
              </div>
            )}

            {/* Schedule Section */}
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

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePublish}
                disabled={uploadedFiles.length === 0}
                className="w-full px-4 py-3 rounded-lg bg-[color:var(--gold)] hover:bg-[color:var(--gold)]/90 text-background font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Publish Now
              </button>

              <button
                onClick={handleSchedule}
                disabled={uploadedFiles.length === 0 || !scheduleDate || !scheduleTime}
                className="w-full px-4 py-3 rounded-lg border border-border hover:bg-card transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Schedule Post
              </button>

              <button
                onClick={handleDraft}
                disabled={uploadedFiles.length === 0}
                className="w-full px-4 py-3 rounded-lg border border-border hover:bg-card transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save as Draft
              </button>
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl border border-border bg-card/40">
              <p className="text-xs font-medium mb-2">💡 Pro Tips</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Use vertical videos for better engagement</li>
                <li>• Post during peak hours (7-9 PM)</li>
                <li>• Include 20-30 relevant hashtags</li>
                <li>• Write engaging captions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
