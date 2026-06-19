import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CustomerProposal = {
  id: string;
  proposal_number: string | null;
  sale_date: string;
  status: string;
  proposal_status: string;
  total_amount: number;
  validity_days: number | null;
  created_at: string;
};

export function useCustomerProposals(customerId: string | null | undefined) {
  return useQuery({
    queryKey: ["customer-proposals", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, proposal_number, sale_date, status, proposal_status, total_amount, validity_days, created_at")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CustomerProposal[];
    },
  });
}
