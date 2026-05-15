import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Users, Bell, ChevronRight, Search } from "lucide-react";

export const Route = createFileRoute("/app/community")({ component: CommunityPage });

function CommunityPage() {
  const groups = [
    { name: "Hyderabad Worship Team", members: "1.2K", last: "Setlist for Sunday morning", unread: 12, wa: true },
    { name: "Telugu Youth Ministry", members: "842", last: "Joel: Bible study tonight at 7", unread: 3, wa: true },
    { name: "Sound Engineers India", members: "324", last: "Anyone tried the new Behringer?", unread: 0 },
    { name: "Pastors' Circle", members: "98", last: "Prayer chain — please join", unread: 5 },
  ];

  return (
    <div className="pb-6">
      <header className="px-5 pt-5">
        <h1 className="text-3xl font-display">Community</h1>
        <p className="text-sm text-muted-foreground mt-1">Your churches, groups & WhatsApp bridges</p>
        <div className="mt-4 flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input placeholder="Search groups, churches" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </header>

      {/* WhatsApp banner */}
      <section className="px-5 mt-5">
        <div className="rounded-xl border border-[color:var(--gold)]/30 bg-gradient-to-br from-[color:var(--gold)]/10 to-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold-gradient flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[color:var(--primary-foreground)]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">WhatsApp Bridge connected</div>
            <div className="text-[11px] text-muted-foreground">Broadcast to 4 ministry groups in one tap</div>
          </div>
          <ChevronRight className="w-4 h-4 text-[color:var(--gold)]" />
        </div>
      </section>

      {/* My church */}
      <section className="px-5 mt-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">My Church</div>
        <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[color:var(--gold-deep)] to-[color:var(--gold)] flex items-center justify-center text-[color:var(--primary-foreground)] font-display text-lg">B</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Bethel Telugu Church</div>
            <div className="text-[11px] text-muted-foreground truncate">Madhapur, Hyderabad · Sunday 9 AM</div>
          </div>
          <Bell className="w-4 h-4 text-[color:var(--gold)]" />
        </div>
      </section>

      {/* Groups */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Groups</div>
          <button className="text-[11px] text-[color:var(--gold)]">+ New</button>
        </div>
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.name} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="relative w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
                <Users className="w-5 h-5 text-[color:var(--gold)]" />
                {g.wa && <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[color:var(--gold)] text-[8px] font-bold text-[color:var(--primary-foreground)] flex items-center justify-center">W</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium truncate">{g.name}</div>
                  {g.unread > 0 && <span className="ml-2 text-[10px] bg-gold-gradient text-[color:var(--primary-foreground)] px-1.5 py-0.5 rounded-full">{g.unread}</span>}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{g.last}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">{g.members} members</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
