import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Eye, Brain, Package } from "lucide-react";

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
}

export default function QuotePartCard({ part, inCart, hasAiData, onAdd, onViewDetail }: QuotePartCardProps) {
  return (
    <Card className={`group transition-all hover:shadow-lg border ${inCart ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"}`}>
      <CardContent className="p-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4">
          <Badge className="bg-primary text-primary-foreground font-mono text-xs">{part.material}</Badge>
          <div className="flex items-center gap-1">
            {hasAiData && (
              <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary">
                <Brain className="h-3 w-3" /> IA
              </Badge>
            )}
            <Badge variant={part.stock > 0 ? "secondary" : "destructive"} className="text-xs">
              {part.stock > 0 ? `${part.stock} un.` : "Indisponível"}
            </Badge>
          </div>
        </div>

        {/* Icon placeholder */}
        <div className="flex items-center justify-center py-6">
          <Package className="h-16 w-16 text-muted-foreground/20" />
        </div>

        {/* Info */}
        <div className="px-4 pb-2 space-y-1">
          <p className="text-sm font-medium text-foreground line-clamp-2 min-h-[2.5rem]">{part.description}</p>
          <p className="text-xs text-muted-foreground">{part.machine_model || "Modelo não especificado"}</p>
          {part.manufacturer && <p className="text-xs text-muted-foreground">Fab: {part.manufacturer}</p>}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 pt-2 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onViewDetail}>
            <Eye className="h-3.5 w-3.5" /> Detalhes
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={onAdd}
            disabled={inCart || part.stock <= 0}
            variant={inCart ? "secondary" : "default"}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {inCart ? "Adicionado" : "Cotar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
