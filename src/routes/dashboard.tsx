import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cross, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/" });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", session.user.id)
        .maybeSingle();
      setProfile(data ?? { full_name: null, email: session.user.email ?? null });
    };
    load();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full p-10 rounded-2xl border border-border bg-card/60 backdrop-blur-xl text-center">
        <Cross className="w-8 h-8 text-[color:var(--gold)] mx-auto mb-5" strokeWidth={1.4} />
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Sanctuary</p>
        <h1 className="font-display text-3xl mb-2">
          Welcome, <span className="text-gold-gradient">{profile?.full_name ?? "Warrior"}</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-8">{profile?.email}</p>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-[color:var(--gold)]/50 text-sm transition"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </main>
  );
}
