import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PaymentTemplate = {
  id: string;
  name: string;
  kind: "cash" | "entry_installments" | "installments";
  entry_pct: number;
  installments: number;
  interval_days: number;
  discount_pct: number;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ScheduleEntry = {
  label: string;
  amount: number;
  due_date: string | null; // ISO date or null
};

export function usePaymentTemplates(onlyActive = false) {
  return useQuery({
    queryKey: ["payment-templates", onlyActive],
    queryFn: async () => {
      let q = supabase.from("payment_condition_templates").select("*").order("name");
      if (onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PaymentTemplate[];
    },
  });
}

export function useUpsertPaymentTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<PaymentTemplate> & { name: string }) => {
      const { id, ...rest } = t;
      if (id) {
        const { error } = await supabase.from("payment_condition_templates").update(rest as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_condition_templates").insert(rest as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-templates"] });
      toast.success("Template de pagamento salvo");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeletePaymentTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_condition_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-templates"] });
      toast.success("Removido");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

/** Compute payment schedule from a template + total + start date. */
export function buildSchedule(
  t: PaymentTemplate,
  total: number,
  startDate: Date = new Date(),
): { schedule: ScheduleEntry[]; finalTotal: number; discount: number } {
  const discount = total * (t.discount_pct / 100);
  const finalTotal = total - discount;
  const schedule: ScheduleEntry[] = [];

  if (t.kind === "cash") {
    schedule.push({ label: "À vista", amount: finalTotal, due_date: startDate.toISOString().slice(0, 10) });
  } else if (t.kind === "entry_installments") {
    const entryAmount = finalTotal * (t.entry_pct / 100);
    const remaining = finalTotal - entryAmount;
    const perInstallment = t.installments > 0 ? remaining / t.installments : 0;
    schedule.push({
      label: `Entrada ${t.entry_pct}% - na aprovação`,
      amount: entryAmount,
      due_date: startDate.toISOString().slice(0, 10),
    });
    for (let i = 1; i <= t.installments; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i * t.interval_days);
      schedule.push({
        label: `${i}º boleto`,
        amount: perInstallment,
        due_date: d.toISOString().slice(0, 10),
      });
    }
  } else {
    // installments
    const per = t.installments > 0 ? finalTotal / t.installments : finalTotal;
    for (let i = 1; i <= t.installments; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i * t.interval_days);
      schedule.push({
        label: `${i}ª parcela`,
        amount: per,
        due_date: d.toISOString().slice(0, 10),
      });
    }
  }
  return { schedule, finalTotal, discount };
}
