import { createFileRoute } from "@tanstack/react-router";
import {
  MessageCircle,
  Search,
  Filter,
  MoreVertical,
  Heart,
  Reply,
  Trash2,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/instagram/comments")({
  component: InstagramComments,
});

function InstagramComments() {
  const comments = [
    { id: 1, user: "Worship_Daily", text: "This touched my heart today. Thank you!", post: "Morning Worship Reel", time: "2m", likes: 12 },
    { id: 2, user: "Creative_Soul", text: "What camera did you use for this?", post: "BTS Video", time: "15m", likes: 3 },
    { id: 3, user: "Grace_Notes", text: "Love the lighting in this shot! 🔥", post: "Morning Worship Reel", time: "1h", likes: 8 },
    { id: 4, user: "Faith_Walk", text: "Powerful message. Keep it up!", post: "Founder's Vision", time: "3h", likes: 24 },
  ];

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Comment Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Engage with your audience and moderate discussions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search comments..."
              className="bg-card/40 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-pink-500/50 transition-colors w-64"
            />
          </div>
          <button className="p-2 rounded-lg border border-border bg-card/40 hover:bg-accent transition">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-card/40 overflow-hidden backdrop-blur-sm">
        <div className="p-4 bg-accent/30 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-xs font-bold text-pink-500 uppercase tracking-widest border-b-2 border-pink-500 pb-1">All Comments</button>
            <button className="text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition pb-1">Unreplied</button>
            <button className="text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition pb-1">Mentioned</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bulk Actions:</span>
            <button className="p-1.5 rounded bg-accent/50 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded bg-accent/50 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-500 transition">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <div key={comment.id} className="p-6 hover:bg-accent/20 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0 border border-border">
                  <span className="text-xs font-bold text-muted-foreground">{comment.user[0]}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold group-hover:text-pink-500 transition-colors">{comment.user}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{comment.time} ago</span>
                      <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-accent/50 border border-border">on {comment.post}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg hover:bg-accent transition text-muted-foreground hover:text-pink-500">
                        <Heart className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-accent transition text-muted-foreground hover:text-blue-500">
                        <Reply className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-accent transition text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-500" /> {comment.likes} Likes</span>
                    <button className="hover:text-pink-500 transition">Reply</button>
                    <button className="hover:text-red-500 transition">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
