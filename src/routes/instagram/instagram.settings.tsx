import { createFileRoute } from "@tanstack/react-router";
import {
  Settings,
  User,
  Bell,
  Lock,
  Share2,
  Database,
  Shield,
  Palette,
  HelpCircle,
  ChevronRight,
  Instagram,
} from "lucide-react";

export const Route = createFileRoute("/instagram/settings")({
  component: InstagramSettings,
});

function InstagramSettings() {
  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile Information", desc: "Manage your creator profile and bio" },
        { icon: Instagram, label: "Linked Accounts", desc: "Connect Facebook and other platforms" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", desc: "Configure alerts for comments and DMs" },
        { icon: Palette, label: "Studio Theme", desc: "Customize your workspace appearance" },
        { icon: Share2, label: "Auto-Publishing", desc: "Set up cross-platform sharing" },
      ],
    },
    {
      title: "Security & Data",
      items: [
        { icon: Lock, label: "Privacy Settings", desc: "Manage account visibility and access" },
        { icon: Shield, label: "Security", desc: "Two-factor authentication and logins" },
        { icon: Database, label: "Data Management", desc: "Export analytics and content history" },
      ],
    },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="font-display text-3xl tracking-tight">Studio Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your Instagram Creator Studio preferences and account.</p>
      </header>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-pink-500 ml-2">{section.title}</h2>
            <div className="rounded-2xl border border-border bg-card/40 overflow-hidden divide-y divide-border">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} className="w-full p-4 flex items-center justify-between hover:bg-accent/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center group-hover:bg-pink-500/10 transition-colors">
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-semibold">{item.label}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="p-6 rounded-2xl border border-border bg-card/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <div className="text-left">
              <h3 className="text-sm font-semibold">Help & Support</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Documentation and creator resources</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition text-xs font-bold uppercase tracking-widest">
            Open Help Center
          </button>
        </div>
      </div>
    </div>
  );
}
