import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Filter,
  MoreVertical,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Video,
  Clapperboard,
  History,
  ArrowLeft,
  Trash2,
  Edit2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/content")({
  head: () => ({
    meta: [
      { title: "Content Library — Instagram Creator Studio" },
      { name: "description", content: "Browse and manage all your content" },
    ],
  }),
  component: InstagramContentLibrary,
});

function InstagramContentLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const contentItems = [
    {
      id: 1,
      title: "Morning Worship",
      type: "video",
      status: "published",
      date: "2 days ago",
      views: 1234,
    },
    {
      id: 2,
      title: "Praise & Worship",
      type: "reel",
      status: "scheduled",
      date: "Tomorrow",
      views: 0,
    },
    { id: 3, title: "Prayer Session", type: "story", status: "draft", date: "Today", views: 0 },
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
              <h1 className="font-display text-2xl font-bold">Content Library</h1>
              <p className="text-xs text-muted-foreground">Browse and manage all your content</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search content..."
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

          <div className="flex gap-2">
            {["all", "published", "scheduled", "draft"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg transition capitalize ${
                  filterStatus === status
                    ? "bg-[color:var(--gold)] text-background"
                    : "border border-border hover:bg-card"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {contentItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-lg bg-black/50 flex items-center justify-center">
                  {item.type === "video" && <Video className="w-6 h-6 text-muted-foreground/50" />}
                  {item.type === "reel" && (
                    <Clapperboard className="w-6 h-6 text-muted-foreground/50" />
                  )}
                  {item.type === "story" && (
                    <History className="w-6 h-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="capitalize">{item.type}</span>
                    <span>{item.date}</span>
                    {item.views > 0 && <span>{item.views} views</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    item.status === "published"
                      ? "bg-green-500/20 text-green-500"
                      : item.status === "scheduled"
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-gray-500/20 text-gray-500"
                  }`}
                >
                  {item.status}
                </span>
                <button className="p-2 hover:bg-background rounded transition">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-background rounded transition text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
