import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageCircle,
  Search,
  Filter,
  MoreVertical,
  Heart,
  Reply,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Flag,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/comments")({
  head: () => ({
    meta: [
      { title: "Comments Manager — Instagram Creator Studio" },
      { name: "description", content: "Moderate and respond to comments" },
    ],
  }),
  component: InstagramComments,
});

function InstagramComments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");

  const comments = [
    { id: 1, user: "Worship_Daily", text: "This touched my heart today. Thank you!", post: "Morning Worship Reel", time: "2m", likes: 12, approved: true },
    { id: 2, user: "Creative_Soul", text: "What camera did you use for this?", post: "BTS Video", time: "15m", likes: 3, approved: true },
    { id: 3, user: "Faith_Builder", text: "Amazing content!", post: "Prayer Session", time: "1h", likes: 8, approved: false },
  ];

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/instagram" className="p-2 hover:bg-card rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Comments Manager</h1>
              <p className="text-xs text-muted-foreground">Moderate and respond to comments</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-[color:var(--gold)]"
            />
          </div>
          <button className="px-4 py-2 rounded-lg border border-border hover:bg-card transition flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-bold text-sm">{comment.user}</p>
                    <span className="text-xs text-muted-foreground">{comment.time}</span>
                    {comment.approved && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{comment.text}</p>
                  <p className="text-xs text-muted-foreground">On: {comment.post}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-background rounded transition">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-background rounded transition">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background/50 text-sm focus:outline-none focus:border-[color:var(--gold)]"
                />
                <button className="px-4 py-2 rounded-lg bg-[color:var(--gold)]/20 hover:bg-[color:var(--gold)]/30 text-[color:var(--gold)] transition">
                  <Reply className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
