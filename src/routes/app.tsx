import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { Home, Radio, Music, Film, Heart, Users, Mic2, User, Shield } from "lucide-react";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Warriors Media — App" }] }),
  component: AppShell,
});

const tabs = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/reels", label: "Reels", icon: Film, exact: false },
  { to: "/app/live", label: "Live", icon: Radio, exact: false },
  { to: "/app/worship", label: "Worship", icon: Music, exact: false },
  { to: "/app/profile", label: "You", icon: User, exact: false },
];

const more = [
  { to: "/app/prayer", label: "Prayer", icon: Heart },
  { to: "/app/community", label: "Community", icon: Users },
  { to: "/app/studio", label: "Studio", icon: Mic2 },
  { to: "/app/admin", label: "Admin", icon: Shield },
];

function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* More row above tab bar */}
      <div className="fixed bottom-[68px] inset-x-0 z-40 px-3 pb-2 pointer-events-none">
        <div className="pointer-events-auto flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {more.map((m) => {
            const active = pathname === m.to;
            return (
              <Link
                key={m.to}
                to={m.to}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border backdrop-blur-md ${
                  active
                    ? "bg-gold-gradient text-[color:var(--primary-foreground)] border-transparent"
                    : "bg-background/70 border-border text-muted-foreground"
                }`}
              >
                <m.icon className="w-3.5 h-3.5" /> {m.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around h-[68px] px-2">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <t.icon
                  className={`w-5 h-5 transition ${active ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}
                  strokeWidth={active ? 2 : 1.4}
                />
                <span className={`text-[10px] uppercase tracking-wider ${active ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}>
                  {t.label}
                </span>
                {active && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[color:var(--gold)]" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
