import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PartImage {
  id: string;
  part_id: string;
  url: string;
  storage_path: string | null;
  position: number;
  is_primary: boolean;
  alt_text: string | null;
  width: number | null;
  height: number | null;
}

const SIGNED_EXPIRY = 60 * 60 * 24 * 365 * 5; // 5 years

export function usePartImages(partId: string | undefined) {
  return useQuery({
    queryKey: ["part-images", partId],
    enabled: !!partId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("part_images")
        .select("*")
        .eq("part_id", partId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data || []) as PartImage[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Bulk fetch primary image + count per part for cards */
export function usePartImagesSummary(partIds: string[]) {
  return useQuery({
    queryKey: ["part-images-summary", partIds.sort().join(",")],
    enabled: partIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("part_images")
        .select("part_id, url, is_primary, position")
        .in("part_id", partIds)
        .order("position", { ascending: true });
      if (error) throw error;
      const map: Record<string, { primary: string | null; count: number }> = {};
      for (const row of data || []) {
        if (!map[row.part_id]) map[row.part_id] = { primary: null, count: 0 };
        map[row.part_id].count++;
        if (!map[row.part_id].primary || row.is_primary) {
          map[row.part_id].primary = row.url;
        }
      }
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUploadPartImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ partId, material, file, altText }: { partId: string; material: string; file: File; altText?: string }) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `parts/${material}/${filename}`;
      const { error: upErr } = await supabase.storage.from("part-images").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("part-images")
        .createSignedUrl(path, SIGNED_EXPIRY);
      if (signErr) throw signErr;

      // Determine next position
      const { count } = await supabase
        .from("part_images")
        .select("id", { count: "exact", head: true })
        .eq("part_id", partId);

      const position = count || 0;
      const isPrimary = position === 0;

      const { data, error } = await supabase
        .from("part_images")
        .insert({
          part_id: partId,
          url: signed.signedUrl,
          storage_path: path,
          position,
          is_primary: isPrimary,
          alt_text: altText || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["part-images", vars.partId] });
      qc.invalidateQueries({ queryKey: ["part-images-summary"] });
      toast.success("Imagem enviada");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao enviar imagem"),
  });
}

export function useDeletePartImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (img: PartImage) => {
      if (img.storage_path) {
        await supabase.storage.from("part-images").remove([img.storage_path]);
      }
      const { error } = await supabase.from("part_images").delete().eq("id", img.id);
      if (error) throw error;
      return img;
    },
    onSuccess: (img) => {
      qc.invalidateQueries({ queryKey: ["part-images", img.part_id] });
      qc.invalidateQueries({ queryKey: ["part-images-summary"] });
      toast.success("Imagem removida");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover"),
  });
}

export function useSetPrimaryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (img: PartImage) => {
      await supabase.from("part_images").update({ is_primary: false }).eq("part_id", img.part_id);
      const { error } = await supabase.from("part_images").update({ is_primary: true }).eq("id", img.id);
      if (error) throw error;
      return img;
    },
    onSuccess: (img) => {
      qc.invalidateQueries({ queryKey: ["part-images", img.part_id] });
      qc.invalidateQueries({ queryKey: ["part-images-summary"] });
    },
  });
}

export function useReorderPartImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ partId, orderedIds }: { partId: string; orderedIds: string[] }) => {
      await Promise.all(
        orderedIds.map((id, idx) =>
          supabase.from("part_images").update({ position: idx }).eq("id", id)
        )
      );
      return partId;
    },
    onSuccess: (partId) => {
      qc.invalidateQueries({ queryKey: ["part-images", partId] });
    },
  });
}
