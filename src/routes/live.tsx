import { createFileRoute, Link } from "@tanstack/react-router";
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
  ArrowLeft,
  Copy,
  Share2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/live")({
  head: () => ({
    meta: [
      { title: "Live Studio — Instagram Creator Studio" },
      { name: "description", content: "Go live with your audience in real-time" },
    ],
  }),
  component: InstagramLiveStudio,
});

function InstagramLiveStudio() {
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(1234);
  const [comments, setComments] = useState([
    { id: 1, user: "Worship_Daily", text: "This is amazing! 🙌", time: "2m ago" },
    { id: 2, user: "Creative_Soul", text: "Love this content", time: "1m ago" },
    { id: 3, user: "Faith_Builder", text: "Thank you for sharing", time: "30s ago" },
  ]);
  const [newComment, setNewComment] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const handleStartLive = () => {
    setIsLive(true);
  };

  const handleEndLive = () => {
    setIsLive(false);
  };

  const handleSendComment = () => {
    if (newComment.trim()) {
      setComments([
        ...comments,
        { id: comments.length + 1, user: "You", text: newComment, time: "now" },
      ]);
      setNewComment("");
    }
  };

  const rtmpUrl = "rtmps://live-api-s.instagram.com:443/rtmp/";
  const streamKey = "your_stream_key_here";

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/instagram"
              className="p-2 hover:bg-card rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Live Studio</h1>
              <p className="text-xs text-muted-foreground">Stream to your audience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-500">LIVE</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Area */}
            <div className="aspect-video rounded-xl border border-border bg-black/50 overflow-hidden flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 z-10" />
              <Camera className="w-16 h-16 text-muted-foreground/30" />
              {isLive && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/90">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-bold text-white">LIVE</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="flex gap-3">
                {!isLive ? (
                  <button
                    onClick={handleStartLive}
                    className="flex-1 px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition flex items-center justify-center gap-2"
                  >
                    <Radio className="w-5 h-5" />
                    Start Live Stream
                  </button>
                ) : (
                  <button
                    onClick={handleEndLive}
                    className="flex-1 px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-medium transition flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    End Live Stream
                  </button>
                )}
                <button className="px-6 py-3 rounded-lg border border-border hover:bg-card transition flex items-center justify-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>

              {/* Stream Settings */}
              <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
                <h3 className="font-bold">Stream Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Microphone</label>
                    <button
                      onClick={() => setMicEnabled(!micEnabled)}
                      className={`p-2 rounded-lg transition ${
                        micEnabled ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Camera</label>
                    <button
                      onClick={() => setCameraEnabled(!cameraEnabled)}
                      className={`p-2 rounded-lg transition ${
                        cameraEnabled ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* RTMP Configuration */}
              <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
                <h3 className="font-bold">RTMP Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                      RTMP URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={rtmpUrl}
                        readOnly
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background/50 text-sm font-mono"
                      />
                      <button className="px-3 py-2 rounded-lg border border-border hover:bg-card transition">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                      Stream Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={streamKey}
                        readOnly
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background/50 text-sm font-mono"
                      />
                      <button className="px-3 py-2 rounded-lg border border-border hover:bg-card transition">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stream Health */}
              <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Stream Health
                  </h3>
                  <span className="text-xs font-medium text-green-500">Excellent</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bitrate</span>
                    <span className="font-medium">4.5 Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frame Rate</span>
                    <span className="font-medium">60 FPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution</span>
                    <span className="font-medium">1920x1080</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Viewer Stats */}
            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Viewers
                </h3>
                <span className="text-2xl font-bold text-[color:var(--gold)]">{viewerCount}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peak Viewers</span>
                  <span className="font-medium">2,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">12m 34s</span>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Engagement
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Likes</span>
                  <span className="font-medium">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comments</span>
                  <span className="font-medium">{comments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shares</span>
                  <span className="font-medium">456</span>
                </div>
              </div>
            </div>

            {/* Live Comments */}
            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4 flex flex-col h-96">
              <h3 className="font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comments
              </h3>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{comment.user}</span>
                      <span className="text-xs text-muted-foreground">{comment.time}</span>
                    </div>
                    <p className="text-muted-foreground text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendComment()}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background/50 text-sm focus:outline-none focus:border-[color:var(--gold)]"
                />
                <button
                  onClick={handleSendComment}
                  className="p-2 rounded-lg bg-[color:var(--gold)]/20 hover:bg-[color:var(--gold)]/30 transition text-[color:var(--gold)]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
