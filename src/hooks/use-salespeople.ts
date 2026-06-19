import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Salesperson = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  signature_url: string | null;
  active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export function useSalespeople(onlyActive = false) {
  return useQuery({
    queryKey: ["salespeople", onlyActive],
    queryFn: async () => {
      let q = supabase.from("salespeople").select("*").order("is_default", { ascending: false }).order("name");
      if (onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Salesperson[];
    },
  });
}

export function useDefaultSalesperson() {
  return useQuery({
    queryKey: ["salesperson-default"],
    queryFn: async () => {
      const { data } = await supabase.from("salespeople").select("*").eq("active", true).order("is_default", { ascending: false }).limit(1).maybeSingle();
      return data as Salesperson | null;
    },
  });
}

export function useUpsertSalesperson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<Salesperson> & { name: string }) => {
      const { id, ...rest } = s;
      if (id) {
        const { error } = await supabase.from("salespeople").update(rest as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("salespeople").insert(rest as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salespeople"] });
      qc.invalidateQueries({ queryKey: ["salesperson-default"] });
      toast.success("Vendedor salvo");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteSalesperson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salespeople").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salespeople"] });
      toast.success("Vendedor removido");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
