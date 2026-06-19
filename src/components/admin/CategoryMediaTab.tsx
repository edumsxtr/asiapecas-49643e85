import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, ImagePlus, ImageOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PART_CATEGORIES } from "@/components/quote/part-categories";

type Media = { category: string; image_url: string | null; headline: string | null; description: string | null };

export function CategoryMediaTab() {
  const qc = useQueryClient();

  // categories detected from parts table + canonical list
  const { data: detected = [] } = useQuery({
    queryKey: ["distinct-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("parts").select("category").not("category", "is", null).limit(5000);
      const set = new Set<string>();
      (data || []).forEach((r: any) => r.category && set.add(r.category));
      return Array.from(set).sort();
    },
  });

  const { data: media = [] } = useQuery({
    queryKey: ["category_media_admin"],
    queryFn: async () => {
      const { data } = await supabase.from("category_media" as any).select("*");
      return ((data || []) as unknown) as Media[];
    },
  });

  const mediaMap = new Map(media.map(m => [m.category, m]));
  const canonical = PART_CATEGORIES.map(c => c.key);
  const all = Array.from(new Set([...canonical, ...detected])).sort();

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 text-sm space-y-1">
          <p className="font-semibold text-foreground">Imagem personalizada por categoria</p>
          <p className="text-xs text-muted-foreground">
            Suba uma imagem (recomendado <strong>1600×900</strong>) e defina título e descrição para cada categoria.
            Aparece no cabeçalho das páginas <code className="bg-background px-1 rounded">/cotacao/c/...</code> e nos cards da vitrine.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {all.map((category) => (
          <CategoryCard key={category} category={category} current={mediaMap.get(category)} onChange={() => qc.invalidateQueries({ queryKey: ["category_media_admin"] })} />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ category, current, onChange }: { category: string; current?: Media; onChange: () => void }) {
  const [m, setM] = useState<Media>(current || { category, image_url: null, headline: null, description: null });
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const safe = category.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
      const ext = file.name.split(".").pop();
      const path = `categories/${safe}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("vitrine").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("vitrine").getPublicUrl(path);
      setM(s => ({ ...s, image_url: data.publicUrl }));
    } catch (e: any) { toast.error("Erro no upload: " + e.message); }
    finally { setUploading(false); }
  };

  const save = async () => {
    const { error } = await supabase.from("category_media" as any).upsert({
      category: m.category,
      image_url: m.image_url,
      headline: m.headline,
      description: m.description,
    });
    if (error) toast.error("Erro ao salvar: " + error.message);
    else { toast.success("Salvo"); onChange(); }
  };

  const remove = async () => {
    if (!confirm(`Remover imagem personalizada de "${category}"?`)) return;
    const { error } = await supabase.from("category_media" as any).delete().eq("category", category);
    if (error) toast.error(error.message); else { toast.success("Removido"); setM({ category, image_url: null, headline: null, description: null }); onChange(); }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{category}</h3>
        </div>
        <div className="aspect-[16/9] w-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {m.image_url ? (
            <img src={m.image_url} alt={category} className="w-full h-full object-cover" />
          ) : (
            <ImageOff className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex gap-2 items-center">
          <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <div>
          <Label className="text-xs">Título</Label>
          <Input placeholder={category} value={m.headline || ""} onChange={(e) => setM({ ...m, headline: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Descrição</Label>
          <Textarea rows={2} placeholder="Breve descrição para SEO e cabeçalho" value={m.description || ""} onChange={(e) => setM({ ...m, description: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} className="flex-1 gap-1"><ImagePlus className="h-4 w-4" /> Salvar</Button>
          {current && <Button size="sm" variant="destructive" onClick={remove}>Remover</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
