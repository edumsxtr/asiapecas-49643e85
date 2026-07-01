import { ShieldCheck, Truck, ChevronDown, Building2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { getMachineType } from "@/lib/machine-data";

interface ModelHeroProps {
  modelName: string;
  countBadge?: string;
  whatsAppUrl: string;
  onB2bClick: () => void;
  onScrollToList: () => void;
}

export default function ModelHero({ modelName, countBadge, whatsAppUrl, onB2bClick, onScrollToList }: ModelHeroProps) {
  const machine = getMachineType(modelName);

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 to-background text-foreground">
      {/* Foto da máquina como textura sutil */}
      <img
        src={machine.photo}
        alt={`${machine.label} XCMG ${modelName}`}
        className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.06]"
        loading="eager"
        fetchPriority="high"
      />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-9">
        <div className="max-w-2xl space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent text-accent-foreground rounded-full text-[11px] font-bold uppercase tracking-wider">
              <Package className="h-3 w-3" />
              {machine.label}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-semibold">
              XCMG Oficial
            </span>
            {countBadge && (
              <span className="inline-flex items-center px-2.5 py-1 bg-success text-success-foreground rounded-full text-[11px] font-bold">
                {countBadge}
              </span>
            )}
          </div>

          {/* H1 */}
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight leading-tight text-foreground">
            Peças para <span className="text-primary">{modelName}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
            {machine.application} · Distribuidor autorizado XCMG no Brasil, Venezuela e Guiana.
          </p>

          {/* Specs row */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" /> Garantia de fábrica
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-primary shrink-0" /> Entrega nacional
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-primary shrink-0" /> Peças originais e compatíveis
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button
              size="lg"
              className="gap-2 font-bold"
              onClick={onScrollToList}
            >
              <ChevronDown className="h-4 w-4" /> Ver peças disponíveis
            </Button>
            <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 gap-2 font-bold"
              >
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </Button>
            </a>
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              onClick={onB2bClick}
            >
              <Building2 className="h-4 w-4" /> Tabela para frota
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
