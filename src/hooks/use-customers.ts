import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Customer = {
  id: string;
  name: string;
  company: string | null;
  cnpj_cpf: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  segment: string | null;
  notes: string | null;
  country: string | null;
  source: string | null;
  interest_models: string[] | null;
  relationship_status: string | null;
  last_visit_at: string | null;
  last_proposal_at: string | null;
  total_invoiced: number | null;
  enrichment_status: string | null;
  enriched_at: string | null;
  enrichment_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type CustomerInsert = Partial<Omit<Customer, "id" | "created_at" | "updated_at">> & { name: string };

export type CustomerEquipment = {
  id: string;
  customer_id: string;
  model: string | null;
  serial_number: string | null;
  order_form: string | null;
  delivery_location: string | null;
  purchase_year: number | null;
  sale_value: number | null;
  notes: string | null;
  created_at: string;
};

export type CustomerInvoice = {
  id: string;
  customer_id: string;
  document_number: string | null;
  payment_terms: string | null;
  payer_name: string | null;
  invoice_date: string | null;
  total_value: number;
  source: string | null;
  created_at: string;
};

export type CustomerImport = {
  id: string;
  file_name: string;
  imported_at: string;
  total_rows: number;
  inserted: number;
  updated: number;
  skipped: number;
  status: string;
  report: Record<string, unknown> | null;
};

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      let query = supabase.from("customers").select("*").order("name");
      if (search) {
        query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,cnpj_cpf.ilike.%${search}%`);
      }
      const { data, error } = await query.limit(2000);
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCustomerById(id: string | null | undefined) {
  return useQuery({
    queryKey: ["customer", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Customer;
    },
  });
}

export function useCustomerEquipment(customerId: string | null | undefined) {
  return useQuery({
    queryKey: ["customer-equipment", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_equipment")
        .select("*")
        .eq("customer_id", customerId!)
        .order("purchase_year", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as CustomerEquipment[];
    },
  });
}

export function useCustomerInvoices(customerId: string | null | undefined) {
  return useQuery({
    queryKey: ["customer-invoices", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("*")
        .eq("customer_id", customerId!)
        .order("invoice_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as CustomerInvoice[];
    },
  });
}

export type EquipmentInsert = Partial<Omit<CustomerEquipment, "id" | "created_at">> & { customer_id: string };
export type InvoiceInsert = Partial<Omit<CustomerInvoice, "id" | "created_at">> & { customer_id: string; total_value: number };

export function useUpsertEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<CustomerEquipment> & { customer_id: string }) => {
      if (id) {
        const { error } = await supabase.from("customer_equipment").update(rest as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_equipment").insert(rest as never);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["customer-equipment", vars.customer_id] });
      toast.success("Equipamento salvo");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; customer_id: string }) => {
      const { error } = await supabase.from("customer_equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["customer-equipment", vars.customer_id] });
      toast.success("Equipamento removido");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpsertInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<CustomerInvoice> & { customer_id: string; total_value: number }) => {
      if (id) {
        const { error } = await supabase.from("customer_invoices").update(rest as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_invoices").insert(rest as never);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["customer-invoices", vars.customer_id] });
      qc.invalidateQueries({ queryKey: ["customer", vars.customer_id] });
      toast.success("Nota fiscal salva");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; customer_id: string }) => {
      const { error } = await supabase.from("customer_invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["customer-invoices", vars.customer_id] });
      qc.invalidateQueries({ queryKey: ["customer", vars.customer_id] });
      toast.success("Nota fiscal removida");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      const { data, error } = await supabase.from("customers").insert(customer as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente criado com sucesso");
    },
    onError: (e: Error) => toast.error("Erro ao criar cliente: " + e.message),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { error } = await supabase.from("customers").update(updates as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", vars.id] });
      toast.success("Cliente atualizado");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente removido");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export type ImportPayload = {
  file_name: string;
  customers: Array<Record<string, unknown>>;
  equipment: Array<Record<string, unknown>>;
  invoices: Array<Record<string, unknown>>;
  brasim_leads: Array<Record<string, unknown>>;
  update_existing: boolean;
};

export function useImportCustomers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ImportPayload) => {
      const { data, error } = await supabase.functions.invoke("import-customers", { body: payload });
      if (error) throw error;
      return data as {
        import_id: string;
        inserted: number;
        updated: number;
        skipped: number;
        equipment_inserted: number;
        invoices_inserted: number;
      };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success(`Importação concluída: ${r.inserted} novos, ${r.updated} atualizados`);
    },
    onError: (e: Error) => toast.error("Erro na importação: " + e.message),
  });
}

export function useEnrichCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer_id: string) => {
      const { data, error } = await supabase.functions.invoke("enrich-customer", { body: { customer_id } });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", id] });
      toast.success("Cliente enriquecido com IA");
    },
    onError: (e: Error) => toast.error("Erro no enriquecimento: " + e.message),
  });
}

export type PreviewMatch = {
  customer_id: string; name: string; score: number; reason: string;
  existing: { cnpj_cpf: string | null; email: string | null; phone: string | null; city: string | null; state: string | null; company: string | null };
};
export type PreviewResult = { row_index: number; status: "new" | "match" | "ambiguous"; matches: PreviewMatch[] };

export function usePreviewImport() {
  return useMutation({
    mutationFn: async (rows: Array<Record<string, unknown>>) => {
      const payload = rows.map((r, i) => ({ row_index: i, ...r }));
      const { data, error } = await supabase.functions.invoke("preview-customer-import", { body: { rows: payload } });
      if (error) throw error;
      return (data as { results: PreviewResult[] }).results;
    },
    onError: (e: Error) => toast.error("Erro no preview: " + e.message),
  });
}

export function useProspectFromCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer_ids: string[]) => {
      const { data, error } = await supabase.functions.invoke("prospect-from-customer", { body: { customer_ids } });
      if (error) throw error;
      return data as { created: Array<{ customer_id: string; prospect_id: string; score: number }>; failed: Array<{ customer_id: string; error: string }> };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["prospects"] });
      qc.invalidateQueries({ queryKey: ["customer-prospects"] });
      toast.success(`${r.created.length} prospects gerados${r.failed.length ? `, ${r.failed.length} falhas` : ""}`);
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
