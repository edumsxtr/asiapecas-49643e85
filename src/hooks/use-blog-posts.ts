import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  cover_url: string | null;
  cover_storage_path: string | null;
  author_id: string | null;
  author_name: string | null;
  category_slug: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  tags: string[];
  related_part_ids: string[];
  seo_title: string | null;
  seo_description: string | null;
  views: number;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as BlogCategory[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function usePublishedPosts(opts: { category?: string; page?: number; pageSize?: number } = {}) {
  const { category, page = 0, pageSize = 12 } = opts;
  return useQuery({
    queryKey: ["blog-posts-published", category, page, pageSize],
    queryFn: async () => {
      let q = supabase
        .from("blog_posts")
        .select("*", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (category) q = q.eq("category_slug", category);
      q = q.range(page * pageSize, (page + 1) * pageSize - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return { posts: (data || []) as BlogPost[], count: count || 0 };
    },
  });
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: ["blog-post", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as BlogPost | null;
    },
  });
}

export function useAllPosts(opts: { page?: number; pageSize?: number; status?: string } = {}) {
  const { page = 0, pageSize = 20, status } = opts;
  return useQuery({
    queryKey: ["blog-posts-all", page, pageSize, status],
    queryFn: async () => {
      let q = supabase.from("blog_posts").select("*", { count: "exact" }).order("updated_at", { ascending: false });
      if (status) q = q.eq("status", status);
      q = q.range(page * pageSize, (page + 1) * pageSize - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return { posts: (data || []) as BlogPost[], count: count || 0 };
    },
  });
}

export function useSavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Partial<BlogPost> & { id?: string }) => {
      const payload: any = { ...post };
      if (payload.status === "published" && !payload.published_at) {
        payload.published_at = new Date().toISOString();
      }
      if (post.id) {
        const { data, error } = await supabase.from("blog_posts").update(payload).eq("id", post.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("blog_posts").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-posts-all"] });
      qc.invalidateQueries({ queryKey: ["blog-posts-published"] });
      toast.success("Post salvo");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-posts-all"] });
      qc.invalidateQueries({ queryKey: ["blog-posts-published"] });
      toast.success("Post excluído");
    },
  });
}

export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
