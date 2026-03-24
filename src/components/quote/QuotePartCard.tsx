import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Eye, Brain, Package } from "lucide-react";
import { type Lang, tr } from "./translations";

interface QuotePartCardProps {
  part: {
    id: string;
    material: string;
    description: string;
    machine_model: string | null;
    stock: number;
    manufacturer: string | null;
  };
  inCart: boolean;
  hasAiData: boolean;
  onAdd: () => void;
  onViewDetail: () => void;
  lang: Lang;
}

export default function QuotePartCard({ part, inCart, hasAiData, onAdd, onViewDetail, lang }: QuotePartCardProps) {
  return (
    <Card className={`group transition-all hover:shadow-lg border ${inCart ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"}`}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 pt-4">
          <Badge className="bg-primary text-primary-foreground font-mono text-xs">{part.material}</Badge>
          <div className="flex items-center gap-1">
            {hasAiData && (
              <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary">
                <Brain className="h-3 w-3" /> IA
              </Badge>
            )}
            <Badge variant={part.stock > 0 ? "secondary" : "destructive"} className="text-xs">
              {part.stock > 0 ? `${part.stock} ${tr("part.units", lang)}` : tr("part.unavailable", lang)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-center py-6">
          <Package className="h-16 w-16 text-muted-foreground/20" />
        </div>

        <div className="px-4 pb-2 space-y-1">
          <p className="text-sm font-medium text-foreground line-clamp-2 min-h-[2.5rem]">{part.description}</p>
          <p className="text-xs text-muted-foreground">{part.machine_model || tr("part.noModel", lang)}</p>
          {part.manufacturer && <p className="text-xs text-muted-foreground">{tr("detail.manufacturer", lang)}: {part.manufacturer}</p>}
        </div>

        <div className="px-4 pb-4 pt-2 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onViewDetail}>
            <Eye className="h-3.5 w-3.5" /> {tr("part.details", lang)}
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={onAdd}
            disabled={inCart || part.stock <= 0}
            variant={inCart ? "secondary" : "default"}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {inCart ? tr("part.added", lang) : tr("part.quote", lang)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
