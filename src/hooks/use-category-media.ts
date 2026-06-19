import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CategoryMedia = {
  category: string;
  image_url: string | null;
  headline: string | null;
  description: string | null;
};

export function useAllCategoryMedia() {
  return useQuery({
    queryKey: ["category_media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("category_media" as any).select("*");
      if (error) throw error;
      return ((data || []) as unknown) as CategoryMedia[];
    },
    staleTime: 60_000,
  });
}

export function useCategoryMedia(category: string | null | undefined) {
  return useQuery({
    queryKey: ["category_media", category],
    enabled: !!category,
    queryFn: async () => {
      const { data } = await supabase.from("category_media" as any).select("*").eq("category", category!).maybeSingle();
      return (data as unknown) as CategoryMedia | null;
    },
    staleTime: 60_000,
  });
}
