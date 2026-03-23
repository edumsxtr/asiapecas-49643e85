import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Part = Tables<"parts">;

export const categoryLabels: Record<string, string> = {
  is_mineracao: "Mineração",
  is_linha_amarela: "Linha Amarela",
  is_perfuratriz: "Perfuratriz",
  is_caminhao_eletrico: "Caminhão Elétrico",
  is_guindaste: "Guindaste",
};

export const categoryKeys = Object.keys(categoryLabels);

export const timeLabels = [
  "6 até 12 meses",
  "1 ano até 2 anos",
  "mais de 2 anos",
];

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getActiveCategories(part: Part): string[] {
  return categoryKeys
    .filter((key) => part[key as keyof Part] === true)
    .map((key) => categoryLabels[key]);
}

interface UsePartsOptions {
  search?: string;
  category?: string | null;
  page?: number;
  pageSize?: number;
}

export function useParts({ search, category, page = 0, pageSize = 50 }: UsePartsOptions = {}) {
  return useQuery({
    queryKey: ["parts", search, category, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("parts")
        .select("*", { count: "exact" })
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("stock", { ascending: false });

      if (search) {
        const q = `%${search}%`;
        query = query.or(`description.ilike.${q},material.ilike.${q},machine_model.ilike.${q}`);
      }

      if (category) {
        query = query.eq(category as any, true);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { parts: data as Part[], total: count ?? 0 };
    },
  });
}

export function usePartsStats() {
  return useQuery({
    queryKey: ["parts-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_parts_stats" as any);
      // Fallback: compute client-side from a summary query
      if (error) {
        // Get counts via multiple queries
        const [totalRes, staleRes, catRes, timeRes] = await Promise.all([
          supabase.from("parts").select("stock,estimated_price", { count: "exact" }),
          supabase.from("parts").select("id", { count: "exact" }).eq("last_entry_time", "mais de 2 anos"),
          Promise.all(
            categoryKeys.map(async (key) => {
              const { count } = await supabase.from("parts").select("id", { count: "exact" }).eq(key as any, true);
              return { key, count: count ?? 0 };
            })
          ),
          Promise.all(
            timeLabels.map(async (label) => {
              const { count } = await supabase.from("parts").select("id", { count: "exact" }).eq("last_entry_time", label);
              return { name: label, value: count ?? 0 };
            })
          ),
        ]);

        const parts = totalRes.data ?? [];
        const totalParts = totalRes.count ?? 0;
        const totalStock = parts.reduce((acc, p) => acc + (p.stock ?? 0), 0);
        const totalValue = parts.reduce((acc, p) => acc + (p.stock ?? 0) * (p.estimated_price ?? 0), 0);

        return {
          totalParts,
          totalStock,
          totalValue,
          staleStock: staleRes.count ?? 0,
          byCategory: catRes.map((c) => ({ name: categoryLabels[c.key], quantidade: c.count })),
          byTime: timeRes,
        };
      }
      return data;
    },
    staleTime: 60_000,
  });
}
