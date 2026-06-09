import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cross, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign In — Warriors Media" },
      {
        name: "description",
        content: "Sign in to Warriors Media — the cinematic Christian media ecosystem.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome to the Sanctuary.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/dashboard" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (mode === "signin" && /invalid login credentials/i.test(msg)) {
        toast.error("No account found. Switching to sign up.");
        setMode("signup");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed.");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center px-6 py-12 overflow-hidden">
      {/* Animated aurora background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full blur-[140px] opacity-70"
          style={{ background: "radial-gradient(circle, #7C5CFF 0%, transparent 70%)", animation: "aurora 12s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-40 -right-32 w-[620px] h-[620px] rounded-full blur-[150px] opacity-60"
          style={{ background: "radial-gradient(circle, #5B8CFF 0%, transparent 70%)", animation: "aurora 16s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-[120px] opacity-40"
          style={{ background: "radial-gradient(circle, #A78BFA 0%, transparent 70%)", animation: "float 9s ease-in-out infinite" }}
        />
      </div>

      <div className="w-full max-w-md relative">
        {/* Floating glow orbs */}
        <div
          className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-royal-gradient opacity-30 blur-2xl"
          style={{ animation: "float 6s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-8 -right-6 w-20 h-20 rounded-full opacity-40 blur-2xl"
          style={{ background: "linear-gradient(135deg, #5B8CFF, #A78BFA)", animation: "float 8s ease-in-out infinite reverse" }}
        />

        <div className="flex flex-col items-center mb-10 relative">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-royal-gradient blur-xl opacity-60" />
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-[rgba(20,15,55,0.7)] backdrop-blur-xl border border-white/15 glow-royal">
              <Cross className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="font-display text-4xl tracking-wide">
            Warriors <span className="text-royal-gradient">Media</span>
          </h1>
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground mt-3">
            {mode === "signin" ? "Enter the Sanctuary" : "Join the Sanctuary"}
          </p>
        </div>

        {/* Gradient border card */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-violet-400/40 via-indigo-400/20 to-blue-400/40 shadow-[0_30px_80px_-20px_rgba(124,92,255,0.45)]">
          <div className="relative rounded-2xl p-8 bg-[rgba(15,10,40,0.65)] backdrop-blur-xl overflow-hidden">
            <div className="absolute -top-px inset-x-10 h-px bg-royal-gradient opacity-80" />
            <div className="absolute -inset-32 -z-0 opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle at 30% 0%, rgba(124,92,255,0.4), transparent 60%)" }}
            />

            <form className="space-y-5 relative" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <Field label="Full name" icon={User}>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Worship"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#7C5CFF]/70 focus:bg-white/[0.06] transition"
                  />
                </Field>
              )}

              <Field label="Email" icon={Mail}>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@ministry.com"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#7C5CFF]/70 focus:bg-white/[0.06] transition"
                />
              </Field>

              <Field label="Password" icon={Lock}>
                <input
                  required
                  minLength={6}
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-[#7C5CFF]/70 focus:bg-white/[0.06] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-4 top-[38px] text-muted-foreground hover:text-[#A78BFA] transition"
                  aria-label="Toggle password"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full mt-2 py-3.5 rounded-lg bg-royal-gradient text-white font-medium glow-royal flex items-center justify-center gap-2 hover:scale-[1.015] active:scale-[0.99] transition disabled:opacity-60 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Sign In" : "Create Account"}{" "}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-4 my-7 relative">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="relative w-full py-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#7C5CFF]/40 text-sm transition disabled:opacity-60"
            >
              Continue with Google
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {mode === "signin" ? "New to Warriors? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-[#A78BFA] hover:text-white transition hover:underline"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-2 block">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
        {children}
      </div>
    </div>
  );
}
