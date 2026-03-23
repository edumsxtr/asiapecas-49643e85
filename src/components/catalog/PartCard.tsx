import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowRight } from "lucide-react";
import { type Part, formatBRL, getActiveCategories } from "@/data/sample-parts";

interface PartCardProps {
  part: Part;
  onClick: () => void;
}

export function PartCard({ part, onClick }: PartCardProps) {
  const categories = getActiveCategories(part);
  const isStale = part.lastEntryTime === "mais de 2 anos";

  return (
    <Card
      className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
      onClick={onClick}
    >
      {isStale && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
      )}
      {part.compatibleModels && part.compatibleModels.length > 1 && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-[10px] bg-info/10 text-info border-info/20">
            +{part.compatibleModels.length} modelos
          </Badge>
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground font-mono">
              {part.material}
            </p>
            <p className="text-sm font-medium text-foreground leading-tight mt-0.5 line-clamp-2">
              {part.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <Badge key={cat} variant="outline" className="text-[10px] py-0">
              {cat}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Modelo</p>
            <p className="font-medium text-foreground truncate">{part.machineModel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Estoque</p>
            <p className="font-medium text-foreground">{part.stock.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="font-display font-bold text-sm text-foreground">
            {formatBRL(part.estimatedPrice)}
          </p>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}
