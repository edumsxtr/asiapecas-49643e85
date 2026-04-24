import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-role";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Upload, Loader2, ShieldAlert, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminVitrinePage() {
  const isAdmin = useIsAdmin();
  const { user } = useAuth();

  if (!user) return <AppLayout><div className="p-6">Faça login.</div></AppLayout>;
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Acesso restrito</h1>
          <p className="text-muted-foreground">Você precisa ter a função <code className="bg-muted px-1.5 py-0.5 rounded">admin</code> para gerenciar a vitrine. Peça a um administrador para te adicionar via tabela <code className="bg-muted px-1.5 py-0.5 rounded">user_roles</code>.</p>
          <p className="text-xs text-muted-foreground">Seu user id: <code className="bg-muted px-1.5 py-0.5 rounded">{user.id}</code></p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk']">Vitrine — Loja Pública</h1>
          <p className="text-sm text-muted-foreground">Configure banners, destaques, coleções e tracking que aparecem em <code className="bg-muted px-1 rounded">/cotacao</code>.</p>
        </div>

        <Tabs defaultValue="banners">
          <TabsList>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="featured">Destaques</TabsTrigger>
            <TabsTrigger value="settings">Tracking & Settings</TabsTrigger>
            <TabsTrigger value="leads">Leads B2B</TabsTrigger>
          </TabsList>

          <TabsContent value="banners" className="mt-4"><BannersPanel /></TabsContent>
          <TabsContent value="featured" className="mt-4"><FeaturedPanel /></TabsContent>
          <TabsContent value="settings" className="mt-4"><SettingsPanel /></TabsContent>
          <TabsContent value="leads" className="mt-4"><LeadsPanel /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// ---------------- Banners ----------------
function BannersPanel() {
  const qc = useQueryClient();
  const { data: banners } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data } = await supabase.from("vitrine_banners").select("*").order("sort_order");
      return data || [];
    },
  });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `banners/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("vitrine").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("vitrine").getPublicUrl(path);
      return data.publicUrl;
    } catch (e: any) { toast.error(e.message); return null; }
    finally { setUploading(false); }
  };

  const create = async () => {
    const { error } = await supabase.from("vitrine_banners").insert({ image_url: "", title: "Novo banner", lang: "pt", sort_order: (banners?.length || 0) });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-banners"] });
  };

  return (
    <div className="space-y-4">
      <Button onClick={create} className="gap-2"><Plus className="h-4 w-4" />Novo banner</Button>
      <div className="grid md:grid-cols-2 gap-4">
        {(banners || []).map((b: any) => (
          <BannerCard key={b.id} banner={b} onUpload={handleUpload} uploading={uploading} onChange={() => qc.invalidateQueries({ queryKey: ["admin-banners"] })} />
        ))}
        {banners?.length === 0 && <p className="text-sm text-muted-foreground col-span-2">Nenhum banner. Crie o primeiro.</p>}
      </div>
    </div>
  );
}

function BannerCard({ banner, onUpload, uploading, onChange }: any) {
  const [b, setB] = useState(banner);
  const save = async () => {
    const { error } = await supabase.from("vitrine_banners").update({
      image_url: b.image_url, title: b.title, subtitle: b.subtitle, cta_label: b.cta_label, cta_link: b.cta_link, lang: b.lang, sort_order: b.sort_order, active: b.active,
    }).eq("id", b.id);
    if (error) toast.error(error.message); else { toast.success("Salvo"); onChange(); }
  };
  const remove = async () => {
    if (!confirm("Excluir este banner?")) return;
    await supabase.from("vitrine_banners").delete().eq("id", b.id);
    onChange();
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {b.image_url && <img src={b.image_url} alt="" className="w-full h-32 object-cover rounded" />}
        <div className="flex gap-2">
          <Input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await onUpload(f); if (url) setB({ ...b, image_url: url }); } }} />
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <Input placeholder="Título" value={b.title || ""} onChange={(e) => setB({ ...b, title: e.target.value })} />
        <Input placeholder="Subtítulo" value={b.subtitle || ""} onChange={(e) => setB({ ...b, subtitle: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="CTA texto" value={b.cta_label || ""} onChange={(e) => setB({ ...b, cta_label: e.target.value })} />
          <Input placeholder="CTA link (#pecas, /cotacao/c/...)" value={b.cta_link || ""} onChange={(e) => setB({ ...b, cta_link: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="Idioma (pt/en/es/all)" value={b.lang} onChange={(e) => setB({ ...b, lang: e.target.value })} />
          <Input type="number" placeholder="Ordem" value={b.sort_order} onChange={(e) => setB({ ...b, sort_order: Number(e.target.value) })} />
          <div className="flex items-center gap-2"><Switch checked={b.active} onCheckedChange={(v) => setB({ ...b, active: v })} /><span className="text-xs">Ativo</span></div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} className="flex-1">Salvar</Button>
          <Button size="sm" variant="destructive" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- Featured ----------------
function FeaturedPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: featured } = useQuery({
    queryKey: ["admin-featured"],
    queryFn: async () => {
      const { data } = await supabase.from("vitrine_featured_parts")
        .select("id, badge_label, sort_order, active, part:parts(id, material, description)")
        .order("sort_order");
      return data || [];
    },
  });

  const { data: searchResults } = useQuery({
    queryKey: ["search-parts", search],
    enabled: search.length >= 2,
    queryFn: async () => {
      const { data } = await supabase.from("parts").select("id, material, description")
        .or(`material.ilike.%${search}%,description.ilike.%${search}%`).limit(10);
      return data || [];
    },
  });

  const add = async (part_id: string) => {
    await supabase.from("vitrine_featured_parts").insert({ part_id, sort_order: (featured?.length || 0), badge_label: "Destaque" });
    qc.invalidateQueries({ queryKey: ["admin-featured"] });
    setSearch("");
  };
  const update = async (id: string, patch: any) => {
    await supabase.from("vitrine_featured_parts").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-featured"] });
  };
  const remove = async (id: string) => {
    await supabase.from("vitrine_featured_parts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-featured"] });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Adicionar peça destaque</CardTitle></CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por código ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {searchResults && searchResults.length > 0 && (
            <div className="mt-2 border rounded divide-y max-h-60 overflow-y-auto">
              {searchResults.map((p: any) => (
                <button key={p.id} onClick={() => add(p.id)} className="w-full text-left p-2 hover:bg-muted text-sm flex justify-between items-center">
                  <span><Badge variant="outline" className="font-mono mr-2">{p.material}</Badge>{p.description}</span>
                  <Plus className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {(featured || []).map((f: any) => (
          <Card key={f.id}>
            <CardContent className="p-3 flex items-center gap-3">
              <Badge variant="outline" className="font-mono">{f.part?.material}</Badge>
              <span className="flex-1 text-sm truncate">{f.part?.description}</span>
              <Input className="w-32 h-8" placeholder="Badge" defaultValue={f.badge_label || ""} onBlur={(e) => update(f.id, { badge_label: e.target.value })} />
              <Input className="w-20 h-8" type="number" defaultValue={f.sort_order} onBlur={(e) => update(f.id, { sort_order: Number(e.target.value) })} />
              <Switch checked={f.active} onCheckedChange={(v) => update(f.id, { active: v })} />
              <Button size="icon" variant="ghost" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------- Settings ----------------
function SettingsPanel() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["admin-vitrine-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("vitrine_settings").select("*").maybeSingle();
      return data;
    },
  });
  const [s, setS] = useState<any>(null);
  if (settings && !s) setS(settings);

  const save = async () => {
    if (!s) return;
    const { error } = await supabase.from("vitrine_settings").update({
      gtm_id: s.gtm_id, ga4_id: s.ga4_id, ads_conversion_id: s.ads_conversion_id, ads_conversion_label: s.ads_conversion_label, meta_pixel_id: s.meta_pixel_id, b2b_whatsapp: s.b2b_whatsapp,
    }).eq("id", s.id);
    if (error) toast.error(error.message); else { toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin-vitrine-settings"] }); }
  };
  if (!s) return <p>Carregando...</p>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Tracking & Configurações</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div><Label>Google Tag Manager ID (ex: GTM-XXXXXX)</Label><Input value={s.gtm_id || ""} onChange={(e) => setS({ ...s, gtm_id: e.target.value })} /></div>
        <div><Label>GA4 Measurement ID (ex: G-XXXXXXX)</Label><Input value={s.ga4_id || ""} onChange={(e) => setS({ ...s, ga4_id: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Google Ads Conversion ID (AW-...)</Label><Input value={s.ads_conversion_id || ""} onChange={(e) => setS({ ...s, ads_conversion_id: e.target.value })} /></div>
          <div><Label>Conversion Label</Label><Input value={s.ads_conversion_label || ""} onChange={(e) => setS({ ...s, ads_conversion_label: e.target.value })} /></div>
        </div>
        <div><Label>Meta Pixel ID</Label><Input value={s.meta_pixel_id || ""} onChange={(e) => setS({ ...s, meta_pixel_id: e.target.value })} /></div>
        <div><Label>WhatsApp B2B (com DDI, sem +)</Label><Input value={s.b2b_whatsapp || ""} onChange={(e) => setS({ ...s, b2b_whatsapp: e.target.value })} /></div>
        <Button onClick={save}>Salvar</Button>
      </CardContent>
    </Card>
  );
}

// ---------------- Leads ----------------
function LeadsPanel() {
  const { data: leads } = useQuery({
    queryKey: ["admin-b2b-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("b2b_leads").select("*").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });
  return (
    <div className="space-y-2">
      {(leads || []).map((l: any) => (
        <Card key={l.id}><CardContent className="p-3 text-sm">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-semibold">{l.name} {l.company && <span className="text-muted-foreground">— {l.company}</span>}</p>
              <p className="text-xs text-muted-foreground">{l.phone} {l.email && `· ${l.email}`} {l.cnpj && `· ${l.cnpj}`}</p>
              {l.segment && <p className="text-xs">Segmento: {l.segment}</p>}
              {l.estimated_volume && <p className="text-xs">Volume: {l.estimated_volume}</p>}
              {l.message && <p className="text-xs mt-1 italic text-muted-foreground">"{l.message}"</p>}
              {l.utm && Object.keys(l.utm).length > 0 && <p className="text-[10px] font-mono mt-1 text-muted-foreground/70">{JSON.stringify(l.utm)}</p>}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </CardContent></Card>
      ))}
      {leads?.length === 0 && <p className="text-sm text-muted-foreground">Sem leads B2B ainda.</p>}
    </div>
  );
}
