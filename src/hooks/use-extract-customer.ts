import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ExtractedContact = {
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
};

export type ExtractedCustomer = {
  legal_name: string | null;
  trade_name: string | null;
  cnpj_cpf: string | null;
  state_registration: string | null;
  municipal_registration: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  segment: string | null;
  address: {
    street: string | null;
    number: string | null;
    complement: string | null;
    district: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  contacts: ExtractedContact[];
  notes: string | null;
};

export type ExtractInput =
  | { text: string }
  | { fileBase64: string; fileType: "pdf" | "docx"; fileName?: string };

export function useExtractCustomer() {
  return useMutation({
    mutationFn: async (input: ExtractInput): Promise<ExtractedCustomer> => {
      const { data, error } = await supabase.functions.invoke("extract-customer-from-document", {
        body: input,
      });
      if (error) {
        const msg = (data as { error?: string } | null)?.error || error.message;
        throw new Error(msg);
      }
      return (data as { data: ExtractedCustomer }).data;
    },
    onError: (e: Error) => toast.error("Erro ao extrair: " + e.message),
  });
}
