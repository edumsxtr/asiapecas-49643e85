import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCategoryParts(category: string | null) {
  return useQuery({
    queryKey: ["category-parts", category],
    enabled: !!category,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("id, material, description, manufacturer, machine_model, stock, estimated_price, image_url, part_category, compatible_models, updated_at")
        .eq("part_category", category!)
        .gt("stock", 0)
        .order("estimated_price", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).sort((a, b) => {
        const va = (a.estimated_price || 0) * a.stock;
        const vb = (b.estimated_price || 0) * b.stock;
        if (vb !== va) return vb - va;
        return b.stock - a.stock;
      });
    },
  });
}

export function useCategoryRelatedModels(category: string | null) {
  return useQuery({
    queryKey: ["category-related-models", category],
    enabled: !!category,
    queryFn: async () => {
      const { data } = await supabase
        .from("parts")
        .select("machine_model")
        .eq("part_category", category!)
        .gt("stock", 0)
        .not("machine_model", "is", null)
        .limit(500);
      const counts = new Map<string, number>();
      for (const r of data || []) {
        const m = (r.machine_model || "").trim();
        if (!m) continue;
        counts.set(m, (counts.get(m) || 0) + 1);
      }
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([model, count]) => ({ model, count }));
    },
  });
}
