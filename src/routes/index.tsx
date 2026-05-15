import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/hero-worship.jpg";
import {
  Church, Music, Radio, Video, MessageCircle, Mic2, Users, Film,
  Sparkles, Crown, Rocket, Layers, Smartphone, Globe, Brain, DollarSign,
  Target, TrendingUp, Code2, Cpu, Cross, Play
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Warriors Media — Telugu Christian Media Ecosystem" },
      { name: "description", content: "A cinematic Christian media platform uniting worship, community, streaming, reels, studio booking, and creator tools for Telugu youth and ministries." },
      { property: "og:title", content: "Warriors Media — Christian Media Ecosystem" },
      { property: "og:description", content: "Worship. Community. Studio. Stream. One sanctuary for Telugu Christian creators." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" },
    ],
  }),
  component: Index,
});

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="relative py-28 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="mb-14 max-w-3xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-10 bg-gold-gradient" />
          <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">{eyebrow}</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-light leading-[1.05]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Card({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="group relative p-8 rounded-xl bg-card/60 backdrop-blur border border-border hover:border-[color:var(--gold)]/40 transition-all overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[color:var(--gold)]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <Icon className="w-7 h-7 text-[color:var(--gold)] mb-5" strokeWidth={1.2} />
      <h3 className="text-2xl mb-3 font-medium">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{children}</p>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen relative">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <Cross className="w-5 h-5 text-[color:var(--gold)]" strokeWidth={1.5} />
            <span className="font-display text-xl tracking-wide">Warriors <span className="text-gold-gradient">Media</span></span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#vision" className="hover:text-[color:var(--gold)] transition">Vision</a>
            <a href="#features" className="hover:text-[color:var(--gold)] transition">Ecosystem</a>
            <a href="#stack" className="hover:text-[color:var(--gold)] transition">Tech</a>
            <a href="#roadmap" className="hover:text-[color:var(--gold)] transition">Roadmap</a>
            <a href="#monetize" className="hover:text-[color:var(--gold)] transition">Business</a>
          </div>
          <a href="#mvp" className="px-5 py-2 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition">
            Join the MVP
          </a>
        </div>
      </nav>

      {/* HERO */}
      <header id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden grain">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Worship" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[color:var(--gold)]/30 bg-background/40 backdrop-blur mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[color:var(--gold)]" />
            <span className="text-xs uppercase tracking-[0.25em] text-[color:var(--gold-soft)]">A Christian Media Ecosystem</span>
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-light leading-[0.95] mb-8">
            Worship.<br />
            <span className="text-gold-gradient italic">Community.</span><br />
            Cinema.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            One sanctuary for Telugu Christian youth, worship teams, churches and creators —
            where faith meets film-grade craft.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="#vision" className="group px-8 py-3.5 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] font-medium glow-gold inline-flex items-center gap-2 hover:scale-[1.02] transition">
              Enter the Vision <Play className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </a>
            <a href="#features" className="px-8 py-3.5 rounded-full border border-border hover:border-[color:var(--gold)]/50 text-foreground transition">
              Explore the Ecosystem
            </a>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.4em] text-muted-foreground">Scroll</div>
      </header>

      {/* VISION */}
      <Section id="vision" eyebrow="01 — The Vision" title={<>A platform <em className="text-gold-gradient not-italic font-normal">built for the Kingdom.</em></>}>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 p-10 rounded-xl bg-card/40 border border-border">
            <Crown className="w-8 h-8 text-[color:var(--gold)] mb-6" strokeWidth={1.2} />
            <p className="text-xl md:text-2xl font-display leading-relaxed text-foreground/90">
              "To raise a generation of Telugu Christian creators with cinematic excellence —
              uniting worship, ministry, and digital media under one premium roof."
            </p>
            <div className="mt-8 pt-8 border-t border-border grid grid-cols-3 gap-6 text-sm">
              <div><div className="text-3xl font-display text-gold-gradient mb-1">10M+</div><div className="text-muted-foreground">Telugu Christians worldwide</div></div>
              <div><div className="text-3xl font-display text-gold-gradient mb-1">50K+</div><div className="text-muted-foreground">Worship teams & churches</div></div>
              <div><div className="text-3xl font-display text-gold-gradient mb-1">1</div><div className="text-muted-foreground">Unified ecosystem</div></div>
            </div>
          </div>
          <div className="space-y-4">
            {[
              ["Mission", "Equip the Church with world-class media tools."],
              ["Audience", "Telugu Christian youth, worship teams, ministries."],
              ["Promise", "Cinematic. Spiritual. Sovereign."],
            ].map(([k, v]) => (
              <div key={k} className="p-6 rounded-xl border border-border bg-card/30">
                <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--gold)] mb-2">{k}</div>
                <div className="text-foreground/90">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ECOSYSTEM / FEATURES */}
      <Section id="features" eyebrow="02 — The Ecosystem" title={<>Nine pillars. <em className="text-gold-gradient not-italic font-normal">One sanctuary.</em></>}>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card icon={Church} title="Church Community">Verified church profiles, prayer walls, event calendars, and member groups for every fellowship.</Card>
          <Card icon={Music} title="Worship Music">Stream Telugu worship, chord sheets, lyric videos, and curated playlists for every season.</Card>
          <Card icon={Radio} title="Live Streaming">Multi-cam YouTube & in-app live for Sunday services, conferences, and worship nights.</Card>
          <Card icon={Video} title="Reels & Shorts">Instagram-style vertical reels — sermons, testimonies, dance, scripture in 60 seconds.</Card>
          <Card icon={MessageCircle} title="WhatsApp Bridge">One-tap broadcast to ministry groups, prayer chains, and event RSVPs.</Card>
          <Card icon={Mic2} title="Studio Booking">Discover & book recording, video, and live-stream studios across South India.</Card>
          <Card icon={Users} title="Christian Social">Faith-first feed — no toxicity, no algorithms designed for outrage.</Card>
          <Card icon={Film} title="Performance Tools">In-ear mixes, click tracks, lyric prompters, and stage-ready setlists.</Card>
          <Card icon={Layers} title="Creator Studio">AI-assisted video editing, captions, dubbing & thumbnails — coming Phase 2.</Card>
        </div>
      </Section>

      {/* APP + WEB ARCHITECTURE */}
      <Section id="architecture" eyebrow="03 — Architecture" title={<>App, web & mobile, <em className="text-gold-gradient not-italic font-normal">in concert.</em></>}>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-8 rounded-xl border border-border bg-card/40">
            <div className="flex items-center gap-3 mb-6"><Globe className="w-6 h-6 text-[color:var(--gold)]" /><h3 className="text-2xl">Website Architecture</h3></div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {["Marketing & ministry landing","Church directory & profiles","Worship music library + player","Live event hub & VOD","Studio marketplace & bookings","Creator dashboard & analytics","Auth, billing, admin console"].map(x =>
                <li key={x} className="flex gap-3"><span className="text-[color:var(--gold)] mt-1">◆</span>{x}</li>
              )}
            </ul>
          </div>
          <div className="p-8 rounded-xl border border-border bg-card/40">
            <div className="flex items-center gap-3 mb-6"><Smartphone className="w-6 h-6 text-[color:var(--gold)]" /><h3 className="text-2xl">Mobile App Structure</h3></div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {["Home — personalized worship feed","Reels — vertical Christian shorts","Live — streams & watch parties","Worship — music + chord/lyric mode","Community — church, groups, prayer","Studio — book, manage sessions","Profile — creator tools & wallet"].map(x =>
                <li key={x} className="flex gap-3"><span className="text-[color:var(--gold)] mt-1">◆</span>{x}</li>
              )}
            </ul>
          </div>
        </div>
      </Section>

      {/* TECH STACK + AI */}
      <Section id="stack" eyebrow="04 — Tech & AI" title={<>Engineered for <em className="text-gold-gradient not-italic font-normal">cinematic scale.</em></>}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 rounded-xl border border-border bg-card/40">
            <div className="flex items-center gap-3 mb-6"><Code2 className="w-6 h-6 text-[color:var(--gold)]" /><h3 className="text-2xl">Recommended Stack</h3></div>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {[["Frontend","React · Next.js · Tailwind"],["Mobile","React Native / Expo"],["Backend","Node.js · Supabase · Postgres"],["Streaming","Mux · Cloudflare Stream"],["Realtime","Supabase Realtime · WebRTC"],["Storage","Cloudflare R2 · S3"],["Payments","Razorpay · Stripe"],["Infra","Cloudflare · Vercel · Edge"]].map(([k,v]) =>
                <div key={k} className="contents"><div className="text-[color:var(--gold-soft)]">{k}</div><div className="text-muted-foreground">{v}</div></div>
              )}
            </div>
          </div>
          <div className="p-8 rounded-xl border border-border bg-card/40">
            <div className="flex items-center gap-3 mb-6"><Brain className="w-6 h-6 text-[color:var(--gold)]" /><h3 className="text-2xl">AI Layer</h3></div>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {[["Captions","Whisper · auto Telugu↔English"],["Dubbing","ElevenLabs voice clone"],["Editing","Runway · Descript"],["Thumbnails","Flux · SDXL"],["Worship Tools","Chord & key detection AI"],["Moderation","GPT safety filter"],["Recommendations","Vector embeddings"],["Sermon Search","RAG over transcripts"]].map(([k,v]) =>
                <div key={k} className="contents"><div className="text-[color:var(--gold-soft)]">{k}</div><div className="text-muted-foreground">{v}</div></div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ROADMAP */}
      <Section id="roadmap" eyebrow="05 — Roadmap" title={<>From MVP to <em className="text-gold-gradient not-italic font-normal">global ministry.</em></>}>
        <div className="relative pl-8 border-l border-[color:var(--gold)]/30 space-y-10">
          {[
            { phase: "Phase 0 · MVP (0–3 mo)", icon: Rocket, items: ["Auth + church profiles","Worship music streaming","Reels feed + uploads","WhatsApp share/broadcast","Basic studio listing"] },
            { phase: "Phase 1 · Live & Social (3–6 mo)", icon: Radio, items: ["YouTube + in-app live","Comments, prayer reactions","Event RSVPs, ticketing","Creator monetization v1"] },
            { phase: "Phase 2 · Creator Suite (6–12 mo)", icon: Film, items: ["AI video editor & captions","Auto-dubbing Telugu↔English","Studio booking marketplace","Performance / setlist tools"] },
            { phase: "Phase 3 · Scale (12–24 mo)", icon: TrendingUp, items: ["Multi-language (Tamil, Hindi)","Global Indian-Christian diaspora","Ministry SaaS for churches","OTT app (TV / Fire Stick)"] },
          ].map(p => (
            <div key={p.phase} className="relative">
              <div className="absolute -left-[42px] top-1 w-4 h-4 rounded-full bg-gold-gradient glow-gold" />
              <div className="flex items-center gap-3 mb-3"><p.icon className="w-5 h-5 text-[color:var(--gold)]" /><h3 className="text-xl font-medium">{p.phase}</h3></div>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">{p.items.map(i => <li key={i} className="flex gap-2"><span className="text-[color:var(--gold)]">›</span>{i}</li>)}</ul>
            </div>
          ))}
        </div>
      </Section>

      {/* MVP */}
      <Section id="mvp" eyebrow="06 — MVP Plan" title={<>Ship the <em className="text-gold-gradient not-italic font-normal">first sanctuary.</em></>}>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { t: "Must-Have", items: ["Sign up + church profile","Worship music player","Reels upload & feed","WhatsApp share","Basic search"] },
            { t: "Nice-to-Have", items: ["Live stream beta","Studio listings","Prayer wall","Creator analytics"] },
            { t: "Out of Scope", items: ["AI video editor","Dubbing","OTT TV app","Multi-language UI"] },
          ].map(c => (
            <div key={c.t} className="p-8 rounded-xl border border-border bg-card/40">
              <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--gold)] mb-4">{c.t}</div>
              <ul className="space-y-2 text-sm text-muted-foreground">{c.items.map(i => <li key={i} className="flex gap-2"><span className="text-[color:var(--gold)]">◆</span>{i}</li>)}</ul>
            </div>
          ))}
        </div>
      </Section>

      {/* MONETIZATION */}
      <Section id="monetize" eyebrow="07 — Business" title={<>Sustainable <em className="text-gold-gradient not-italic font-normal">by design.</em></>}>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            [DollarSign, "Premium Plus", "Ad-free, HD live, exclusive worship sessions."],
            [Mic2, "Studio Commission", "10–15% on every studio booking through the marketplace."],
            [Users, "Church SaaS", "Monthly plan for events, giving, livestream tools."],
            [Sparkles, "Creator Tips", "Direct support for worship leaders & creators."],
            [Target, "Sponsorships", "Christian brands & ministries reach Telugu youth."],
            [Cpu, "AI Credits", "Pay-as-you-go for editing, dubbing, thumbnails."],
            [Film, "Event Ticketing", "Concerts, conferences, retreats — % per ticket."],
            [Crown, "Ministry Pro", "Premium tier for large churches & denominations."],
          ].map(([Ic, t, d]: any) => (
            <div key={t} className="p-6 rounded-xl border border-border bg-card/40 hover:border-[color:var(--gold)]/40 transition">
              <Ic className="w-6 h-6 text-[color:var(--gold)] mb-4" strokeWidth={1.2} />
              <div className="font-medium mb-2">{t}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* SCALE */}
      <Section id="scale" eyebrow="08 — Future" title={<>Built to <em className="text-gold-gradient not-italic font-normal">outlast trends.</em></>}>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { t: "Geographic Scale", d: "Telugu → Tamil → Hindi → Pan-Indian → Global Indian diaspora across US, UK, Gulf, Australia." },
            { t: "Vertical Scale", d: "From app → OTT TV app → ministry SaaS → studio chain → record label → film production house." },
            { t: "Community Scale", d: "Verified churches, denominations, Bible colleges, missions orgs onboarded as institutional partners." },
            { t: "AI Scale", d: "Proprietary Telugu Christian voice models, sermon RAG, worship recommendation engine." },
          ].map(s => (
            <div key={s.t} className="p-8 rounded-xl border border-border bg-card/40">
              <h3 className="text-2xl mb-3">{s.t}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="relative py-32 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.78_0.16_80/0.15),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto">
          <Cross className="w-10 h-10 text-[color:var(--gold)] mx-auto mb-6" strokeWidth={1.2} />
          <h2 className="text-5xl md:text-7xl font-light mb-6">
            The <span className="text-gold-gradient italic">Warriors</span> are rising.
          </h2>
          <p className="text-muted-foreground text-lg mb-10">Be among the first 1,000 founding creators, churches, and worship teams.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#" className="px-8 py-3.5 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] font-medium glow-gold">Join the Founding Circle</a>
            <a href="#" className="px-8 py-3.5 rounded-full border border-border hover:border-[color:var(--gold)]/50 transition">Partner With Us</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10 px-6 text-center text-xs text-muted-foreground tracking-[0.2em] uppercase">
        © Warriors Media — Crafted for the Kingdom
      </footer>
    </div>
  );
}
