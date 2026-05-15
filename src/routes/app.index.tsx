import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Search, Play, Radio, Heart, Calendar, ChevronRight, Cross, Flame } from "lucide-react";
import heroImg from "@/assets/hero-worship.jpg";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="pb-4">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl px-5 pt-4 pb-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Cross className="w-5 h-5 text-[color:var(--gold)]" strokeWidth={1.5} />
          <span className="font-display text-lg">Warriors <span className="text-gold-gradient">Media</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <div className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[color:var(--gold)]" />
          </div>
        </div>
      </header>

      {/* Greeting */}
      <section className="px-5 pt-5">
        <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--gold)]">Saturday morning</p>
        <h1 className="text-3xl font-display mt-1 leading-tight">Shalom, <span className="text-gold-gradient italic">David</span></h1>
        <p className="text-sm text-muted-foreground mt-1">Daily verse · Psalm 27:1</p>
      </section>

      {/* Hero live card */}
      <section className="px-5 mt-5">
        <Link to="/app/live" className="block relative h-44 rounded-2xl overflow-hidden border border-border group">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/90 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <div className="text-xs text-[color:var(--gold-soft)] mb-1">Hyderabad Praise Night</div>
            <div className="text-lg font-display leading-tight">Yesayya · Worship Live</div>
            <div className="text-xs text-muted-foreground mt-1">2.4K watching now</div>
          </div>
        </Link>
      </section>

      {/* Quick actions */}
      <section className="px-5 mt-6">
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Radio, label: "Live", to: "/app/live" },
            { icon: Play, label: "Reels", to: "/app/reels" },
            { icon: Heart, label: "Prayer", to: "/app/prayer" },
            { icon: Calendar, label: "Events", to: "/app/community" },
          ].map((a) => (
            <Link key={a.label} to={a.to} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
                <a.icon className="w-5 h-5 text-[color:var(--gold)]" strokeWidth={1.4} />
              </div>
              <span className="text-[11px] text-muted-foreground">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending worship */}
      <section className="mt-7">
        <div className="px-5 flex items-center justify-between mb-3">
          <h2 className="text-lg font-display flex items-center gap-2"><Flame className="w-4 h-4 text-[color:var(--gold)]" /> Trending Worship</h2>
          <Link to="/app/worship" className="text-xs text-[color:var(--gold)] flex items-center">See all <ChevronRight className="w-3 h-3" /></Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {["Yesayya","Manchitanam","Aaradhana","Stuthi Patralu","Kreepa"].map((t,i) => (
            <div key={t} className="shrink-0 w-32">
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-[color:var(--gold-deep)]/40 to-card border border-border flex items-end p-2">
                <Play className="w-7 h-7 text-[color:var(--gold)]" strokeWidth={1.4} />
              </div>
              <div className="text-sm mt-2 font-medium truncate">{t}</div>
              <div className="text-[11px] text-muted-foreground">Telugu Worship · {i+2}M</div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming events */}
      <section className="px-5 mt-7">
        <h2 className="text-lg font-display mb-3">Upcoming</h2>
        <div className="space-y-3">
          {[
            ["NOV 22","Telugu Praise Conference","Vijayawada · 6 PM"],
            ["NOV 28","Youth Worship Night","Bangalore · 7 PM"],
          ].map(([d,t,loc]) => (
            <div key={t} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="text-center">
                <div className="text-[10px] tracking-widest text-[color:var(--gold)]">{d.split(" ")[0]}</div>
                <div className="text-2xl font-display">{d.split(" ")[1]}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t}</div>
                <div className="text-xs text-muted-foreground truncate">{loc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
