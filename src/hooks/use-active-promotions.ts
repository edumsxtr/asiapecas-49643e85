import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns true if there is at least one active promotion within its valid period.
 * Lightweight HEAD count, refreshed every 5 minutes.
 */
export function useHasActivePromotions() {
  const { data } = useQuery({
    queryKey: ["has-active-promotions"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { count } = await supabase
        .from("part_promotions")
        .select("id", { count: "exact", head: true })
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`);
      return (count ?? 0) > 0;
    },
    staleTime: 5 * 60 * 1000,
  });
  return !!data;
}

/**
 * Retorna um Set com os part_id que têm promoção ativa no momento.
 * Compartilhado entre todos os cards (mesma queryKey → 1 única query, sem N+1).
 */
export function useActivePromotionIds() {
  const { data } = useQuery({
    queryKey: ["active-promotion-ids"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("part_promotions")
        .select("part_id")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`);
      return new Set((data || []).map((r) => r.part_id as string));
    },
    staleTime: 5 * 60 * 1000,
  });
  return data ?? new Set<string>();
}
