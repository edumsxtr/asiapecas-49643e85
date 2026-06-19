import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type WarrantyAIResult = {
  months: number;
  suggested_name: string;
  intro_text: string;
  conditions: string[];
  exclusions: string[];
};

export type WarrantyAIInput = {
  material?: string | null;
  description?: string | null;
  part_category?: string | null;
  subcategory?: string | null;
  manufacturer?: string | null;
  machine_model?: string | null;
  condition?: string | null;
};

export function useGenerateWarrantyAI() {
  return useMutation({
    mutationFn: async (input: WarrantyAIInput): Promise<WarrantyAIResult> => {
      const { data, error } = await supabase.functions.invoke("generate-warranty", { body: input });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data as WarrantyAIResult;
    },
    onError: (e: Error) => toast.error("Erro ao gerar garantia: " + e.message),
  });
}
