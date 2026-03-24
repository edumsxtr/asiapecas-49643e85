import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import QuotePartCard from "./QuotePartCard";
import QuotePartDetail from "./QuotePartDetail";

type CartItem = { material: string; description: string; quantity: number };

interface QuoteCatalogProps {
  search: string;
  category: string | null;
  cartItems: CartItem[];
  onAddToCart: (part: any) => void;
}

const PAGE_SIZE = 12;

const CATEGORY_MAP: Record<string, string> = {
  mineracao: "is_mineracao",
  linha_amarela: "is_linha_amarela",
  perfuratriz: "is_perfuratriz",
  guindaste: "is_guindaste",
  caminhao_eletrico: "is_caminhao_eletrico",
};

export default function QuoteCatalog({ search, category, cartItems, onAddToCart }: QuoteCatalogProps) {
  const [page, setPage] = useState(0);
  const [detailPart, setDetailPart] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["quote-parts", search, category, page],
    queryFn: async () => {
      let q = supabase
        .from("parts")
        .select("id, material, description, machine_model, stock, manufacturer, estimated_price", { count: "exact" })
        .gt("stock", 0)
        .order("stock", { ascending: false });

      if (search.length >= 2) {
        q = q.or(`material.ilike.%${search}%,description.ilike.%${search}%,machine_model.ilike.%${search}%`);
      }
      if (category && CATEGORY_MAP[category]) {
        q = q.eq(CATEGORY_MAP[category], true as any);
      }

      q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data: parts, count } = await q;
      
      // Check which parts have AI data
      const ids = (parts || []).map(p => p.id);
      let aiIds: string[] = [];
      if (ids.length > 0) {
        const { data: aiData } = await supabase
          .from("ai_compatibility_results")
          .select("part_id")
          .in("part_id", ids);
        aiIds = (aiData || []).map(a => a.part_id);
      }

      return { parts: parts || [], count: count || 0, aiIds };
    },
  });

  const totalPages = Math.ceil((data?.count || 0) / PAGE_SIZE);
  const inCartMaterials = new Set(cartItems.map(i => i.material));

  return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {data?.count ? `${data.count.toLocaleString("pt-BR")} peças encontradas` : "Buscando peças..."}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </p>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.parts.map((part) => (
            <QuotePartCard
              key={part.id}
              part={part}
              inCart={inCartMaterials.has(part.material)}
              hasAiData={data.aiIds.includes(part.id)}
              onAdd={() => onAddToCart(part)}
              onViewDetail={() => setDetailPart(part)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
              return (
                <Button
                  key={p}
                  variant={p === page ? "default" : "ghost"}
                  size="sm"
                  className="w-9"
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </Button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            Próxima <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Detail dialog */}
      <QuotePartDetail
        part={detailPart}
        open={!!detailPart}
        onClose={() => setDetailPart(null)}
        inCart={detailPart ? inCartMaterials.has(detailPart.material) : false}
        onAdd={() => { if (detailPart) { onAddToCart(detailPart); setDetailPart(null); } }}
      />
    </section>
  );
}
