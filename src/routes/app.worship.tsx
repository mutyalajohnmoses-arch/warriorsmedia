import { createFileRoute } from "@tanstack/react-router";
import { Search, Play, Heart, Download, ListMusic } from "lucide-react";

export const Route = createFileRoute("/app/worship")({ component: WorshipPage });

function WorshipPage() {
  return (
    <div className="pb-4">
      <header className="px-5 pt-5">
        <h1 className="text-3xl font-display">Worship</h1>
        <p className="text-sm text-muted-foreground mt-1">Telugu Christian songs, lyrics & chord sheets</p>
        <div className="mt-4 flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input placeholder="Search songs, artists, albums" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </header>

      {/* Genre chips */}
      <div className="flex gap-2 overflow-x-auto px-5 mt-4 pb-1 scrollbar-hide">
        {["For You","Telugu","Tamil","Hindi","English","Christmas","Easter","Youth"].map((c,i) => (
          <button key={c} className={`shrink-0 px-4 py-1.5 rounded-full text-xs border ${i===0?"bg-gold-gradient text-[color:var(--primary-foreground)] border-transparent":"bg-card border-border text-muted-foreground"}`}>{c}</button>
        ))}
      </div>

      {/* Featured album */}
      <section className="px-5 mt-6">
        <div className="relative rounded-2xl overflow-hidden border border-border p-5 bg-gradient-to-br from-[color:var(--gold-deep)]/30 via-card to-card">
          <div className="text-xs uppercase tracking-widest text-[color:var(--gold)]">Featured Album</div>
          <h2 className="text-2xl font-display mt-1">Aaradhana Vol. 7</h2>
          <p className="text-xs text-muted-foreground mt-1">12 songs · Telugu Worship Collective</p>
          <button className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] text-xs font-medium">
            <Play className="w-3 h-3 fill-current" /> Play All
          </button>
        </div>
      </section>

      {/* Now playing mini */}
      <section className="px-5 mt-6">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Top Songs</h2>
        <div className="space-y-1">
          {[
            ["Yesayya","Telugu Worship Collective","4:32"],
            ["Manchitanam Choopinchu","Raj Prakash Paul","5:18"],
            ["Stuthi Yogyudu","Enosh Kumar","6:02"],
            ["Devuni Krupa","Rev. John Wesly","4:45"],
            ["Naa Daivama","Sharon Gospel","5:30"],
          ].map(([t,a,d],i) => (
            <div key={t} className="flex items-center gap-3 py-2.5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[color:var(--gold)]/30 to-card border border-border flex items-center justify-center text-[10px] text-[color:var(--gold)]">{i+1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t}</div>
                <div className="text-[11px] text-muted-foreground truncate">{a}</div>
              </div>
              <span className="text-[10px] text-muted-foreground">{d}</span>
              <Heart className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="px-5 mt-7">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Performance Tools</h2>
        <div className="grid grid-cols-3 gap-3">
          {[[ListMusic,"Setlists"],[Download,"Offline"],[Heart,"Liked"]].map(([Ic,l]:any) => (
            <div key={l} className="aspect-square rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-2">
              <Ic className="w-5 h-5 text-[color:var(--gold)]" strokeWidth={1.4} />
              <span className="text-[11px]">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Mini player */}
      <div className="fixed bottom-[68px] left-3 right-3 z-30 mt-4 mx-auto max-w-md">
        <div className="bg-card/95 backdrop-blur-xl border border-[color:var(--gold)]/30 rounded-xl px-3 py-2.5 flex items-center gap-3 glow-gold">
          <div className="w-9 h-9 rounded-md bg-gold-gradient" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Yesayya</div>
            <div className="text-[10px] text-muted-foreground truncate">Telugu Worship Collective</div>
          </div>
          <button className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center"><Play className="w-3.5 h-3.5 fill-[color:var(--primary-foreground)] text-[color:var(--primary-foreground)]" /></button>
        </div>
      </div>
    </div>
  );
}
