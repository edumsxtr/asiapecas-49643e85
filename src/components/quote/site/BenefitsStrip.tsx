import { ShieldCheck, Truck, BadgeCheck, Clock4 } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, title: "Distribuidor Autorizado", desc: "Peças XCMG originais com rastreio de origem." },
  { icon: Truck, title: "Logística BR · VE · GY", desc: "Atendimento e envio para os três países." },
  { icon: ShieldCheck, title: "Garantia de Fábrica", desc: "Cobertura oficial XCMG em todos os itens." },
  { icon: Clock4, title: "Cotação em 24h", desc: "Resposta rápida do time comercial." },
];

export default function BenefitsStrip() {
  return (
    <section className="bg-background border-y border-foreground/10">
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {ITEMS.map((it) => (
          <div key={it.title} className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <it.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-xs md:text-sm uppercase tracking-wider text-foreground leading-tight">{it.title}</p>
              <p className="text-[11px] md:text-xs text-foreground/60 leading-snug">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
