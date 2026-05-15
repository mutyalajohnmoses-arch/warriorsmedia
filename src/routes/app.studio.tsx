import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Star, Mic2, Camera, Radio, ChevronRight, Calendar } from "lucide-react";

export const Route = createFileRoute("/app/studio")({ component: StudioPage });

function StudioPage() {
  const studios = [
    { name: "Glory Sound Studio", city: "Hyderabad", price: "₹1,200/hr", rating: 4.9, type: "Recording", verified: true },
    { name: "Eternal Frames", city: "Vijayawada", price: "₹2,500/hr", rating: 4.8, type: "Video" },
    { name: "Anointed Live Hub", city: "Bangalore", price: "₹3,800/hr", rating: 4.7, type: "Livestream", verified: true },
    { name: "Sharon Records", city: "Chennai", price: "₹900/hr", rating: 4.6, type: "Recording" },
  ];
  return (
    <div className="pb-6">
      <header className="px-5 pt-5">
        <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--gold)]">Marketplace</div>
        <h1 className="text-3xl font-display mt-1">Studio Booking</h1>
        <p className="text-sm text-muted-foreground mt-1">Verified Christian studios across India</p>
      </header>

      {/* Categories */}
      <div className="grid grid-cols-3 gap-3 px-5 mt-5">
        {[[Mic2,"Recording"],[Camera,"Video"],[Radio,"Livestream"]].map(([Ic,l]:any,i) => (
          <button key={l} className={`p-3 rounded-xl border ${i===0?"border-[color:var(--gold)]/50 bg-[color:var(--gold)]/5":"border-border bg-card"} flex flex-col items-center gap-2`}>
            <Ic className="w-4 h-4 text-[color:var(--gold)]" strokeWidth={1.4} />
            <span className="text-[11px]">{l}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto px-5 mt-5 pb-1 scrollbar-hide">
        {["Near me","Top rated","Under ₹1K","Verified","Available today"].map((c) => (
          <button key={c} className="shrink-0 px-3 py-1.5 rounded-full text-[11px] border border-border bg-card text-muted-foreground">{c}</button>
        ))}
      </div>

      {/* Featured */}
      <section className="px-5 mt-6">
        <div className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-[color:var(--gold-deep)]/30 to-card p-5">
          <span className="text-[10px] uppercase tracking-widest text-[color:var(--gold)]">Featured</span>
          <h2 className="text-xl font-display mt-1">Glory Sound Studio</h2>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" /> Madhapur, Hyderabad</div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-xl font-display text-gold-gradient">₹1,200<span className="text-xs text-muted-foreground">/hr</span></div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Star className="w-3 h-3 fill-[color:var(--gold)] text-[color:var(--gold)]" /> 4.9 · 248 bookings</div>
            </div>
            <button className="px-4 py-2 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] text-xs font-medium flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Book
            </button>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="px-5 mt-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Nearby Studios</div>
        <div className="space-y-2">
          {studios.map((s) => (
            <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[color:var(--gold-deep)]/40 to-secondary flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-[color:var(--gold)]" strokeWidth={1.4} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  {s.verified && <span className="text-[9px] text-[color:var(--gold)]">✓</span>}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <span>{s.city}</span>·<span>{s.type}</span>
                </div>
                <div className="text-[11px] mt-0.5 flex items-center gap-2">
                  <span className="text-[color:var(--gold-soft)]">{s.price}</span>
                  <span className="text-muted-foreground flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-[color:var(--gold)] text-[color:var(--gold)]" /> {s.rating}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
