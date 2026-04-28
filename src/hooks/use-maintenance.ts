import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Machine = {
  id: string;
  category: string;
  model: string;
  serial: string | null;
  notes: string | null;
};

export type PlanItem = {
  id: string;
  machine_id: string;
  group_name: string;
  description: string;
  material: string;
  substitute_codes: string[];
  quantity: number;
  interval_hours: number;
  sort_order: number;
};

export function useMachines() {
  return useQuery({
    queryKey: ["maintenance-machines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_machines")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data || []) as Machine[];
    },
  });
}

export function usePlanItems(machineId: string | null) {
  return useQuery({
    queryKey: ["maintenance-items", machineId],
    enabled: !!machineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_plan_items")
        .select("*")
        .eq("machine_id", machineId!)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as PlanItem[];
    },
  });
}

export function useStockMap(materials: string[]) {
  return useQuery({
    queryKey: ["maintenance-stock", materials.sort().join(",")],
    enabled: materials.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("id, material, description, stock, estimated_price")
        .in("material", materials);
      if (error) throw error;
      const map = new Map<string, { id: string; description: string; stock: number; price: number }>();
      for (const p of data || []) {
        map.set(p.material, {
          id: p.id,
          description: p.description,
          stock: p.stock || 0,
          price: Number(p.estimated_price) || 0,
        });
      }
      return map;
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<PlanItem> & { id: string }) => {
      const { error } = await supabase.from("maintenance_plan_items").update(item).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-items"] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maintenance_plan_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-items"] }),
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<PlanItem, "id">) => {
      const { error } = await supabase.from("maintenance_plan_items").insert(item);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-items"] }),
  });
}

export async function runSeedMaintenance() {
  const { data, error } = await supabase.functions.invoke("seed-maintenance");
  if (error) throw error;
  return data;
}
