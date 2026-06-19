import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function recomputeSaleTotal(saleId: string) {
  const { data, error } = await supabase
    .from("sale_items")
    .select("total_price")
    .eq("sale_id", saleId);
  if (error) throw error;
  const total = (data || []).reduce((s, r: any) => s + Number(r.total_price || 0), 0);
  const { error: upErr } = await supabase
    .from("sales")
    .update({ total_amount: total })
    .eq("id", saleId);
  if (upErr) throw upErr;
  return total;
}

export function useUpdateSaleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      sale_id: string;
      quantity: number;
      unit_price: number;
    }) => {
      const total_price = Number((args.quantity * args.unit_price).toFixed(2));
      const { error } = await supabase
        .from("sale_items")
        .update({
          quantity: args.quantity,
          unit_price: args.unit_price,
          total_price,
        })
        .eq("id", args.id);
      if (error) throw error;
      await recomputeSaleTotal(args.sale_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Item atualizado");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteSaleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; sale_id: string }) => {
      const { error } = await supabase.from("sale_items").delete().eq("id", args.id);
      if (error) throw error;
      await recomputeSaleTotal(args.sale_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Item removido");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useAddSaleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      sale_id: string;
      part_id: string;
      quantity: number;
      unit_price: number;
    }) => {
      const total_price = Number((args.quantity * args.unit_price).toFixed(2));
      const { error } = await supabase.from("sale_items").insert({
        sale_id: args.sale_id,
        part_id: args.part_id,
        quantity: args.quantity,
        unit_price: args.unit_price,
        total_price,
      });
      if (error) throw error;
      await recomputeSaleTotal(args.sale_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Item adicionado");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
