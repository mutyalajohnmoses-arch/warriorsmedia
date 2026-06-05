import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Eye,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export const Route = createFileRoute("/instagram/analytics")({
  component: InstagramAnalytics,
});

function InstagramAnalytics() {
  const metrics = [
    { label: "Reach", value: "124,842", trend: "+14.2%", positive: true },
    { label: "Engagement Rate", value: "4.82%", trend: "+0.4%", positive: true },
    { label: "Profile Visits", value: "2,104", trend: "-2.1%", positive: false },
    { label: "Follower Growth", value: "+842", trend: "+5.1%", positive: true },
  ];

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Deep insights into your content performance and audience growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg border border-border bg-card/40 hover:bg-accent transition text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="p-2 rounded-lg border border-border bg-card/40 hover:bg-accent transition">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{metric.label}</p>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                metric.positive ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
              }`}>
                {metric.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {metric.trend}
              </span>
            </div>
            <h3 className="text-3xl font-bold">{metric.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart Simulation */}
        <div className="lg:col-span-2 p-8 rounded-2xl border border-border bg-card/40 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl">Reach Overview</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Previous</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full flex items-end gap-2 pt-4">
            {[40, 60, 45, 90, 65, 80, 50, 75, 85, 40, 55, 70].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-1 group">
                <div className="w-full bg-pink-500/20 rounded-t group-hover:bg-pink-500/40 transition-colors" style={{ height: `${h}%` }} />
                <div className="w-full bg-pink-600 rounded-t group-hover:bg-pink-500 transition-colors" style={{ height: `${h-20}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-1">
            <span>May 1</span>
            <span>May 15</span>
            <span>May 30</span>
          </div>
        </div>

        {/* Top Content */}
        <div className="p-8 rounded-2xl border border-border bg-card/40 space-y-6">
          <h3 className="font-display text-xl">Top Content</h3>
          <div className="space-y-4">
            {[
              { title: "Morning Worship", type: "Reel", engagement: "12.4K" },
              { title: "BTS Production", type: "Video", engagement: "8.2K" },
              { title: "Sunday Highlights", type: "Reel", engagement: "6.1K" },
              { title: "Founder's Message", type: "Story", engagement: "4.2K" },
            ].map((content, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-accent/50 flex items-center justify-center text-pink-500">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold group-hover:text-pink-500 transition-colors">{content.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{content.type}</p>
                  </div>
                </div>
                <span className="text-sm font-bold">{content.engagement}</span>
              </div>
            ))}
          </div>
          <button className="w-full py-3 rounded-xl border border-border bg-background hover:bg-accent transition text-xs font-bold uppercase tracking-widest">
            Detailed Content Report
          </button>
        </div>
      </div>
    </div>
  );
}
