import { createFileRoute, Link } from "@tanstack/react-router";
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
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/instagram/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Instagram Creator Studio" },
      { name: "description", content: "View detailed performance metrics" },
    ],
  }),
  component: InstagramAnalytics,
});

function InstagramAnalytics() {
  const metrics = [
    { label: "Total Followers", value: "12,456", change: "+234", isPositive: true, icon: Users },
    { label: "Total Posts", value: "234", change: "+12", isPositive: true, icon: BarChart3 },
    { label: "Engagement Rate", value: "8.5%", change: "+1.2%", isPositive: true, icon: Heart },
    { label: "Profile Views", value: "45,678", change: "+5,432", isPositive: true, icon: Eye },
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
              <h1 className="font-display text-2xl font-bold">Analytics</h1>
              <p className="text-xs text-muted-foreground">View detailed performance metrics</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg border border-border hover:bg-card transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="p-6 rounded-xl border border-border bg-card/40">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-[color:var(--gold)]/10">
                    <Icon className="w-5 h-5 text-[color:var(--gold)]" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${metric.isPositive ? "text-green-500" : "text-red-500"}`}
                  >
                    {metric.isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {metric.change}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-border bg-card/40">
            <h3 className="font-bold text-lg mb-6">Top Posts</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                >
                  <div>
                    <p className="font-medium text-sm">Post #{i}</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{1234 * i}</p>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card/40">
            <h3 className="font-bold text-lg mb-6">Audience Insights</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Male</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="w-full bg-background/50 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "45%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Female</span>
                  <span className="text-sm font-medium">55%</span>
                </div>
                <div className="w-full bg-background/50 rounded-full h-2">
                  <div className="bg-pink-500 h-2 rounded-full" style={{ width: "55%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
