import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSubcategoryIcon } from "@/lib/subcategory-rules";

interface Props {
  onSubcategoryClick: (sub: string) => void;
  activeSubcategory?: string | null;
}

export default function SubcategoryPillBar({ onSubcategoryClick, activeSubcategory }: Props) {
  const { data: subs = [] } = useQuery({
    queryKey: ["subcategory-pill-bar"],
    queryFn: async () => {
      const { data } = await supabase
        .from("parts")
        .select("subcategory")
        .gt("stock", 0)
        .not("subcategory", "is", null)
        .limit(5000);
      const count = new Map<string, number>();
      for (const p of data ?? []) {
        if (p.subcategory) count.set(p.subcategory, (count.get(p.subcategory) ?? 0) + 1);
      }
      return Array.from(count.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([sub]) => sub);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!subs.length) return null;

  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
          {subs.map((sub) => {
            const Icon = getSubcategoryIcon(sub);
            const active = activeSubcategory === sub;
            return (
              <button
                key={sub}
                onClick={() => {
                  onSubcategoryClick(sub);
                  setTimeout(() => document.getElementById("pecas")?.scrollIntoView({ behavior: "smooth" }), 50);
                }}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted text-foreground/75 border-border hover:border-primary/40 hover:text-primary hover:bg-primary/6"
                }`}
              >
                <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
                {sub}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
