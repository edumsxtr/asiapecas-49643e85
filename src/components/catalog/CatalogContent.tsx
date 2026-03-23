import { useState, useMemo } from "react";
import { Search, Filter, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sampleParts, categoryLabels, type Part } from "@/data/sample-parts";
import { PartCard } from "./PartCard";
import { PartTable } from "./PartTable";
import { PartDetailDialog } from "./PartDetailDialog";

const categoryKeys = Object.keys(categoryLabels);

export function CatalogContent() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  const filtered = useMemo(() => {
    let result = sampleParts;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.description.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q) ||
          p.machineModel.toLowerCase().includes(q)
      );
    }

    if (activeCategory) {
      result = result.filter(
        (p) => p.categories[activeCategory as keyof typeof p.categories]
      );
    }

    return result;
  }, [search, activeCategory]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Catálogo de Peças</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} peça(s) encontrada(s)
        </p>
      </div>

      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, descrição ou modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer select-none"
          onClick={() => setActiveCategory(null)}
        >
          Todas
        </Badge>
        {categoryKeys.map((key) => (
          <Badge
            key={key}
            variant={activeCategory === key ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => setActiveCategory(activeCategory === key ? null : key)}
          >
            {categoryLabels[key]}
          </Badge>
        ))}
      </div>

      {/* Parts Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((part) => (
            <PartCard key={part.id} part={part} onClick={() => setSelectedPart(part)} />
          ))}
        </div>
      ) : (
        <PartTable parts={filtered} onSelect={setSelectedPart} />
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">Nenhuma peça encontrada</p>
        </div>
      )}

      <PartDetailDialog part={selectedPart} onClose={() => setSelectedPart(null)} />
    </div>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}
