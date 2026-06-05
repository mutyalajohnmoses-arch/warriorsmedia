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
    <main className="min-h-screen relative flex items-center justify-center px-6 py-12 overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-full border border-[color:var(--gold)]/40 flex items-center justify-center mb-5 bg-card/40 backdrop-blur">
            <Cross className="w-6 h-6 text-[color:var(--gold)]" strokeWidth={1.4} />
          </div>
          <h1 className="font-display text-3xl tracking-wide">
            Warriors <span className="text-gold-gradient">Media</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-3">
            {mode === "signin" ? "Enter the Sanctuary" : "Join the Sanctuary"}
          </p>
        </div>

        <div className="relative p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-xl">
          <div className="absolute -top-px inset-x-10 h-px bg-gold-gradient opacity-60" />

          <form className="space-y-5" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <Field label="Full name" icon={User}>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Worship"
                  className="w-full bg-background/60 border border-border rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
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
                className="w-full bg-background/60 border border-border rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
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
                className="w-full bg-background/60 border border-border rounded-lg pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-4 top-[38px] text-muted-foreground hover:text-[color:var(--gold)]"
                aria-label="Toggle password"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-medium glow-gold flex items-center justify-center gap-2 hover:scale-[1.01] transition disabled:opacity-60"
            >
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

          <div className="flex items-center gap-4 my-7">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 rounded-lg border border-border hover:border-[color:var(--gold)]/50 text-sm transition disabled:opacity-60"
          >
            Continue with Google
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {mode === "signin" ? "New to Warriors? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-[color:var(--gold)] hover:underline"
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
