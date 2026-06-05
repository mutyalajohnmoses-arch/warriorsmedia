import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Radio,
  Upload,
  Clapperboard,
  History,
  MessageSquare,
  BarChart3,
  Sparkles,
  Settings,
  Inbox,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/instagram/")({
  head: () => ({
    meta: [
      { title: "Instagram Creator Studio — Warriors Media" },
      { name: "description", content: "Manage your Instagram content, analytics, and engagement" },
    ],
  }),
  component: InstagramDashboard,
});

const navigationCards = [
  {
    id: "live",
    icon: Radio,
    title: "Live Studio",
    description: "Go live with your audience in real-time",
    path: "/instagram/live",
    color: "from-red-500/20 to-red-600/20",
    iconColor: "text-red-500",
  },
  {
    id: "upload",
    icon: Upload,
    title: "Upload Center",
    description: "Upload and schedule feed posts",
    path: "/instagram/upload",
    color: "from-blue-500/20 to-blue-600/20",
    iconColor: "text-blue-500",
  },
  {
    id: "reels",
    icon: Clapperboard,
    title: "Reels Studio",
    description: "Create and publish Instagram Reels",
    path: "/instagram/reels",
    color: "from-purple-500/20 to-purple-600/20",
    iconColor: "text-purple-500",
  },
  {
    id: "stories",
    icon: History,
    title: "Story Publisher",
    description: "Create and schedule Stories",
    path: "/instagram/stories",
    color: "from-pink-500/20 to-pink-600/20",
    iconColor: "text-pink-500",
  },
  {
    id: "content",
    icon: MessageSquare,
    title: "Content Library",
    description: "Browse and manage all your content",
    path: "/instagram/content",
    color: "from-cyan-500/20 to-cyan-600/20",
    iconColor: "text-cyan-500",
  },
  {
    id: "inbox",
    icon: Inbox,
    title: "Inbox",
    description: "Manage direct messages and conversations",
    path: "/instagram/inbox",
    color: "from-green-500/20 to-green-600/20",
    iconColor: "text-green-500",
  },
  {
    id: "comments",
    icon: MessageCircle,
    title: "Comments Manager",
    description: "Moderate and respond to comments",
    path: "/instagram/comments",
    color: "from-orange-500/20 to-orange-600/20",
    iconColor: "text-orange-500",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics",
    description: "View detailed performance metrics",
    path: "/instagram/analytics",
    color: "from-indigo-500/20 to-indigo-600/20",
    iconColor: "text-indigo-500",
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "AI Assistant",
    description: "AI-powered content suggestions and optimization",
    path: "/instagram/ai",
    color: "from-yellow-500/20 to-yellow-600/20",
    iconColor: "text-yellow-500",
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings",
    description: "Configure account and preferences",
    path: "/instagram/settings",
    color: "from-gray-500/20 to-gray-600/20",
    iconColor: "text-gray-500",
  },
];

function InstagramDashboard() {
  const navigate = useNavigate();

  const handleCardClick = (path: string) => {
    navigate({ to: path });
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Instagram Creator Studio</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your Instagram presence, content, and analytics
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Quick Stats Section */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-bold mb-6">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition">
              <p className="text-sm text-muted-foreground mb-2">Total Followers</p>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground mt-2">Connect account to view</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition">
              <p className="text-sm text-muted-foreground mb-2">Total Posts</p>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground mt-2">Connect account to view</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition">
              <p className="text-sm text-muted-foreground mb-2">Engagement Rate</p>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground mt-2">Connect account to view</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition">
              <p className="text-sm text-muted-foreground mb-2">This Month</p>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground mt-2">Connect account to view</p>
            </div>
          </div>
        </section>

        {/* Navigation Cards Grid */}
        <section>
          <h2 className="font-display text-xl font-bold mb-6">Creator Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {navigationCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.path)}
                  className={`group p-6 rounded-xl border border-border bg-gradient-to-br ${card.color} hover:border-[color:var(--gold)]/50 transition-all duration-300 text-left`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-background/50 group-hover:bg-background/80 transition`}>
                      <Icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="font-bold text-base mb-2 group-hover:text-[color:var(--gold)] transition">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition">
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Info Section */}
        <section className="mt-12 p-6 rounded-xl border border-border bg-card/40">
          <h3 className="font-bold mb-2">Getting Started</h3>
          <p className="text-sm text-muted-foreground mb-4">
            To unlock all features, connect your Instagram account using the settings panel. Once connected, you'll be able to:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
              Go live and stream to your audience
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
              Upload and schedule posts automatically
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
              Create and publish Reels and Stories
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
              Monitor analytics and engagement metrics
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
              Manage comments and direct messages
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
