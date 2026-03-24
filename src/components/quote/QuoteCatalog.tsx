import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X, LayoutGrid, List, ShoppingCart, Eye } from "lucide-react";
import QuotePartCard from "./QuotePartCard";
import QuotePartDetail from "./QuotePartDetail";
import { type Lang, tr } from "./translations";

type CartItem = { material: string; description: string; quantity: number };

interface QuoteCatalogProps {
  search: string;
  category: string | null;
  cartItems: CartItem[];
  onAddToCart: (part: any) => void;
  lang: Lang;
}

const PAGE_SIZE = 12;

const CATEGORY_MAP: Record<string, string> = {
  mineracao: "is_mineracao",
  linha_amarela: "is_linha_amarela",
  perfuratriz: "is_perfuratriz",
  guindaste: "is_guindaste",
  caminhao_eletrico: "is_caminhao_eletrico",
};

type SortOption = "relevance" | "stockDesc" | "nameAsc" | "newest" | "priceAsc" | "priceDesc";
type ViewMode = "grid" | "list";

export default function QuoteCatalog({ search, category, cartItems, onAddToCart, lang }: QuoteCatalogProps) {
  const [page, setPage] = useState(0);
  const [detailPart, setDetailPart] = useState<any | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [manufacturer, setManufacturer] = useState<string>("all");
  const [model, setModel] = useState<string>("all");
  const [availability, setAvailability] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["quote-filter-options"],
    queryFn: async () => {
      const [mfr, mdl] = await Promise.all([
        supabase.from("parts").select("manufacturer").gt("stock", 0).not("manufacturer", "is", null),
        supabase.from("parts").select("machine_model").gt("stock", 0).not("machine_model", "is", null),
      ]);
      const manufacturers = [...new Set((mfr.data || []).map((r: any) => r.manufacturer).filter(Boolean))].sort();
      const models = [...new Set((mdl.data || []).map((r: any) => r.machine_model).filter(Boolean))].sort();
      return { manufacturers, models };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, category, manufacturer, model, availability, sort]);

  const activeFilterCount = [manufacturer !== "all", model !== "all", availability !== "all"].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["quote-parts", search, category, page, manufacturer, model, availability, sort],
    queryFn: async () => {
      let query: any = supabase
        .from("parts")
        .select("id, material, description, machine_model, stock, manufacturer, estimated_price", { count: "exact" })
        .gt("stock", 0);

      if (search.length >= 2) {
        query = query.or(`material.ilike.%${search}%,description.ilike.%${search}%,machine_model.ilike.%${search}%`);
      }
      if (category && CATEGORY_MAP[category]) {
        query = query.eq(CATEGORY_MAP[category], true);
      }
      if (manufacturer !== "all") query = query.eq("manufacturer", manufacturer);
      if (model !== "all") query = query.eq("machine_model", model);
      if (availability === "ready") query = query.gt("stock", 10);
      if (availability === "low") query = query.lte("stock", 10);

      // Sort
      switch (sort) {
        case "stockDesc": query = query.order("stock", { ascending: false }); break;
        case "nameAsc": query = query.order("description", { ascending: true }); break;
        case "newest": query = query.order("created_at", { ascending: false }); break;
        case "priceAsc": query = query.order("estimated_price", { ascending: true }); break;
        case "priceDesc": query = query.order("estimated_price", { ascending: false }); break;
        default: query = query.order("stock", { ascending: false });
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

  // Translate descriptions
  useEffect(() => {
    if (!data?.parts || data.parts.length === 0 || lang === "pt") {
      setTranslations({});
      return;
    }
    const descriptions = data.parts.map((p: any) => p.description);
    const cacheKey = `${lang}-${descriptions.join("|")}`;
    if (translations._cacheKey === cacheKey) return;

    const translateParts = async () => {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-parts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ descriptions, targetLang: lang }),
          }
        );
        if (resp.ok) {
          const { translations: translated } = await resp.json();
          const map: Record<string, string> = { _cacheKey: cacheKey };
          data.parts.forEach((p: any, i: number) => {
            map[p.material] = translated[i] || p.description;
          });
          setTranslations(map);
        }
      } catch { /* fallback to originals */ }
    };
    translateParts();
  }, [data?.parts, lang]);

  const getDescription = (part: any) => {
    if (lang === "pt") return part.description;
    return translations[part.material] || part.description;
  };

  const totalPages = Math.ceil((data?.count || 0) / PAGE_SIZE);
  const inCartMaterials = new Set(cartItems.map(i => i.material));

  const clearFilters = () => {
    setManufacturer("all");
    setModel("all");
    setAvailability("all");
    setSort("relevance");
  };

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">{tr("filter.title", lang)}</h3>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-destructive" onClick={clearFilters}>
            <X className="h-3 w-3" /> {tr("filter.clear", lang)}
          </Button>
        )}
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">{tr("filter.availability", lang)}</label>
        <div className="flex flex-col gap-1">
          {[
            { value: "all", label: tr("filter.all", lang) },
            { value: "ready", label: tr("filter.readyToShip", lang) },
            { value: "low", label: tr("filter.onDemand", lang) },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setAvailability(opt.value)}
              className={`text-left text-xs px-3 py-2 rounded-md transition-colors ${availability === opt.value ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manufacturer */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">{tr("filter.manufacturer", lang)}</label>
        <Select value={manufacturer} onValueChange={setManufacturer}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr("filter.allManufacturers", lang)}</SelectItem>
            {(filterOptions?.manufacturers || []).map((m: string) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">{tr("filter.model", lang)}</label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr("filter.allModels", lang)}</SelectItem>
            {(filterOptions?.models || []).map((m: string) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <FilterPanel />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar: results count + sort + mobile filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {data?.count ? `${data.count.toLocaleString("pt-BR")} ${tr("catalog.found", lang)}` : tr("catalog.searching", lang)}
              </p>
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={clearFilters}>
                  <X className="h-3 w-3" /> {activeFilterCount} {tr("filter.activeFilters", lang)}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center border rounded-md">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className="h-9 w-9 p-0" onClick={() => setViewMode("grid")}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="h-9 w-9 p-0" onClick={() => setViewMode("list")}>
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort */}
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="h-9 text-xs w-[160px]">
                  <SelectValue placeholder={tr("sort.label", lang)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{tr("sort.relevance", lang)}</SelectItem>
                  <SelectItem value="stockDesc">{tr("sort.stockDesc", lang)}</SelectItem>
                  <SelectItem value="nameAsc">{tr("sort.nameAsc", lang)}</SelectItem>
                  <SelectItem value="newest">{tr("sort.newest", lang)}</SelectItem>
                  <SelectItem value="priceAsc">{tr("sort.priceAsc", lang)}</SelectItem>
                  <SelectItem value="priceDesc">{tr("sort.priceDesc", lang)}</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile filter button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden h-9 gap-1.5">
                    <SlidersHorizontal className="h-4 w-4" />
                    {tr("filter.title", lang)}
                    {activeFilterCount > 0 && (
                      <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px]">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle>{tr("filter.title", lang)}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Pagination info */}
          {totalPages > 1 && (
            <p className="text-xs text-muted-foreground mb-4">
              {tr("catalog.page", lang)} {page + 1} {tr("catalog.of", lang)} {totalPages}
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> {tr("catalog.prev", lang)}
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                  return (
                    <Button key={p} variant={p === page ? "default" : "ghost"} size="sm" className="w-9" onClick={() => setPage(p)}>
                      {p + 1}
                    </Button>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                {tr("catalog.next", lang)} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
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
