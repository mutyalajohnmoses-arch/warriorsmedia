import { createFileRoute } from "@tanstack/react-router";
import { Plus, Heart, Hand, Cross } from "lucide-react";

export const Route = createFileRoute("/app/prayer")({ component: PrayerPage });

function PrayerPage() {
  const requests = [
    { name: "Anitha M.", time: "12 min ago", text: "Please pray for my mother's surgery tomorrow morning at 7 AM.", prays: 142, urgent: true },
    { name: "Joel D.", time: "1 hr ago", text: "Job interview Monday — pray for favor and clarity 🙏", prays: 86 },
    { name: "Anonymous", time: "3 hrs ago", text: "Battling anxiety. Need God's peace.", prays: 312 },
    { name: "Esther R.", time: "Yesterday", text: "Praise report — restored relationship with my brother. Glory to God!", prays: 521 },
  ];
  return (
    <div className="pb-6">
      <header className="px-5 pt-5">
        <h1 className="text-3xl font-display">Prayer Wall</h1>
        <p className="text-sm text-muted-foreground mt-1">Lift each other up. Anonymous welcome.</p>
      </header>

      <div className="px-5 mt-5 grid grid-cols-3 gap-2 text-center">
        {[["1.2K","Today"],["18K","This week"],["2.4M","Total"]].map(([n,l]) => (
          <div key={l} className="p-3 rounded-xl bg-card border border-border">
            <div className="text-lg font-display text-gold-gradient">{n}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 px-5 mt-5 overflow-x-auto scrollbar-hide">
        {["All","Urgent","Healing","Family","Praise","Anonymous"].map((c,i) => (
          <button key={c} className={`shrink-0 px-4 py-1.5 rounded-full text-xs border ${i===0?"bg-gold-gradient text-[color:var(--primary-foreground)] border-transparent":"bg-card border-border text-muted-foreground"}`}>{c}</button>
        ))}
      </div>

      <div className="px-5 mt-5 space-y-3">
        {requests.map((r) => (
          <div key={r.name+r.time} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[color:var(--gold)] to-[color:var(--gold-deep)]" />
              <div className="flex-1">
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.time}</div>
              </div>
              {r.urgent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/40">URGENT</span>}
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{r.text}</p>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] font-medium">
                <Hand className="w-3 h-3" /> I prayed
              </button>
              <span className="text-muted-foreground">{r.prays} prayed</span>
              <Heart className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </div>
          </div>
        ))}
      </div>

      <button className="fixed bottom-32 right-4 z-30 w-14 h-14 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] flex items-center justify-center glow-gold">
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
