import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users, Briefcase, DollarSign, TrendingUp, Video, Music2, Sparkles,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Search, Bell, Plus,
  Play, Pause, CheckCircle2, Clock, Activity, Zap, Globe, Instagram,
  Youtube, Twitter, Cpu, Wand2, Mic, Film, Image as ImageIcon,
  ChevronRight, Star, Calendar, Target, LayoutGrid, MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Warriors Studio — Command Center" },
      { name: "description", content: "Ultra-premium command center for Warriors Studio: team, clients, projects, revenue, social, video, music and AI tools." },
    ],
  }),
  component: StudioDashboard,
});

/* ---------- shared atoms ---------- */

function GlassCard({
  children, className = "", hover = true,
}: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div
      className={`group relative rounded-2xl p-[1px] bg-gradient-to-br from-white/25 via-white/5 to-white/15 ${
        hover ? "transition-all duration-500 hover:from-violet-300/50 hover:via-blue-300/20 hover:to-fuchsia-300/40 hover:-translate-y-0.5" : ""
      } ${className}`}
    >
      <div className="relative h-full w-full rounded-2xl bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
             style={{ background: "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(139,92,246,0.18), transparent 40%)" }} />
        {children}
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, delta, up = true, accent = "violet",
}: {
  icon: any; label: string; value: string; delta: string; up?: boolean;
  accent?: "violet" | "blue" | "fuchsia" | "cyan";
}) {
  const grads: Record<string, string> = {
    violet: "from-violet-500 to-indigo-500",
    blue: "from-blue-500 to-cyan-500",
    fuchsia: "from-fuchsia-500 to-pink-500",
    cyan: "from-cyan-400 to-blue-500",
  };
  return (
    <GlassCard>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${grads[accent]} shadow-[0_8px_30px_-6px_rgba(139,92,246,0.5)]`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 backdrop-blur ${
            up ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"
          }`}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta}
          </span>
        </div>
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className="mt-5 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${grads[accent]} animate-[shimmer_3s_ease-in-out_infinite]`} style={{ width: "72%" }} />
        </div>
      </div>
    </GlassCard>
  );
}

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-violet-300/80">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ---------- data ---------- */

const team = [
  { name: "Mutyala John Moses", role: "Music Producer", load: 82, color: "from-violet-500 to-fuchsia-500" },
  { name: "Andra Akula Raju", role: "Voice Analyst", load: 64, color: "from-blue-500 to-cyan-500" },
  { name: "Stanley Nuthalpati", role: "Lead Developer", load: 91, color: "from-fuchsia-500 to-pink-500" },
  { name: "Somesh Kumar", role: "Social Analyst", load: 47, color: "from-indigo-500 to-violet-500" },
  { name: "Karthick", role: "Video Editor", load: 73, color: "from-cyan-400 to-blue-500" },
];

const clients = [
  { name: "Grace Cathedral", tier: "Enterprise", value: "$48,200", status: "Active" },
  { name: "Living Hope Media", tier: "Studio", value: "$22,800", status: "Active" },
  { name: "Hosanna Records", tier: "Pro", value: "$14,100", status: "Onboarding" },
  { name: "Faith Stream Global", tier: "Enterprise", value: "$96,400", status: "Active" },
];

const projects = [
  { name: "Easter 2026 Live", stage: "Production", progress: 78, due: "Mar 28" },
  { name: "Worship Album Vol. III", stage: "Mixing", progress: 54, due: "Apr 12" },
  { name: "Brand Film — Hosanna", stage: "Editing", progress: 88, due: "Mar 18" },
  { name: "Reels Series Q2", stage: "Planning", progress: 22, due: "May 02" },
];

const socials = [
  { icon: Instagram, name: "Instagram", followers: "284.2K", growth: "+4.8%", color: "from-fuchsia-500 to-pink-500" },
  { icon: Youtube, name: "YouTube", followers: "1.2M", growth: "+7.1%", color: "from-rose-500 to-red-500" },
  { icon: Twitter, name: "X / Twitter", followers: "92.4K", growth: "+2.3%", color: "from-sky-500 to-blue-500" },
  { icon: Globe, name: "Website", followers: "412K /mo", growth: "+11.6%", color: "from-violet-500 to-indigo-500" },
];

const pipeline = [
  { stage: "Pre-Production", count: 6, icon: Calendar },
  { stage: "Shooting", count: 3, icon: Video },
  { stage: "Editing", count: 8, icon: Film },
  { stage: "Color & VFX", count: 4, icon: Wand2 },
  { stage: "Delivery", count: 11, icon: CheckCircle2 },
];

const aiTools = [
  { name: "Lyric Composer", usage: 86, icon: Mic, tag: "GPT-5.5" },
  { name: "Auto Reel Editor", usage: 71, icon: Film, tag: "Gemini 3" },
  { name: "Thumbnail Studio", usage: 58, icon: ImageIcon, tag: "Nano Banana" },
  { name: "Voice Clone", usage: 44, icon: Cpu, tag: "Custom" },
];

/* ---------- page ---------- */

function StudioDashboard() {
  return (
    <main
      className="relative min-h-screen overflow-hidden text-white"
      onMouseMove={(e) => {
        const t = e.currentTarget as HTMLElement;
        t.style.setProperty("--mx", `${e.clientX}px`);
        t.style.setProperty("--my", `${e.clientY}px`);
      }}
      style={{ background: "#070314" }}
    >
      {/* Animated gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.35),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(168,85,247,0.35),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.4),transparent_55%)]" />
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-violet-600/30 blur-[140px] animate-[float_14s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full bg-blue-500/30 blur-[140px] animate-[float_18s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-fuchsia-500/25 blur-[140px] animate-[float_22s_ease-in-out_infinite]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            background:
              "radial-gradient(500px circle at var(--mx,50%) var(--my,30%), rgba(139,92,246,0.18), transparent 60%)",
          }}
        />
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.05)} }
        @keyframes shimmer { 0%,100%{opacity:.8} 50%{opacity:1} }
        @keyframes spin-slow { to { transform: rotate(360deg) } }
      `}</style>

      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-2xl bg-[#070314]/60">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 grid place-items-center shadow-[0_10px_40px_-10px_rgba(139,92,246,0.7)]">
              <Sparkles className="h-4 w-4 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Warriors Studio</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Command Center</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-6 text-sm">
            {["Overview", "Projects", "Clients", "Revenue", "Studio"].map((i, idx) => (
              <button key={i} className={`px-3 py-1.5 rounded-lg transition ${
                idx === 0 ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}>{i}</button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 w-72">
              <Search className="h-4 w-4 text-white/40" />
              <input placeholder="Search projects, clients, assets…" className="bg-transparent outline-none text-sm placeholder:text-white/30 w-full" />
              <kbd className="text-[10px] text-white/40 border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
            </div>
            <button className="relative h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10 transition">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.9)]" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.8)] hover:shadow-[0_14px_50px_-10px_rgba(139,92,246,1)] transition">
              <Plus className="h-4 w-4" /> New Project
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-10 space-y-10">
        {/* Hero greeting */}
        <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur px-3 py-1 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              All systems nominal · Q2 on track
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Good evening, <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">Moses</span>.
            </h1>
            <p className="mt-3 text-white/60 max-w-xl">
              Your studio shipped <span className="text-white">14 deliverables</span> this week. Revenue is up <span className="text-emerald-300">+18.4%</span> and pipeline value crossed <span className="text-white">$420K</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-white/10 bg-white/5 backdrop-blur px-4 py-2.5 text-sm hover:bg-white/10 transition inline-flex items-center gap-2">
              <Activity className="h-4 w-4" /> Live Activity
            </button>
            <button className="rounded-xl border border-white/10 bg-white/5 backdrop-blur px-4 py-2.5 text-sm hover:bg-white/10 transition inline-flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" /> Customize
            </button>
          </div>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard icon={DollarSign} label="Revenue (MTD)" value="$284,920" delta="+18.4%" accent="violet" />
          <KpiCard icon={Briefcase} label="Active Projects" value="27" delta="+4" accent="blue" />
          <KpiCard icon={Users} label="Clients" value="142" delta="+9" accent="fuchsia" />
          <KpiCard icon={TrendingUp} label="Pipeline Value" value="$1.42M" delta="+12.1%" accent="cyan" />
        </section>

        {/* Revenue + Social */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <GlassCard className="lg:col-span-2">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-violet-300/80">Revenue Analytics</p>
                  <h3 className="mt-1 text-xl font-semibold">12-month performance</h3>
                </div>
                <div className="flex items-center gap-1 text-xs rounded-lg border border-white/10 bg-white/5 p-1">
                  {["1M", "3M", "6M", "1Y"].map((p, i) => (
                    <button key={p} className={`px-2.5 py-1 rounded-md transition ${i === 3 ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}>{p}</button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="mt-6 h-64 relative">
                <svg viewBox="0 0 600 220" className="w-full h-full">
                  <defs>
                    <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgb(167,139,250)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="rgb(167,139,250)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="revLine" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="50%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#e879f9" />
                    </linearGradient>
                  </defs>
                  {[40, 80, 120, 160, 200].map((y) => (
                    <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
                  ))}
                  <path
                    d="M0,170 C50,150 80,120 120,130 C170,142 200,80 250,90 C300,100 330,60 380,70 C430,80 470,40 520,55 C560,67 580,45 600,50 L600,220 L0,220 Z"
                    fill="url(#rev)"
                  />
                  <path
                    d="M0,170 C50,150 80,120 120,130 C170,142 200,80 250,90 C300,100 330,60 380,70 C430,80 470,40 520,55 C560,67 580,45 600,50"
                    fill="none" stroke="url(#revLine)" strokeWidth="2.5" strokeLinecap="round"
                  />
                </svg>
                <div className="absolute top-2 left-0 flex gap-5 text-xs text-white/60">
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-400" /> Revenue</span>
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-400" /> Forecast</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <SectionHeader eyebrow="Social" title="Audience Pulse" />
              <div className="space-y-3">
                {socials.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition p-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center shadow-lg`}>
                      <s.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-white/50">{s.followers}</p>
                    </div>
                    <span className="text-xs text-emerald-300">{s.growth}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Projects + Team */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <GlassCard className="lg:col-span-2">
            <div className="p-6">
              <SectionHeader
                eyebrow="Pipeline"
                title="Project Tracking"
                action={<button className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1">View all <ChevronRight className="h-3 w-3" /></button>}
              />
              <div className="space-y-2">
                {projects.map((p) => (
                  <div key={p.name} className="group/row grid grid-cols-12 items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10 transition p-4">
                    <div className="col-span-5">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-white/50 mt-0.5">Due {p.due}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase tracking-widest text-violet-300/80 border border-violet-300/20 rounded-full px-2 py-1">{p.stage}</span>
                    </div>
                    <div className="col-span-4">
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-400 via-blue-400 to-fuchsia-400" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <div className="col-span-1 text-right text-xs text-white/70">{p.progress}%</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <SectionHeader eyebrow="People" title="Team Workload" />
              <div className="space-y-4">
                {team.map((m) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <div className={`relative h-10 w-10 rounded-full bg-gradient-to-br ${m.color} grid place-items-center text-xs font-semibold`}>
                      {m.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#070314]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm truncate">{m.name}</p>
                        <span className="text-xs text-white/50">{m.load}%</span>
                      </div>
                      <p className="text-[11px] text-white/50">{m.role}</p>
                      <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${m.color}`} style={{ width: `${m.load}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Clients + Music */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <GlassCard className="lg:col-span-2">
            <div className="p-6">
              <SectionHeader
                eyebrow="Accounts"
                title="Client Management"
                action={<button className="text-xs inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 hover:bg-white/10"><Plus className="h-3 w-3" /> Add client</button>}
              />
              <div className="overflow-hidden rounded-xl border border-white/5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-white/40 bg-white/[0.03]">
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 font-medium">Tier</th>
                      <th className="px-4 py-3 font-medium">MRR</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.name} className="border-t border-white/5 hover:bg-white/[0.04] transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/40 to-blue-500/40 border border-white/10 grid place-items-center text-xs">
                              {c.name[0]}
                            </div>
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-white/70">{c.tier}</td>
                        <td className="px-4 py-3.5">{c.value}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[11px] rounded-full px-2 py-1 ${
                            c.status === "Active"
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-amber-400/10 text-amber-300"
                          }`}>{c.status}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button className="text-white/40 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <SectionHeader eyebrow="Music" title="Production Console" />
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-blue-500/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 grid place-items-center">
                    <Music2 className="h-5 w-5" />
                    <span className="absolute -inset-1 rounded-xl border border-fuchsia-300/40 animate-[spin-slow_8s_linear_infinite]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Heaven's Anthem — Master v7</p>
                    <p className="text-xs text-white/50">Hosanna Records · 03:42 / 04:21</p>
                  </div>
                  <button className="h-10 w-10 rounded-full bg-white text-black grid place-items-center hover:scale-105 transition">
                    <Play className="h-4 w-4 ml-0.5" />
                  </button>
                </div>
                {/* waveform */}
                <div className="mt-4 flex items-end gap-1 h-14">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const h = 20 + Math.abs(Math.sin(i * 0.6)) * 80;
                    const active = i < 32;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${active ? "bg-gradient-to-t from-violet-400 to-fuchsia-300" : "bg-white/10"}`}
                        style={{ height: `${h}%` }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { l: "Tracks", v: "184" },
                  { l: "Mastered", v: "57" },
                  { l: "Queue", v: "12" },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg border border-white/5 bg-white/[0.03] py-2.5">
                    <p className="text-lg font-semibold">{s.v}</p>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Video pipeline */}
        <section>
          <SectionHeader eyebrow="Studio" title="Video Production Pipeline" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {pipeline.map((p, idx) => (
              <GlassCard key={p.stage}>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 grid place-items-center">
                      <p.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] text-white/40">Stage {idx + 1}</span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold">{p.count}</p>
                  <p className="text-xs text-white/50">{p.stage}</p>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-gradient-to-r from-violet-400 to-fuchsia-400" : "bg-white/5"}`} />
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* AI Tools + Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <GlassCard className="lg:col-span-2">
            <div className="p-6">
              <SectionHeader
                eyebrow="Intelligence"
                title="AI Tools Management"
                action={<span className="inline-flex items-center gap-1.5 text-xs text-violet-300"><Zap className="h-3 w-3" /> 24.6K credits</span>}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                {aiTools.map((t) => (
                  <div key={t.name} className="group/ai rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-4 hover:border-violet-300/30 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 grid place-items-center shadow-[0_8px_30px_-6px_rgba(99,102,241,0.6)]">
                          <t.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-[10px] uppercase tracking-widest text-white/40">{t.tag}</p>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover/ai:opacity-100 transition text-xs rounded-lg border border-white/10 bg-white/5 px-2 py-1">Open</button>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
                        <span>Monthly usage</span>
                        <span className="text-white/80">{t.usage}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400" style={{ width: `${t.usage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <SectionHeader eyebrow="Live" title="Activity Stream" />
              <ul className="space-y-4">
                {[
                  { icon: CheckCircle2, c: "emerald", t: "Brand Film — Hosanna delivered", s: "2m ago" },
                  { icon: Star, c: "amber", t: "New 5★ review from Grace Cathedral", s: "18m ago" },
                  { icon: MessageSquare, c: "violet", t: "Stanley commented on Easter 2026 Live", s: "1h ago" },
                  { icon: Target, c: "blue", t: "Q2 revenue goal reached 82%", s: "3h ago" },
                  { icon: Clock, c: "fuchsia", t: "Voice session scheduled for Friday", s: "5h ago" },
                ].map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <div className={`h-8 w-8 rounded-lg grid place-items-center bg-${a.c}-400/10 text-${a.c}-300 border border-${a.c}-400/20 shrink-0`}>
                      <a.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{a.t}</p>
                      <p className="text-xs text-white/40">{a.s}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>
        </section>

        <footer className="pt-6 pb-2 flex items-center justify-between text-xs text-white/40">
          <span>Warriors Studio · Command Center v2.0</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> All edges connected
          </span>
        </footer>
      </div>
    </main>
  );
}
