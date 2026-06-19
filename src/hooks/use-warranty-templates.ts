import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type WarrantyTemplate = {
  id: string;
  name: string;
  months: number;
  intro_text: string;
  conditions: string[];
  exclusions: string[];
  default_for_category: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export function useWarrantyTemplates(onlyActive = false) {
  return useQuery({
    queryKey: ["warranty-templates", onlyActive],
    queryFn: async () => {
      let q = supabase.from("warranty_templates").select("*").order("name");
      if (onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as WarrantyTemplate[];
    },
  });
}

export function useUpsertWarrantyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<WarrantyTemplate> & { name: string }) => {
      const { id, ...rest } = t;
      if (id) {
        const { error } = await supabase.from("warranty_templates").update(rest as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("warranty_templates").insert(rest as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warranty-templates"] });
      toast.success("Template de garantia salvo");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteWarrantyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("warranty_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warranty-templates"] });
      toast.success("Removido");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

/** Pick a template matching a part category (case-insensitive contains), or null. */
export function pickTemplateForCategory(
  templates: WarrantyTemplate[],
  category: string | null | undefined,
): WarrantyTemplate | null {
  if (!category) return templates.find(t => !t.default_for_category) || templates[0] || null;
  const c = category.toLowerCase();
  return (
    templates.find(t => t.default_for_category && c.includes(t.default_for_category.toLowerCase())) ||
    templates.find(t => !t.default_for_category) ||
    templates[0] ||
    null
  );
}
