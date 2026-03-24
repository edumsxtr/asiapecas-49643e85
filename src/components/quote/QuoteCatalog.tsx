import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function QuoteCatalog({ search, category, cartItems, onAddToCart, lang }: QuoteCatalogProps) {
  const [page, setPage] = useState(0);
  const [detailPart, setDetailPart] = useState<any | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["quote-parts", search, category, page],
    queryFn: async () => {
      const filters: Record<string, any> = {};
      if (category && CATEGORY_MAP[category]) {
        filters[CATEGORY_MAP[category]] = true;
      }

      let query: any = supabase
        .from("parts")
        .select("id, material, description, machine_model, stock, manufacturer, estimated_price", { count: "exact" })
        .gt("stock", 0);

      if (search.length >= 2) {
        query = query.or(`material.ilike.%${search}%,description.ilike.%${search}%,machine_model.ilike.%${search}%`);
      }

      for (const [key, val] of Object.entries(filters)) {
        query = query.eq(key, val);
      }

      query = query.order("stock", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data: parts, count } = await query;

      const ids = (parts || []).map((p: any) => p.id);
      let aiIds: string[] = [];
      if (ids.length > 0) {
        const { data: aiData } = await supabase
          .from("ai_compatibility_results")
          .select("part_id")
          .in("part_id", ids);
        aiIds = (aiData || []).map((a: any) => a.part_id);
      }

      return { parts: parts || [], count: count || 0, aiIds };
    },
  });

  // Translate descriptions when language changes
  useEffect(() => {
    if (!data?.parts || data.parts.length === 0 || lang === "pt") {
      setTranslations({});
      return;
    }

    const descriptions = data.parts.map((p: any) => p.description);
    const cacheKey = `${lang}-${descriptions.join("|")}`;
    
    // Check if already translated
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
      } catch {
        // Silently fail, show originals
      }
    };

    translateParts();
  }, [data?.parts, lang]);

  const getDescription = (part: any) => {
    if (lang === "pt") return part.description;
    return translations[part.material] || part.description;
  };

  const totalPages = Math.ceil((data?.count || 0) / PAGE_SIZE);
  const inCartMaterials = new Set(cartItems.map(i => i.material));

  return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {data?.count ? `${data.count.toLocaleString("pt-BR")} ${tr("catalog.found", lang)}` : tr("catalog.searching", lang)}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            {tr("catalog.page", lang)} {page + 1} {tr("catalog.of", lang)} {totalPages}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.parts.map((part: any) => (
            <QuotePartCard
              key={part.id}
              part={{ ...part, description: getDescription(part) }}
              inCart={inCartMaterials.has(part.material)}
              hasAiData={data.aiIds.includes(part.id)}
              onAdd={() => onAddToCart({ ...part, description: getDescription(part) })}
              onViewDetail={() => setDetailPart({ ...part, description: getDescription(part) })}
              lang={lang}
            />
          ))}
        </div>
      )}

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
