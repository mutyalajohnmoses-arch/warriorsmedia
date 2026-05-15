import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Heart, MessageCircle, Share2, Gift, Users, Send } from "lucide-react";
import heroImg from "@/assets/hero-worship.jpg";

export const Route = createFileRoute("/app/live")({ component: LivePage });

function LivePage() {
  return (
    <div className="pb-4">
      {/* Player */}
      <div className="relative h-[42vh] min-h-[280px] bg-black">
        <img src={heroImg} alt="" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button className="w-9 h-9 rounded-full bg-background/60 backdrop-blur flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/90 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE · 2.4K
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="px-5 pt-4">
        <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--gold)]">Worship Live</div>
        <h1 className="text-2xl font-display mt-1 leading-tight">Hyderabad Praise Night — Yesayya Live Worship</h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-9 h-9 rounded-full bg-gold-gradient" />
          <div className="flex-1">
            <div className="text-sm font-medium">Yesayya Ministries</div>
            <div className="text-xs text-muted-foreground">312K followers</div>
          </div>
          <button className="px-4 py-1.5 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] text-xs font-medium">Follow</button>
        </div>
      </div>

      {/* Reactions */}
      <div className="px-5 mt-4 grid grid-cols-4 gap-2">
        {[[Heart,"12.4K"],[MessageCircle,"842"],[Gift,"Tip"],[Share2,"Share"]].map(([Ic,l]:any,i) => (
          <button key={i} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-card border border-border">
            <Ic className="w-4 h-4 text-[color:var(--gold)]" />
            <span className="text-[11px] text-muted-foreground">{l}</span>
          </button>
        ))}
      </div>

      {/* Live chat */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center gap-2"><Users className="w-3.5 h-3.5 text-[color:var(--gold)]" /> Live Chat</h3>
          <span className="text-[10px] text-muted-foreground">2,431 viewers</span>
        </div>
        <div className="space-y-2 mb-3">
          {[
            ["Sarah","Praise the Lord! 🙌"],
            ["John","Anointed worship 🔥"],
            ["Priscilla","Praying from Vizag"],
            ["Daniel","Amen amen"],
          ].map(([n,m]) => (
            <div key={n} className="text-xs"><span className="text-[color:var(--gold-soft)] font-medium">{n}</span> <span className="text-muted-foreground">{m}</span></div>
          ))}
        </div>
        <div className="flex gap-2 items-center bg-card border border-border rounded-full px-4 py-2">
          <input placeholder="Send a message..." className="flex-1 bg-transparent text-xs outline-none" />
          <Send className="w-4 h-4 text-[color:var(--gold)]" />
        </div>
      </div>
    </div>
  );
}
