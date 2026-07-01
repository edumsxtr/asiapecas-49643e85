import { useState, useEffect } from "react";
import { partImage } from "@/lib/default-part-image";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, SlidersHorizontal, X,
  LayoutGrid, List, ShoppingCart, Eye,
  Zap, Circle, ChevronDown, ChevronUp,
} from "lucide-react";
import QuotePartCard from "./QuotePartCard";
import QuotePartDetail from "./QuotePartDetail";
import CategoryGroupedView from "./CategoryGroupedView";
import { useAuth } from "@/contexts/AuthContext";
import { type Lang, tr } from "./translations";
import { PART_CATEGORIES } from "./part-categories";

type CartItem = { material: string; description: string; quantity: number };

interface QuoteCatalogProps {
  search: string;
  category: string | null;
  partCategory?: string | null;
  onPartCategoryChange?: (key: string) => void;
  subcategory?: string | null;
  onSubcategoryChange?: (val: string | null) => void;
  modelFilter?: string;
  onModelChange?: (val: string) => void;
  cartItems: CartItem[];
  onAddToCart: (part: any) => void;
  lang: Lang;
}

const PAGE_SIZE = 24;

const CATEGORY_MAP: Record<string, string> = {
  mineracao: "is_mineracao",
  linha_amarela: "is_linha_amarela",
  perfuratriz: "is_perfuratriz",
  guindaste: "is_guindaste",
  caminhao_eletrico: "is_caminhao_eletrico",
};

type SortOption = "relevance" | "stockDesc" | "nameAsc" | "newest";
type ViewMode = "grid" | "list";

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0 pb-3 last:pb-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/60 hover:text-foreground transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && <div className="pt-1">{children}</div>}
    </div>
  );
}

export default function QuoteCatalog({
  search, category, partCategory, onPartCategoryChange,
  subcategory, onSubcategoryChange, modelFilter, onModelChange,
  cartItems, onAddToCart, lang,
}: QuoteCatalogProps) {
  useAuth();
  const [page, setPage] = useState(0);
  const [detailPart, setDetailPart] = useState<any | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [manufacturer, setManufacturer] = useState<string>("all");
  const [model, setModel] = useState<string>(modelFilter ?? "all");
  const [availability, setAvailability] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [attrFilter, setAttrFilter] = useState<{ key: string; value: string } | null>(null);

  const isUnfilteredDefault = false;

  const { data: filterOptions } = useQuery({
    queryKey: ["quote-filter-options"],
    queryFn: async () => {
      const [mfr, mdl] = await Promise.all([
        supabase.rpc("get_distinct_values", { col_name: "manufacturer", stock_min: 1 }),
        supabase.rpc("get_distinct_values", { col_name: "machine_model", stock_min: 1 }),
      ]);
      return {
        manufacturers: (mfr.data ?? []) as string[],
        models: (mdl.data ?? []) as string[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => { setPage(0); }, [search, category, partCategory, subcategory, manufacturer, model, availability, sort, attrFilter]);

  const activeFilterCount = [
    manufacturer !== "all", model !== "all", availability !== "all",
    !!partCategory, !!subcategory, !!attrFilter,
  ].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["quote-parts", search, category, partCategory, subcategory, page, manufacturer, model, availability, sort, attrFilter],
    enabled: !isUnfilteredDefault,
    queryFn: async () => {
      let query: any = supabase
        .from("parts")
        .select("id, material, description, machine_model, stock, manufacturer, estimated_price, image_url, subcategory, attributes", { count: "exact" })
        .gt("stock", 0);

      if (search.length >= 2)
        query = query.or(`material.ilike.%${search}%,description.ilike.%${search}%,machine_model.ilike.%${search}%`);
      if (category && CATEGORY_MAP[category]) query = query.eq(CATEGORY_MAP[category], true);
      if (manufacturer !== "all") query = query.eq("manufacturer", manufacturer);
      if (model !== "all") query = query.eq("machine_model", model);
      if (availability === "ready") query = query.gt("stock", 10);
      if (availability === "low") query = query.lte("stock", 10);
      if (partCategory) query = query.eq("part_category", partCategory);
      if (subcategory) query = query.eq("subcategory", subcategory);
      if (attrFilter) query = query.eq(`attributes->>${attrFilter.key}`, attrFilter.value);

      switch (sort) {
        case "stockDesc": query = query.order("stock", { ascending: false }); break;
        case "nameAsc":   query = query.order("description", { ascending: true }); break;
        case "newest":    query = query.order("created_at", { ascending: false }); break;
        default:          query = query.order("stock", { ascending: false });
      }

      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data: parts, count } = await query;

      const ids = (parts || []).map((p: any) => p.id);
      let aiMap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: aiData } = await supabase
          .from("ai_compatibility_results")
          .select("part_id, technical_description")
          .in("part_id", ids);
        (aiData || []).forEach((a: any) => { aiMap[a.part_id] = a.technical_description || ""; });
      }
      return { parts: parts || [], count: count || 0, aiMap };
    },
  });

  useEffect(() => {
    if (!data?.parts || data.parts.length === 0 || lang === "pt") { setTranslations({}); return; }
    const descriptions = data.parts.map((p: any) => p.description);
    const cacheKey = `${lang}-${descriptions.join("|")}`;
    if (translations._cacheKey === cacheKey) return;
    const translateParts = async () => {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-parts`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ descriptions, targetLang: lang }),
          }
        );
        if (resp.ok) {
          const { translations: translated } = await resp.json();
          const map: Record<string, string> = { _cacheKey: cacheKey };
          data.parts.forEach((p: any, i: number) => { map[p.material] = translated[i] || p.description; });
          setTranslations(map);
        }
      } catch { /* fallback */ }
    };
    translateParts();
  }, [data?.parts, lang]);

  const getDescription = (part: any) => lang === "pt" ? part.description : (translations[part.material] || part.description);

  const totalPages = Math.ceil((data?.count || 0) / PAGE_SIZE);
  const inCartMaterials = new Set(cartItems.map(i => i.material));

  const changeModel = (v: string) => { setModel(v); if (onModelChange) onModelChange(v); };

  const clearFilters = () => {
    setManufacturer("all"); changeModel("all"); setAvailability("all"); setSort("relevance"); setAttrFilter(null);
    if (onSubcategoryChange) onSubcategoryChange(null);
    if (onPartCategoryChange && partCategory) onPartCategoryChange(partCategory);
  };

  /* ─── Sidebar filter panel ─── */
  const FilterPanel = () => (
    <div className="space-y-0 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-foreground uppercase tracking-wide">
          Filtrar
          {activeFilterCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 bg-primary text-primary-foreground rounded-full text-[9px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </span>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
            <X className="h-3 w-3" /> Limpar
          </button>
        )}
      </div>

      {/* ① MÁQUINA — primeiro filtro, primário */}
      <FilterSection title="Máquina / Modelo">
        <div className="space-y-1.5">
          <Select value={model} onValueChange={changeModel}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Todos os modelos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os modelos</SelectItem>
              {(filterOptions?.models || []).map((m: string) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {model !== "all" && (
            <button
              onClick={() => changeModel("all")}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary mt-1"
            >
              <X className="h-2.5 w-2.5" /> Limpar modelo
            </button>
          )}
        </div>
      </FilterSection>

      {/* ② Disponibilidade */}
      <FilterSection title="Disponibilidade">
        <div className="flex flex-col gap-0.5">
          {[
            { value: "all",   label: "Todos",          icon: Circle },
            { value: "ready", label: "Pronta Entrega",  icon: Zap },
            { value: "low",   label: "Sob Consulta",    icon: Circle },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setAvailability(value)}
              className={`flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                availability === value
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground/75 hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* ③ Tipo de peça — secundário */}
      {onPartCategoryChange && (
        <FilterSection title="Tipo de Peça" defaultOpen={false}>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => onPartCategoryChange && partCategory && onPartCategoryChange(partCategory)}
              className={`flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                !partCategory ? "bg-primary text-primary-foreground font-semibold" : "text-foreground/75 hover:bg-muted hover:text-foreground"
              }`}
            >
              <Circle className="h-3 w-3 shrink-0" /> Todas as categorias
            </button>
            {PART_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => onPartCategoryChange(cat.key)}
                className={`flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                  partCategory === cat.key
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground/75 hover:bg-muted hover:text-foreground"
                }`}
              >
                <cat.icon className="h-3 w-3 shrink-0" />
                {tr(`pcat.${cat.key}` as any, lang)}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* ④ Fabricante — terciário */}
      <FilterSection title="Fabricante" defaultOpen={false}>
        <Select value={manufacturer} onValueChange={setManufacturer}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Todos os fabricantes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os fabricantes</SelectItem>
            {(filterOptions?.manufacturers || []).map((m: string) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>
    </div>
  );

  /* ─── Active filter pills ─── */
  const ActivePills = () => {
    const pills: { label: string; onRemove: () => void }[] = [];
    if (availability !== "all") pills.push({ label: availability === "ready" ? "Pronta Entrega" : "Sob Consulta", onRemove: () => setAvailability("all") });
    if (manufacturer !== "all") pills.push({ label: manufacturer, onRemove: () => setManufacturer("all") });
    if (model !== "all") pills.push({ label: model, onRemove: () => setModel("all") });
    if (subcategory) pills.push({ label: subcategory, onRemove: () => onSubcategoryChange?.(null) });
    if (!pills.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mb-3">
        {pills.map(p => (
          <button
            key={p.label}
            onClick={p.onRemove}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-semibold hover:bg-primary/20 transition-colors"
          >
            {p.label} <X className="h-3 w-3" />
          </button>
        ))}
      </div>
    );
  };

  /* ─── Pagination ─── */
  const Pagination = () => {
    if (totalPages <= 1) return null;
    const window_ = 2;
    const start = Math.max(0, Math.min(page - window_, totalPages - 1 - window_ * 2));
    const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i).filter(p => p >= 0 && p < totalPages);
    return (
      <div className="flex items-center justify-center gap-1.5 mt-8">
        <Button variant="outline" size="sm" className="h-8 px-3 gap-1 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" /> Anterior
        </Button>
        {start > 0 && <><Button variant="ghost" size="sm" className="h-8 w-8 text-xs" onClick={() => setPage(0)}>1</Button><span className="text-muted-foreground text-xs">…</span></>}
        {pages.map(p => (
          <Button
            key={p}
            variant={p === page ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 text-xs"
            onClick={() => setPage(p)}
          >
            {p + 1}
          </Button>
        ))}
        {start + 5 < totalPages && <><span className="text-muted-foreground text-xs">…</span><Button variant="ghost" size="sm" className="h-8 w-8 text-xs" onClick={() => setPage(totalPages - 1)}>{totalPages}</Button></>}
        <Button variant="outline" size="sm" className="h-8 px-3 gap-1 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
          Próxima <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-5 pb-8">
      <div className="flex gap-5">

        {/* ─── Desktop sidebar ─── */}
        <aside className="hidden lg:block w-48 flex-shrink-0">
          <div className="sticky top-[68px] bg-card rounded-lg border border-border p-4 shadow-sm">
            <FilterPanel />
          </div>
        </aside>

        {/* ─── Main content ─── */}
        <div className="flex-1 min-w-0">

          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground font-medium">
                {isLoading ? "Buscando…" : data?.count
                  ? <><span className="font-bold text-foreground">{data.count.toLocaleString("pt-BR")}</span> peças encontradas</>
                  : "Nenhuma peça encontrada"}
              </p>
              {totalPages > 1 && (
                <span className="text-[10px] text-muted-foreground/60">
                  · Pág. {page + 1}/{totalPages}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* View toggle */}
              <div className="flex items-center border border-border rounded-md overflow-hidden">
                <button
                  className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-foreground/60 hover:bg-muted"}`}
                  onClick={() => setViewMode("grid")}
                  title="Grade"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-foreground/60 hover:bg-muted"}`}
                  onClick={() => setViewMode("list")}
                  title="Lista"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Sort */}
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevância</SelectItem>
                  <SelectItem value="stockDesc">Maior estoque</SelectItem>
                  <SelectItem value="nameAsc">Nome A→Z</SelectItem>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden h-8 gap-1.5 text-xs px-3">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filtros
                    {activeFilterCount > 0 && (
                      <span className="bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <SheetHeader><SheetTitle className="text-sm">Filtros</SheetTitle></SheetHeader>
                  <div className="mt-4"><FilterPanel /></div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active filter pills */}
          <ActivePills />

          {/* Product grid / list */}
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-1.5">
                {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)}
              </div>
            )
          ) : !isUnfilteredDefault && viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data?.parts.map((part: any) => (
                <QuotePartCard
                  key={part.id}
                  part={{ ...part, description: getDescription(part) }}
                  inCart={inCartMaterials.has(part.material)}
                  hasAiData={!!data.aiMap[part.id]}
                  aiPreview={data.aiMap[part.id] || null}
                  onAdd={() => onAddToCart({ ...part, description: getDescription(part) })}
                  onViewDetail={() => setDetailPart({ ...part, description: getDescription(part) })}
                  lang={lang}
                />
              ))}
            </div>
          ) : !isUnfilteredDefault ? (
            /* List view */
            <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-12 p-2"></TableHead>
                    <TableHead className="text-xs font-bold text-foreground/60 uppercase tracking-wide">Produto</TableHead>
                    <TableHead className="hidden md:table-cell text-xs font-bold text-foreground/60 uppercase tracking-wide">Modelo</TableHead>
                    <TableHead className="text-xs font-bold text-foreground/60 uppercase tracking-wide text-center">Estoque</TableHead>
                    <TableHead className="w-28 text-xs font-bold text-foreground/60 uppercase tracking-wide text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.parts.map((part: any) => {
                    const desc = getDescription(part);
                    const isInCart = inCartMaterials.has(part.material);
                    return (
                      <TableRow
                        key={part.id}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => window.location.assign(`/cotacao/p/${encodeURIComponent(part.material)}`)}
                      >
                        <TableCell className="p-1.5">
                          <div className="h-10 w-10 rounded-md bg-muted overflow-hidden">
                            <img src={partImage(part.image_url)} alt={desc} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-xs font-semibold text-foreground line-clamp-1">{desc}</p>
                          <p className="font-mono text-[9px] text-muted-foreground">#{part.material}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground py-2">{part.machine_model || "—"}</TableCell>
                        <TableCell className="text-center py-2">
                          {part.stock > 10 ? (
                            <Badge className="bg-success/10 text-success border-success/20 text-[10px] px-1.5">✓ Disponível</Badge>
                          ) : part.stock > 0 ? (
                            <Badge variant="outline" className="border-warning/40 text-warning text-[10px] px-1.5">Últimas {part.stock}</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] px-1.5">Consulta</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant={isInCart ? "secondary" : "default"}
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2.5"
                            disabled={isInCart || part.stock <= 0}
                            onClick={() => onAddToCart({ ...part, description: desc })}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            {isInCart ? "Adicionado" : "Cotar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <CategoryGroupedView
              lang={lang}
              cartMaterials={inCartMaterials}
              onAddToCart={(p) => onAddToCart({ ...p, description: getDescription(p) })}
              onViewDetail={(p) => setDetailPart({ ...p, description: getDescription(p) })}
              onSelectSubcategory={(sub) => onSubcategoryChange?.(sub)}
              onSelectAttribute={(sub, k, v) => { onSubcategoryChange?.(sub); setAttrFilter({ key: k, value: v }); }}
            />
          )}

          <Pagination />
        </div>
      </div>

      <QuotePartDetail
        part={detailPart}
        open={!!detailPart}
        onClose={() => setDetailPart(null)}
        inCart={detailPart ? inCartMaterials.has(detailPart.material) : false}
        onAdd={() => { if (detailPart) { onAddToCart(detailPart); setDetailPart(null); } }}
        lang={lang}
      />
    </section>
  );
}
