import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Upload, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useBlogCategories, useSavePost, slugifyTitle, type BlogPost } from "@/hooks/use-blog-posts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  post?: BlogPost;
  onSaved?: () => void;
}

export function BlogPostEditor({ post, onSaved }: Props) {
  const { data: cats = [] } = useBlogCategories();
  const save = useSavePost();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    excerpt: post?.excerpt || "",
    content_md: post?.content_md || "",
    cover_url: post?.cover_url || "",
    cover_storage_path: post?.cover_storage_path || "",
    category_slug: post?.category_slug || "",
    status: post?.status || "draft",
    tags: (post?.tags || []).join(", "),
    seo_title: post?.seo_title || "",
    seo_description: post?.seo_description || "",
    author_name: post?.author_name || "Ásia Peças & Máquinas",
  });

  const handleCoverUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `covers/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
      });
      if (error) throw error;
      const { data: signed } = await supabase.storage
        .from("blog-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (signed) {
        setForm((f) => ({ ...f, cover_url: signed.signedUrl, cover_storage_path: path }));
        toast.success("Capa enviada");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (publish?: boolean) => {
    if (!form.title.trim()) return toast.error("Título obrigatório");
    const slug = form.slug.trim() || slugifyTitle(form.title);
    const payload: any = {
      ...post,
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim() || null,
      content_md: form.content_md,
      cover_url: form.cover_url || null,
      cover_storage_path: form.cover_storage_path || null,
      category_slug: form.category_slug || null,
      status: publish ? "published" : form.status,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      author_name: form.author_name.trim() || null,
    };
    await save.mutateAsync(payload);
    onSaved?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">{post ? "Editar post" : "Novo post"}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={save.isPending} className="gap-2">
            <Save className="h-4 w-4" /> Salvar rascunho
          </Button>
          <Button onClick={() => handleSave(true)} disabled={save.isPending} className="gap-2">
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Publicar
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 space-y-3">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugifyTitle(e.target.value) })}
                placeholder="Como escolher filtro hidráulico para escavadeira XCMG"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugifyTitle(e.target.value) })} />
            </div>
            <div>
              <Label>Resumo (excerpt)</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
            </div>
          </Card>

          <Card className="p-4">
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">Editor</TabsTrigger>
                <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-3">
                <Textarea
                  value={form.content_md}
                  onChange={(e) => setForm({ ...form, content_md: e.target.value })}
                  rows={24}
                  className="font-mono text-sm"
                  placeholder="# Título\n\nConteúdo em Markdown..."
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-3">
                <div className="prose prose-neutral dark:prose-invert max-w-none min-h-[400px] p-3 border rounded-md">
                  <ReactMarkdown>{form.content_md || "_Nada para pré-visualizar_"}</ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <Label>Categoria</Label>
            <Select value={form.category_slug || "none"} onValueChange={(v) => setForm({ ...form, category_slug: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {cats.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Label>Tags (separadas por vírgula)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="filtros, manutenção, xcmg" />

            <Label>Autor</Label>
            <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
          </Card>

          <Card className="p-4 space-y-3">
            <Label>Imagem de capa</Label>
            {form.cover_url && (
              <div className="aspect-video rounded-md overflow-hidden bg-muted">
                <img src={form.cover_url} alt="Capa" className="w-full h-full object-cover" />
              </div>
            )}
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {form.cover_url ? "Trocar capa" : "Enviar capa"}
            </Button>
            <Input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
            />
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">SEO</h3>
            <Label>SEO Title (override)</Label>
            <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="Padrão: usa o título" />
            <Label>Meta description</Label>
            <Textarea
              value={form.seo_description}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              rows={3}
              maxLength={160}
            />
            <p className="text-[10px] text-muted-foreground">{form.seo_description.length}/160</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
