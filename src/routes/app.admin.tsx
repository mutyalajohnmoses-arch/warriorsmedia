import { createFileRoute } from "@tanstack/react-router";
import { Users, Film, Radio, DollarSign, Flag, TrendingUp, Shield, ChevronRight, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/admin")({ component: AdminPage });

function AdminPage() {
  return (
    <div className="pb-6">
      <header className="px-5 pt-5 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--gold)] flex items-center gap-1.5"><Shield className="w-3 h-3" /> Admin</div>
          <h1 className="text-2xl font-display mt-1">Dashboard</h1>
        </div>
        <div className="px-3 py-1 rounded-full bg-card border border-[color:var(--gold)]/30 text-[10px] uppercase tracking-widest text-[color:var(--gold)]">Owner</div>
      </header>

      {/* KPIs */}
      <section className="px-5 mt-5 grid grid-cols-2 gap-3">
        {[
          [Users, "Active users", "48,291", "+12%"],
          [Film, "Reels today", "1,842", "+8%"],
          [Radio, "Live now", "23", "Live"],
          [DollarSign, "Revenue (mo)", "₹4.2L", "+24%"],
        ].map(([Ic,l,v,t]:any) => (
          <div key={l} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <Ic className="w-4 h-4 text-[color:var(--gold)]" strokeWidth={1.4} />
              <span className="text-[10px] text-[color:var(--gold-soft)]">{t}</span>
            </div>
            <div className="text-xl font-display mt-2">{v}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
          </div>
        ))}
      </section>

      {/* Chart placeholder */}
      <section className="px-5 mt-5">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-[color:var(--gold)]" /> Watch time · 7d</div>
            <span className="text-[11px] text-[color:var(--gold)]">+18%</span>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {[40,55,38,72,62,88,76].map((h,i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[color:var(--gold-deep)] to-[color:var(--gold)]" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-muted-foreground tracking-widest">
            {["M","T","W","T","F","S","S"].map((d,i) => <span key={i}>{d}</span>)}
          </div>
        </div>
      </section>

      {/* Moderation queue */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Flag className="w-3 h-3 text-[color:var(--gold)]" /> Moderation Queue</div>
          <span className="text-[11px] text-destructive">14 pending</span>
        </div>
        <div className="space-y-2">
          {[
            ["Reel report","Spam — promotional","2m ago"],
            ["Comment flag","Hateful language","18m ago"],
            ["Studio dispute","Refund requested","1h ago"],
          ].map(([t,d,when]) => (
            <div key={t+when} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-9 h-9 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t}</div>
                <div className="text-[11px] text-muted-foreground truncate">{d} · {when}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-5 mt-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 gap-2">
          {["Verify church","Approve studio","Issue payout","Send broadcast","Feature reel","Edit homepage"].map((a) => (
            <button key={a} className="px-3 py-2.5 rounded-xl bg-card border border-border text-xs text-left hover:border-[color:var(--gold)]/40 transition">
              {a}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
