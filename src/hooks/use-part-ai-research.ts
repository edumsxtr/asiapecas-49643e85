import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PartAIAnalysis {
  technical_description: string;
  probable_function: string;
  compatible_machines: string[];
  technical_specs: string[];
  maintenance_tips: string;
  related_parts: string[];
  catalog_related?: { material: string; description: string; machine_model: string; stock: number; estimated_price: number }[];
}

export function usePartAIResearch() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PartAIAnalysis | null>(null);

  const research = async (material: string) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("part-research", {
        body: { material },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data as PartAIAnalysis);
    } catch (e: any) {
      toast.error(e.message || "Erro na pesquisa com IA");
    } finally {
      setLoading(false);
    }
  };

  return { research, loading, analysis, clear: () => setAnalysis(null) };
}
