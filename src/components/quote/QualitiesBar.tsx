import { ShieldCheck, Boxes, Truck, BadgeCheck, Headset } from "lucide-react";
import ParallaxBackdrop from "@/components/quote/ParallaxBackdrop";

const QUALITIES = [
  {
    icon: ShieldCheck,
    label: "Peças Originais",
    sub: "Peças genuínas para sua máquina, o cuidado que sua operação precisa.",
  },
  {
    icon: Boxes,
    label: "Estoque Completo",
    sub: "Mais de 20 mil itens à disposição, prontos para atender você.",
  },
  {
    icon: Truck,
    label: "Envio Para Todo Brasil",
    sub: "Entrega rápida em todo o Brasil e América Latina.",
  },
  {
    icon: BadgeCheck,
    label: "Garantia",
    sub: "Garantia e segurança no seu pedido!",
  },
  {
    icon: Headset,
    label: "Pós-venda",
    sub: "Time especializado pra te dar suporte durante e após a venda!",
  },
];

/**
 * Faixa azul sólida (cobalto) com as qualidades da empresa.
 * Detalhes em amarelo: ícones + cortes diagonais sutis em parallax. Texto branco.
 */
export default function QualitiesBar() {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* Cortes amarelos sutis, em leve parallax */}
      <ParallaxBackdrop speed={0.1} className="text-accent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-7">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6 lg:divide-x lg:divide-accent/25">
          {QUALITIES.map(({ icon: Icon, label, sub }) => (
            <li
              key={label}
              className="flex flex-col items-center text-center gap-1.5 px-2 lg:px-3 last:col-span-2 sm:last:col-auto"
            >
              <Icon className="h-6 w-6 text-accent" strokeWidth={1.75} />
              <span className="text-xs font-display font-semibold uppercase tracking-wide leading-tight">
                {label}
              </span>
              <span className="text-[11px] leading-snug text-primary-foreground/70 max-w-[22ch]">
                {sub}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
