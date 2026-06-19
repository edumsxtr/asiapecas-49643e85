import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CustomerContact = {
  id: string;
  customer_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function useCustomerContacts(customerId: string | null | undefined) {
  return useQuery({
    queryKey: ["customer-contacts", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_contacts")
        .select("*")
        .eq("customer_id", customerId!)
        .order("is_primary", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data || []) as CustomerContact[];
    },
  });
}

export function useUpsertCustomerContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<CustomerContact> & { customer_id: string; name: string }) => {
      const { id, ...rest } = c;
      if (id) {
        const { error } = await supabase.from("customer_contacts").update(rest as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_contacts").insert(rest as never);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["customer-contacts", vars.customer_id] });
      toast.success("Contato salvo");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteCustomerContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; customer_id: string }) => {
      const { error } = await supabase.from("customer_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["customer-contacts", vars.customer_id] });
      toast.success("Contato removido");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
