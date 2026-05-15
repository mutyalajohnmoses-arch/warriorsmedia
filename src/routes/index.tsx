import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Cross, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign In — Warriors Media" },
      { name: "description", content: "Sign in to Warriors Media — the cinematic Christian media ecosystem." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);

  return (
    <main className="min-h-screen relative flex items-center justify-center px-6 py-12 overflow-hidden">
      {/* Ambient gold glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,oklch(0.78_0.16_80/0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,oklch(0.15_0_0/0.6))]" />
      </div>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-full border border-[color:var(--gold)]/40 flex items-center justify-center mb-5 bg-card/40 backdrop-blur">
            <Cross className="w-6 h-6 text-[color:var(--gold)]" strokeWidth={1.4} />
          </div>
          <h1 className="font-display text-3xl tracking-wide">
            Warriors <span className="text-gold-gradient">Media</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-3">
            Enter the Sanctuary
          </p>
        </div>

        {/* Card */}
        <div className="relative p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-xl">
          <div className="absolute -top-px inset-x-10 h-px bg-gold-gradient opacity-60" />

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="you@ministry.com"
                  className="w-full bg-background/60 border border-border rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-background/60 border border-border rounded-lg pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[color:var(--gold)] transition"
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="accent-[color:var(--gold)]" />
                Remember me
              </label>
              <a href="#" className="text-[color:var(--gold-soft)] hover:text-[color:var(--gold)] transition">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-medium glow-gold flex items-center justify-center gap-2 hover:scale-[1.01] transition"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center gap-4 my-7">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button className="w-full py-3 rounded-lg border border-border hover:border-[color:var(--gold)]/50 text-sm transition">
            Continue with Google
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          New to Warriors?{" "}
          <a href="#" className="text-[color:var(--gold)] hover:underline">
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
