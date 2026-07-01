import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Cog } from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "5531995165511";
const ROTATE_MS = 4000; // troca a cada ~4s
const STAGGER_MS = 800; // defasagem entre cards

type Variant = { name: string; code?: string; image?: string };

/**
 * Mais vendidas — grade 3×3 (9 cards). Cada card alterna entre 3 peças
 * (imagem + descrição) com cross-fade → 27 peças no total.
 *
 * Para colocar as peças reais: em cada grupo (card), preencha as 3 variações.
 * Foto 1:1 (fundo branco) em `public/bestsellers/` e o caminho em `image`.
 * Sem `image`, mostra um placeholder de peça.
 */
// Fotos das peças (1:1, otimizadas) em public/bestsellers/. Temporariamente
// distribuídas em rodízio pelos 27 lugares. Descrições reais entram depois.
const IMAGES = Array.from({ length: 8 }, (_, i) => `/bestsellers/peca-${i + 1}.jpg`);

const LABELS: Variant[][] = [
  [{ name: "Peça 1 — opção 1", code: "EX-011" }, { name: "Peça 1 — opção 2", code: "EX-012" }, { name: "Peça 1 — opção 3", code: "EX-013" }],
  [{ name: "Peça 2 — opção 1", code: "EX-021" }, { name: "Peça 2 — opção 2", code: "EX-022" }, { name: "Peça 2 — opção 3", code: "EX-023" }],
  [{ name: "Peça 3 — opção 1", code: "EX-031" }, { name: "Peça 3 — opção 2", code: "EX-032" }, { name: "Peça 3 — opção 3", code: "EX-033" }],
  [{ name: "Peça 4 — opção 1", code: "EX-041" }, { name: "Peça 4 — opção 2", code: "EX-042" }, { name: "Peça 4 — opção 3", code: "EX-043" }],
  [{ name: "Peça 5 — opção 1", code: "EX-051" }, { name: "Peça 5 — opção 2", code: "EX-052" }, { name: "Peça 5 — opção 3", code: "EX-053" }],
  [{ name: "Peça 6 — opção 1", code: "EX-061" }, { name: "Peça 6 — opção 2", code: "EX-062" }, { name: "Peça 6 — opção 3", code: "EX-063" }],
  [{ name: "Peça 7 — opção 1", code: "EX-071" }, { name: "Peça 7 — opção 2", code: "EX-072" }, { name: "Peça 7 — opção 3", code: "EX-073" }],
  [{ name: "Peça 8 — opção 1", code: "EX-081" }, { name: "Peça 8 — opção 2", code: "EX-082" }, { name: "Peça 8 — opção 3", code: "EX-083" }],
  [{ name: "Peça 9 — opção 1", code: "EX-091" }, { name: "Peça 9 — opção 2", code: "EX-092" }, { name: "Peça 9 — opção 3", code: "EX-093" }],
];

let _img = 0;
const BEST_SELLERS: Variant[][] = LABELS.map((group) =>
  group.map((v) => ({ ...v, image: IMAGES[_img++ % IMAGES.length] })),
);

function buyLink(name: string, code?: string) {
  const msg = `Olá! Tenho interesse na peça ${name}${code ? ` (${code})` : ""}. Poderia me passar preço e disponibilidade?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function VariantMedia({ variant }: { variant: Variant }) {
  if (variant.image) {
    return (
      <div className="h-full w-full bg-white p-3 flex items-center justify-center">
        <img
          src={variant.image}
          alt={variant.name}
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }
  return (
    <div className="h-full w-full bg-muted/40 flex flex-col items-center justify-center gap-1 text-muted-foreground">
      <Cog className="h-7 w-7" strokeWidth={1.5} />
      <span className="text-[9px] uppercase tracking-wide">Foto em breve</span>
    </div>
  );
}

function RotatingCard({ variants, order }: { variants: Variant[]; order: number }) {
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (variants.length <= 1) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let interval: ReturnType<typeof setInterval>;
    const kickoff = setTimeout(() => {
      const advance = () => {
        if (!pausedRef.current) setActive((a) => (a + 1) % variants.length);
      };
      advance();
      interval = setInterval(advance, ROTATE_MS);
    }, ROTATE_MS + order * STAGGER_MS);

    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [variants.length, order]);

  const current = variants[active];

  return (
    <article
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      className="bg-background rounded-lg border border-border overflow-hidden flex flex-col hover:border-primary/35 hover:shadow-sm transition-all"
    >
      {/* Mídia com cross-fade entre variações */}
      <div className="relative aspect-square">
        {variants.map((v, i) => (
          <div
            key={i}
            aria-hidden={i !== active}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              i === active ? "opacity-100" : "opacity-0",
            )}
          >
            <VariantMedia variant={v} />
          </div>
        ))}
      </div>

      <div className="p-2.5 flex flex-col gap-2 flex-1 border-t border-border">
        {/* Descrição com fade a cada troca */}
        <div key={active} className="flex-1 min-w-0 animate-in fade-in duration-700">
          <h3 className="text-xs font-display font-bold text-foreground leading-snug line-clamp-2">
            {current.name}
          </h3>
          {current.code && (
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">{current.code}</p>
          )}
        </div>
        <a
          href={buyLink(current.name, current.code)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-[11px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full hover:brightness-95 transition"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          Comprar
        </a>
      </div>
    </article>
  );
}

export default function BestSellersCarousel() {
  return (
    <section className="bg-background border-y border-border">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-12">
        {/* Cabeçalho */}
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-foreground">
              Mais vendidas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              As peças XCMG com maior saída — fale com a gente e garanta a sua.
            </p>
          </div>
          <Link
            to="/pecas"
            className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-primary hover:underline whitespace-nowrap"
          >
            Ver catálogo completo →
          </Link>
        </div>

        {/* Grade 3×3 compacta (3 col desktop, 2 mobile) com folga */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {BEST_SELLERS.map((variants, i) => (
            <RotatingCard key={i} variants={variants} order={i} />
          ))}
        </div>

        {/* Link catálogo (mobile) */}
        <div className="mt-6 sm:hidden">
          <Link
            to="/pecas"
            className="block text-center text-xs font-bold uppercase tracking-wider text-primary hover:underline"
          >
            Ver catálogo completo →
          </Link>
        </div>
      </div>
    </section>
  );
}
