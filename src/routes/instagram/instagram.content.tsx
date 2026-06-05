import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/content")({
  component: InstagramContentLibrary,
});

function InstagramContentLibrary() {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All Content" },
    { id: "published", label: "Published" },
    { id: "scheduled", label: "Scheduled" },
    { id: "drafts", label: "Drafts" },
    { id: "failed", label: "Failed" },
  ];

  const contentItems = [
    { id: 1, type: "Reel", title: "Sunday Service Highlights", status: "Published", date: "June 4, 2026", views: "12.4K" },
    { id: 2, type: "Video", title: "Founder's Vision 2026", status: "Scheduled", date: "June 6, 2026", views: "-" },
    { id: 3, type: "Story", title: "Daily Devotional", status: "Draft", date: "Not set", views: "-" },
    { id: 4, type: "Video", title: "Music Production BTS", status: "Failed", date: "June 3, 2026", views: "-" },
  ];

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Content Library</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and organize all your Instagram content in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search content..."
              className="bg-card/40 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-pink-500/50 transition-colors w-64"
            />
          </div>
          <button className="p-2 rounded-lg border border-border bg-card/40 hover:bg-accent transition">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-card/40 border border-border rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Table */}
      <div className="rounded-2xl border border-border bg-card/40 overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left">
          <thead className="bg-accent/30 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Content</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Views</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contentItems.map((item) => (
              <tr key={item.id} className="hover:bg-accent/20 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-accent/50 flex items-center justify-center">
                      {item.type === "Reel" && <Clapperboard className="w-4 h-4 text-pink-500" />}
                      {item.type === "Video" && <Video className="w-4 h-4 text-blue-500" />}
                      {item.type === "Story" && <History className="w-4 h-4 text-orange-500" />}
                    </div>
                    <span className="text-sm font-medium group-hover:text-pink-500 transition-colors">{item.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-muted-foreground">{item.type}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {item.status === "Published" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    {item.status === "Scheduled" && <Clock className="w-3 h-3 text-blue-500" />}
                    {item.status === "Draft" && <FileText className="w-3 h-3 text-muted-foreground" />}
                    {item.status === "Failed" && <AlertCircle className="w-3 h-3 text-red-500" />}
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      item.status === "Published" ? "text-emerald-500" :
                      item.status === "Scheduled" ? "text-blue-500" :
                      item.status === "Failed" ? "text-red-500" : "text-muted-foreground"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium">{item.views}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 rounded-lg hover:bg-accent transition text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
