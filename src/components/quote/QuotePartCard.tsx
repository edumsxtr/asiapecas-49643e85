import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { partImage } from "@/lib/default-part-image";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, AlertTriangle, Tag, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActivePromotionIds } from "@/hooks/use-active-promotions";
import { type Lang, tr } from "./translations";

interface QuotePartCardProps {
  part: {
    id: string;
    material: string;
    description: string;
    machine_model: string | null;
    stock: number;
    manufacturer: string | null;
    estimated_price?: number | null;
    image_url?: string | null;
    subcategory?: string | null;
    attributes?: Record<string, any> | null;
  };
  inCart: boolean;
  hasAiData?: boolean;
  aiPreview?: string | null;
  onAdd: () => void;
  onViewDetail: () => void;
  lang: Lang;
}

function QuotePartCard({ part, inCart, onAdd, lang }: QuotePartCardProps) {
  const navigate = useNavigate();
  const isReadyToShip = part.stock > 10;
  const isLastUnits = part.stock >= 1 && part.stock <= 5;

  const hasPromo = useActivePromotionIds().has(part.id);

  const goToDetail = () => navigate(`/cotacao/p/${encodeURIComponent(part.material)}`);
  const handleAdd = (e: React.MouseEvent) => { e.stopPropagation(); onAdd(); };

  return (
    <div
      onClick={goToDetail}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToDetail(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes: ${part.description}`}
      className={`group cursor-pointer bg-card rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
        inCart ? "border-primary/50 ring-1 ring-primary/20" : "border-border hover:border-primary/30"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={partImage(part.image_url)}
          alt={part.description}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        {hasPromo && (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
            <Tag className="h-2.5 w-2.5" /> PROMO
          </span>
        )}
        {isLastUnits && !hasPromo && (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 bg-warning text-warning-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
            <AlertTriangle className="h-2.5 w-2.5" /> Últimas {part.stock}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {/* Manufacturer · Model */}
        <p className="text-[10px] text-muted-foreground truncate">
          <span className="font-semibold text-foreground/70">{part.manufacturer || "XCMG"}</span>
          {part.machine_model && <span className="text-muted-foreground/70"> · {part.machine_model}</span>}
        </p>

        {/* Description */}
        <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug flex-1">
          {part.description}
        </p>

        {/* SKU — assinatura "plaqueta de identificação" */}
        <span className="sku-plate self-start">{part.material}</span>

        {/* Stock status */}
        <div className="flex items-center justify-between gap-1">
          {isReadyToShip ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
              <Zap className="h-2.5 w-2.5" /> Pronta entrega
            </span>
          ) : isLastUnits ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-warning">
              <AlertTriangle className="h-2.5 w-2.5" /> Limitado
            </span>
          ) : part.stock > 0 ? (
            <span className="text-[10px] text-muted-foreground">{part.stock} un.</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">{tr("part.priceOnRequest", lang)}</span>
          )}
        </div>

        {/* CTA */}
        <Button
          size="sm"
          className={`w-full gap-1.5 h-7 text-[11px] mt-1 ${inCart ? "" : ""}`}
          onClick={handleAdd}
          disabled={part.stock <= 0}
          variant={inCart ? "secondary" : "default"}
        >
          {inCart ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
          {inCart ? "Adicionado" : tr("part.quote", lang)}
        </Button>
      </div>
    </div>
  );
}

export default memo(QuotePartCard);
