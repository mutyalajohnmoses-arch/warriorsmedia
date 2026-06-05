import { createFileRoute, Link } from "@tanstack/react-router";
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
  ArrowLeft,
  Power,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instagram/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Instagram Creator Studio" },
      { name: "description", content: "Configure account and preferences" },
    ],
  }),
  component: InstagramSettings,
});

function InstagramSettings() {
  const [notifications, setNotifications] = useState(true);
  const [autoPost, setAutoPost] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(true);

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/instagram" className="p-2 hover:bg-card rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Settings</h1>
              <p className="text-xs text-muted-foreground">Configure your preferences</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-2xl space-y-6">
          {/* Account Section */}
          <div className="p-6 rounded-xl border border-border bg-card/40 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Instagram Account</p>
                  <p className="text-sm text-muted-foreground">mutyala_john_moses</p>
                </div>
                <button className="px-4 py-2 rounded-lg border border-border hover:bg-card transition text-sm font-medium">
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-6 rounded-xl border border-border bg-card/40 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Comments</p>
                  <p className="text-sm text-muted-foreground">Get notified when someone comments</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`p-2 rounded-lg transition ${
                    notifications ? "bg-[color:var(--gold)]/20 text-[color:var(--gold)]" : "bg-background/50"
                  }`}
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Messages</p>
                  <p className="text-sm text-muted-foreground">Get notified for direct messages</p>
                </div>
                <button className="p-2 rounded-lg bg-[color:var(--gold)]/20 text-[color:var(--gold)] transition">
                  <Power className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="p-6 rounded-xl border border-border bg-card/40 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Features
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI Suggestions</p>
                  <p className="text-sm text-muted-foreground">Get AI-powered content recommendations</p>
                </div>
                <button
                  onClick={() => setAiSuggestions(!aiSuggestions)}
                  className={`p-2 rounded-lg transition ${
                    aiSuggestions ? "bg-[color:var(--gold)]/20 text-[color:var(--gold)]" : "bg-background/50"
                  }`}
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-Posting</p>
                  <p className="text-sm text-muted-foreground">Automatically post scheduled content</p>
                </div>
                <button
                  onClick={() => setAutoPost(!autoPost)}
                  className={`p-2 rounded-lg transition ${
                    autoPost ? "bg-[color:var(--gold)]/20 text-[color:var(--gold)]" : "bg-background/50"
                  }`}
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="p-6 rounded-xl border border-border bg-card/40 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-card transition flex items-center justify-between">
                <span className="font-medium">Change Password</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-card transition flex items-center justify-between">
                <span className="font-medium">Two-Factor Authentication</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-card transition flex items-center justify-between">
                <span className="font-medium">Connected Apps</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Help & Support */}
          <div className="p-6 rounded-xl border border-border bg-card/40 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Help & Support
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-card transition flex items-center justify-between">
                <span className="font-medium">Documentation</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-card transition flex items-center justify-between">
                <span className="font-medium">Contact Support</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-card transition flex items-center justify-between">
                <span className="font-medium">Report a Bug</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 space-y-4">
            <h3 className="font-bold text-lg text-red-500">Danger Zone</h3>
            <button className="w-full px-4 py-3 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition font-medium">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
