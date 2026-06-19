import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ---------- Stock imports ----------
export function useUpdateStockImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; file_name?: string; source_label?: string; imported_at?: string }) => {
      const { id, ...patch } = p;
      const { error } = await supabase.from("stock_imports").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-imports"] }),
  });
}

export function useReprocessStockImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (import_id: string) => {
      const { data, error } = await supabase.functions.invoke("reprocess-stock-import", { body: { import_id } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-imports"] });
      qc.invalidateQueries({ queryKey: ["parts"] });
    },
  });
}

export function useRevertStockImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { import_id: string; delete_parts: boolean }) => {
      const { data, error } = await supabase.functions.invoke("revert-stock-import", { body: p });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-imports"] });
      qc.invalidateQueries({ queryKey: ["parts"] });
    },
  });
}

// ---------- Customer imports ----------
export function useCustomerImports() {
  return useQuery({
    queryKey: ["customer-imports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customer_imports").select("*").order("imported_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
export function useDeleteCustomerImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_imports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-imports"] }),
  });
}
export function useUpdateCustomerImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; file_name: string }) => {
      const { error } = await supabase.from("customer_imports").update({ file_name: p.file_name }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-imports"] }),
  });
}

// ---------- Parts bulk ----------
export interface PartsBulkFilter {
  manufacturer?: string;
  machine_model?: string;
  part_category?: string;
  no_manufacturer?: boolean;
  no_category?: boolean;
  zero_stock?: boolean;
  price_lte?: number;
  price_gte?: number;
}

function applyFilter<T>(qb: any, f: PartsBulkFilter) {
  if (f.manufacturer) qb = qb.eq("manufacturer", f.manufacturer);
  if (f.machine_model) qb = qb.eq("machine_model", f.machine_model);
  if (f.part_category) qb = qb.eq("part_category", f.part_category);
  if (f.no_manufacturer) qb = qb.or("manufacturer.is.null,manufacturer.eq.");
  if (f.no_category) qb = qb.or("part_category.is.null,part_category.eq.");
  if (f.zero_stock) qb = qb.lte("stock", 0);
  if (f.price_lte !== undefined) qb = qb.lte("estimated_price", f.price_lte);
  if (f.price_gte !== undefined) qb = qb.gte("estimated_price", f.price_gte);
  return qb;
}

export function usePartsBulkCount(filter: PartsBulkFilter, enabled: boolean) {
  return useQuery({
    queryKey: ["parts-bulk-count", filter],
    enabled,
    queryFn: async () => {
      let qb = supabase.from("parts").select("id", { count: "exact", head: true });
      qb = applyFilter(qb, filter);
      const { count, error } = await qb;
      if (error) throw error;
      return count || 0;
    },
  });
}

export function usePartsBulkDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (filter: PartsBulkFilter) => {
      let qb = supabase.from("parts").delete({ count: "exact" });
      qb = applyFilter(qb, filter);
      const { count, error } = await qb;
      if (error) throw error;
      return count || 0;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parts"] }),
  });
}

export function usePartsBulkZeroStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (filter: PartsBulkFilter) => {
      let qb = supabase.from("parts").update({ stock: 0 }, { count: "exact" });
      qb = applyFilter(qb, filter);
      const { count, error } = await qb;
      if (error) throw error;
      return count || 0;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parts"] }),
  });
}

// ---------- Research caches ----------
export function useMarketResearchSummary() {
  return useQuery({
    queryKey: ["market-research-summary"],
    queryFn: async () => {
      const { count: total } = await supabase.from("market_research").select("id", { count: "exact", head: true });
      const { data: recent } = await supabase
        .from("market_research")
        .select("id, distributor_name, price_found, researched_at, part_id, parts(material, description)")
        .order("researched_at", { ascending: false })
        .limit(20);
      return { total: total || 0, recent: recent || [] };
    },
  });
}

export function useAICompatSummary() {
  return useQuery({
    queryKey: ["ai-compat-summary"],
    queryFn: async () => {
      const { count: total } = await supabase.from("ai_compatibility_results").select("id", { count: "exact", head: true });
      const { data: recent } = await supabase
        .from("ai_compatibility_results")
        .select("id, material, model_used, researched_at")
        .order("researched_at", { ascending: false })
        .limit(20);
      return { total: total || 0, recent: recent || [] };
    },
  });
}

export function useClearResearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { table: "market_research" | "ai_compatibility_results"; before?: string; all?: boolean }) => {
      let qb = supabase.from(p.table).delete({ count: "exact" });
      if (p.all) {
        qb = qb.gte("researched_at", "1900-01-01");
      } else if (p.before) {
        qb = qb.lt("researched_at", p.before);
      } else {
        throw new Error("Specify before or all");
      }
      const { count, error } = await qb;
      if (error) throw error;
      return count || 0;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["market-research-summary"] });
      qc.invalidateQueries({ queryKey: ["ai-compat-summary"] });
    },
  });
}

export function useDeleteResearchRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { table: "market_research" | "ai_compatibility_results"; id: string }) => {
      const { error } = await supabase.from(p.table).delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["market-research-summary"] });
      qc.invalidateQueries({ queryKey: ["ai-compat-summary"] });
    },
  });
}
