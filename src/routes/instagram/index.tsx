import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cross, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/instagram/")({
  component: InstagramPage,
});

function InstagramPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Instagram Creator Studio</h1>
      <p>Instagram route is working.</p>
    </div>
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
