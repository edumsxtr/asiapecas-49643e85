import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StockAnalytics {
  generatedAt: string;
  kpis: {
    totalSkus: number;
    totalUnits: number;
    totalValue: number;
    avgPrice: number;
    staleValue: number;
    staleSkus: number;
    healthyValue: number;
    neverSoldSkus: number;
    soldSkus: number;
    uncategorizedValue: number;
    accessoriesValue: number;
    accessoriesSkus: number;
  };
  byCategory: Array<{
    category: string;
    skus: number;
    units: number;
    value: number;
    avg_price: number;
    stale_value: number;
    mid_value: number;
    fresh_value: number;
    stale_skus: number;
  }>;
  byTime: Array<{ period: string; skus: number; units: number; value: number }>;
  byManufacturer: Array<{
    manufacturer: string;
    skus: number;
    units: number;
    value: number;
    stale_value: number;
  }>;
  manufacturerCategoryHeatmap: Array<{
    manufacturer: string;
    category: string;
    value: number;
    stale_value: number;
  }>;
  topStaleParts: Array<{
    id: string;
    material: string;
    description: string;
    manufacturer: string | null;
    machine_model: string | null;
    part_category: string | null;
    stock: number;
    estimated_price: number;
    total_value: number;
    last_entry_time: string | null;
  }>;
  bcgSample: Array<{
    id: string;
    material: string;
    description: string;
    part_category: string | null;
    manufacturer: string | null;
    stock: number;
    estimated_price: number;
    sold_12m: number;
  }>;
  dataHealth: {
    noManufacturer: number;
    noModel: number;
    noCategory: number;
    shortDescription: number;
    duplicateGroups: number;
    zeroPrice: number;
    zeroStock: number;
  };
}

export function useStockAnalytics() {
  return useQuery({
    queryKey: ["stock-analytics"],
    queryFn: async (): Promise<StockAnalytics> => {
      const { data, error } = await supabase.rpc("get_stock_analytics" as never);
      if (error) throw error;
      return data as unknown as StockAnalytics;
    },
    staleTime: 60_000,
  });
}

/** Health score 0-100 — quanto maior, mais saudável a categoria. */
export function categoryHealthScore(c: {
  value: number;
  stale_value: number;
  stale_skus: number;
  skus: number;
}, totalValue: number): number {
  const stalePct = c.value > 0 ? c.stale_value / c.value : 0;
  const noSalesPct = c.skus > 0 ? c.stale_skus / c.skus : 0;
  const concentration = totalValue > 0 ? c.value / totalValue : 0;
  const concentrationPenalty = concentration > 0.3 ? (concentration - 0.3) * 100 : 0;
  const score = 100 - stalePct * 50 - noSalesPct * 30 - concentrationPenalty * 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function categoryVerdict(score: number): { label: string; tone: "good" | "warn" | "bad"; emoji: string } {
  if (score >= 70) return { label: "Vale a pena", tone: "good", emoji: "🟢" };
  if (score >= 40) return { label: "Otimizar", tone: "warn", emoji: "🟡" };
  return { label: "Liquidar", tone: "bad", emoji: "🔴" };
}
