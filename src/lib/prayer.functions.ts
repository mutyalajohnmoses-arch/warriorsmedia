import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export const getPrayerRequests = createServerFn({ method: "GET" })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = data;
    try {
      const { data: prayers, error } = await sb
        .from("prayer_requests")
        .select(
          `
          id,
          user_id,
          title,
          description,
          category,
          created_at,
          profiles:user_id (full_name),
          prayer_agreements (id)
        `
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user agreements
      const { data: myAgreements } = await sb
        .from("prayer_agreements")
        .select("prayer_request_id")
        .eq("user_id", userId);

      const myAgreementIds = new Set(myAgreements?.map((a: any) => a.prayer_request_id) || []);

      return (
        prayers?.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          title: p.title,
          description: p.description,
          category: p.category || "other",
          agreed_count: p.prayer_agreements?.length || 0,
          created_at: p.created_at,
          user_name: (p.profiles as any)?.full_name || "Anonymous",
          is_own: p.user_id === userId,
          has_agreed: myAgreementIds.has(p.id),
        })) || []
      );
    } catch (err) {
      console.error("Error fetching prayers:", err);
      return [];
    }
  });

export const createPrayerRequest = createServerFn({ method: "POST" })
  .inputValidator((data: { title: string; description: string; category: string }) => data)
  .handler(async ({ data }) => {
    const { title, description, category } = data;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not authenticated");

      const { error } = await sb.from("prayer_requests").insert({
        user_id: session.user.id,
        title,
        description,
        category,
      });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to create prayer");
    }
  });

export const deletePrayerRequest = createServerFn({ method: "POST" })
  .inputValidator((data: { prayerId: string }) => data)
  .handler(async ({ data }) => {
    const { prayerId } = data;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not authenticated");

      // Verify ownership
      const { data: prayer } = await sb
        .from("prayer_requests")
        .select("user_id")
        .eq("id", prayerId)
        .single();

      if (prayer?.user_id !== session.user.id) {
        throw new Error("You can only delete your own prayers");
      }

      // Delete related agreements first
      await sb.from("prayer_agreements").delete().eq("prayer_request_id", prayerId);

      // Then delete the prayer
      const { error } = await sb
        .from("prayer_requests")
        .delete()
        .eq("id", prayerId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to delete prayer");
    }
  });

export const agreeToPrayer = createServerFn({ method: "POST" })
  .inputValidator((data: { prayerId: string }) => data)
  .handler(async ({ data }) => {
    const { prayerId } = data;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not authenticated");

      // Check if already agreed
      const { data: existing } = await sb
        .from("prayer_agreements")
        .select("id")
        .eq("prayer_request_id", prayerId)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existing) {
        // Remove agreement
        const { error } = await sb
          .from("prayer_agreements")
          .delete()
          .eq("prayer_request_id", prayerId)
          .eq("user_id", session.user.id);

        if (error) throw error;
        return { success: true, agreed: false };
      } else {
        // Add agreement
        const { error } = await sb.from("prayer_agreements").insert({
          prayer_request_id: prayerId,
          user_id: session.user.id,
        });

        if (error) throw error;
        return { success: true, agreed: true };
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to agree to prayer");
    }
  });
