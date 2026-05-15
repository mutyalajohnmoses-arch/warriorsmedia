import { createFileRoute } from "@tanstack/react-router";
import { Settings, Edit3, Crown, Heart, Film, Music, Calendar, ChevronRight, LogOut } from "lucide-react";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });

function ProfilePage() {
  return (
    <div className="pb-6">
      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-br from-[color:var(--gold-deep)]/40 via-[color:var(--gold)]/20 to-card grain">
        <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/60 backdrop-blur flex items-center justify-center">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Avatar */}
      <div className="px-5 -mt-12">
        <div className="flex items-end gap-4">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[color:var(--gold)] to-[color:var(--gold-deep)] border-4 border-background flex items-center justify-center text-3xl font-display text-[color:var(--primary-foreground)]">D</div>
          <button className="ml-auto mb-2 px-4 py-1.5 rounded-full border border-border text-xs flex items-center gap-1.5">
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <h1 className="text-2xl font-display">David Anand</h1>
          <Crown className="w-4 h-4 text-[color:var(--gold)]" />
        </div>
        <p className="text-xs text-muted-foreground">@davidanand · Worship Leader · Bethel Telugu Church</p>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[["1.2K","Followers"],["348","Following"],["86","Reels"]].map(([n,l]) => (
            <div key={l} className="py-2 rounded-xl bg-card border border-border">
              <div className="text-base font-display text-gold-gradient">{n}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium */}
      <section className="px-5 mt-6">
        <div className="rounded-2xl border border-[color:var(--gold)]/40 bg-gradient-to-br from-[color:var(--gold)]/15 via-card to-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold-gradient flex items-center justify-center">
            <Crown className="w-5 h-5 text-[color:var(--primary-foreground)]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Warriors Premium</div>
            <div className="text-[11px] text-muted-foreground">Ad-free, HD live, exclusive sessions</div>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] font-medium">Upgrade</button>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-5 mt-6">
        <div className="flex border-b border-border text-sm">
          {["Reels","Liked","Saved"].map((t,i) => (
            <button key={t} className={`flex-1 pb-2 ${i===0?"text-[color:var(--gold)] border-b-2 border-[color:var(--gold)]":"text-muted-foreground"}`}>{t}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 mt-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] rounded-md bg-gradient-to-br from-[color:var(--gold-deep)]/30 via-secondary to-card border border-border" />
          ))}
        </div>
      </section>

      {/* Menu */}
      <section className="px-5 mt-6 space-y-1">
        {[[Music,"My Setlists"],[Heart,"Prayer requests"],[Film,"Studio bookings"],[Calendar,"My events"],[LogOut,"Sign out"]].map(([Ic,l]:any) => (
          <div key={l} className="flex items-center gap-3 p-3 rounded-xl hover:bg-card border border-transparent hover:border-border">
            <Ic className="w-4 h-4 text-[color:var(--gold)]" strokeWidth={1.4} />
            <span className="text-sm flex-1">{l}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}
      </section>
    </div>
  );
}
