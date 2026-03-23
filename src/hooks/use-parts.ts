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

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return formatBRL(value);
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
        query = (query as any).eq(category, true);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { parts: (data ?? []) as Part[], total: count ?? 0 };
    },
  });
}

export interface DashboardStats {
  totalParts: number;
  totalSkuRows: number;
  totalStock: number;
  totalValue: number;
  avgPrice: number;
  maxPrice: number;
  minPrice: number;
  staleStock: number;
  staleValue: number;
  staleUnits: number;
  lowStockHighValue: number;
  byCategory: { name: string; quantidade: number; units: number; value: number }[];
  byTime: { name: string; quantidade: number; units: number; value: number }[];
  byManufacturer: { name: string; quantidade: number; units: number; value: number }[];
  topModels: { name: string; quantidade: number; units: number; value: number }[];
  criticalParts: { material: string; description: string; stock: number; estimated_price: number; machine_model: string; last_entry_time: string }[];
  staleParts: { material: string; description: string; stock: number; estimated_price: number; machine_model: string; total_value: number }[];
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats");
      if (error) throw error;
      return data as unknown as DashboardStats;
    },
    staleTime: 60_000,
  });
}
