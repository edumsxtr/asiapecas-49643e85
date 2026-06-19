import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MyQuote = {
  id: string;
  status: string;
  created_at: string;
  items: any;
  notes: string | null;
  status_history: any[];
  final_proposal_sale_id: string | null;
  converted_sale_id: string | null;
};

export function useMyQuotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-quotes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("id, status, created_at, items, notes, status_history, final_proposal_sale_id, converted_sale_id")
        .eq("auth_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MyQuote[];
    },
  });
}
