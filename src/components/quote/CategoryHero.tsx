import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Truck, Globe, Building2 } from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { type LucideIcon } from "lucide-react";

interface CategoryHeroProps {
  title: string;
  subtitle: string;
  countBadge?: string;
  Icon?: LucideIcon;
  whatsAppUrl: string;
  onB2bClick: () => void;
  onScrollToList: () => void;
  campaignActive?: boolean;
  imageUrl?: string | null;
}

export default function CategoryHero({
  title, subtitle, countBadge, Icon, whatsAppUrl, onB2bClick, onScrollToList, campaignActive, imageUrl,
}: CategoryHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 to-background text-foreground">
      {imageUrl && (
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.06]" />
      )}
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-9">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {Icon && (
            <div className="hidden md:flex h-20 w-20 rounded-lg bg-primary/10 items-center justify-center shrink-0">
              <Icon className="h-10 w-10 text-primary" />
            </div>
          )}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {countBadge && (
                <Badge className="bg-primary text-primary-foreground">{countBadge}</Badge>
              )}
              {campaignActive && (
                <Badge className="bg-destructive text-destructive-foreground animate-pulse">Campanha ativa</Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-foreground leading-tight">
              {title}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">{subtitle}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Estoque real</span>
              <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-primary" /> Pronta entrega</span>
              <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" /> Atendimento BR / EN / ES</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="lg" onClick={onScrollToList} className="gap-2">
                Solicitar cotação
              </Button>
              <Button size="lg" variant="outline" onClick={onB2bClick} className="gap-2">
                <Building2 className="h-4 w-4" /> Sou empresa / quero tabela
              </Button>
              <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" data-cta="whatsapp">
                <Button size="lg" variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
                  <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

