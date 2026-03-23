import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketResearch {
  id: string;
  part_id: string;
  distributor_name: string;
  price_found: number;
  delivery_days: number | null;
  payment_terms: string | null;
  availability: string | null;
  source_url: string | null;
  notes: string | null;
  researched_at: string;
  researched_by: string | null;
  created_at: string;
}

export function useMarketResearch(partId: string | undefined) {
  return useQuery({
    queryKey: ["market-research", partId],
    enabled: !!partId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_research" as any)
        .select("*")
        .eq("part_id", partId!)
        .order("researched_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MarketResearch[];
    },
  });
}

export function useAddMarketResearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<MarketResearch, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("market_research" as any)
        .insert(entry as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["market-research", vars.part_id] });
      qc.invalidateQueries({ queryKey: ["market-research-overview"] });
    },
  });
}

export function useMarketResearchOverview() {
  return useQuery({
    queryKey: ["market-research-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_research" as any)
        .select("*")
        .order("researched_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as MarketResearch[];
    },
  });
}
