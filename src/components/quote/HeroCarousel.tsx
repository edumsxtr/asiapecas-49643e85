import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Lang } from "./translations";
import { Button } from "@/components/ui/button";
/* MOCKUPS de teste (SVG). Troque por slide-N.png (1920×720) e
   slide-N-mobile.png (1080×1350) quando tiver as artes reais. */
import mock1 from "@/assets/hero/mock-1.svg";
import mock1m from "@/assets/hero/mock-1-mobile.svg";
import mock2 from "@/assets/hero/mock-2.svg";
import mock2m from "@/assets/hero/mock-2-mobile.svg";
import mock3 from "@/assets/hero/mock-3.svg";
import mock3m from "@/assets/hero/mock-3-mobile.svg";
import mock4 from "@/assets/hero/mock-4.svg";
import mock4m from "@/assets/hero/mock-4-mobile.svg";
import mock5 from "@/assets/hero/mock-5.svg";
import mock5m from "@/assets/hero/mock-5-mobile.svg";

interface Banner {
  id: string;
  image_url: string;
  /* Arte vertical opcional usada só em telas < 640px. Quando ausente, o mobile
     reaproveita a image_url (desktop), recortada ao centro pelo object-cover. */
  image_url_mobile?: string | null;
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  cta_link: string | null;
}

/* TAMANHOS DAS ARTES (exporte do design assim):
     • Desktop  → 1920 × 480 px (proporção 4:1, faixa larga e baixa)
     • Mobile   → 1080 × 608 px (proporção 16:9)
   Mantenha logo/preço/texto nos 80% centrais (zona segura), pois o object-cover
   pode aparar as bordas dependendo da tela.

   Os banners ficam FIXOS aqui no código (não vêm do painel). Para trocar a arte
   de um slide, substitua o arquivo em src/assets/hero/ (slide-1.png … slide-5.png).

   Para dar a arte MOBILE a um slide (recomendado), suba o arquivo vertical, ex.:
     import slide1Mobile from "@/assets/hero/slide-1-mobile.png";
   e preencha image_url_mobile: slide1Mobile no slide correspondente. Sem ela, o
   mobile reaproveita a arte desktop recortada em 4:5.
   Imagens sem title/subtitle aparecem limpas (sem texto por cima). */
const DEFAULT_SLIDES: Banner[] = [
  { id: "default-1", image_url: mock1, image_url_mobile: mock1m, title: null, subtitle: null, cta_label: null, cta_link: null },
  { id: "default-2", image_url: mock2, image_url_mobile: mock2m, title: null, subtitle: null, cta_label: null, cta_link: null },
  { id: "default-3", image_url: mock3, image_url_mobile: mock3m, title: null, subtitle: null, cta_label: null, cta_link: null },
  { id: "default-4", image_url: mock4, image_url_mobile: mock4m, title: null, subtitle: null, cta_label: null, cta_link: null },
  { id: "default-5", image_url: mock5, image_url_mobile: mock5m, title: null, subtitle: null, cta_label: null, cta_link: null },
];

/* Palco responsivo (faixa baixa): 16:9 no mobile (1080×608) e largo 4:1 no
   desktop (1920×480). aspect-ratio reserva o espaço desde o primeiro paint,
   então não há salto de layout nem "pisca-pisca". A altura é limitada para a
   faixa não crescer demais em telas grandes. */
const STAGE = "relative w-full aspect-[16/9] max-h-[240px] sm:aspect-[4/1] sm:max-h-[360px] overflow-hidden";

/* A hero é 100% controlada pelo código (DEFAULT_SLIDES). Não há mais leitura de
   banners do painel/banco — o conteúdo visual não é editável pelo painel. */
export default function HeroCarousel(_props: { lang: Lang }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 6000, stopOnInteraction: false })]
  );
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setSelected(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const slides = DEFAULT_SLIDES;

  return (
    <section className="relative bg-secondary text-secondary-foreground overflow-hidden">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((b, i) => {
            const hasOverlay = b.title || b.subtitle || (b.cta_label && b.cta_link);
            return (
              <div key={b.id} className="relative flex-[0_0_100%] min-w-0">
                <div className={STAGE}>
                  <picture>
                    {/* Arte vertical só no mobile (< 640px); sem ela, cai no src desktop */}
                    {b.image_url_mobile && (
                      <source media="(max-width: 639px)" srcSet={b.image_url_mobile} />
                    )}
                    <img
                      src={b.image_url}
                      alt={b.title || "Banner Ásia Peças"}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      decoding="async"
                    />
                  </picture>

                  {/* Overlay opcional — só quando o banner tem texto/CTA */}
                  {hasOverlay && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
                      <div className="relative h-full max-w-7xl mx-auto px-4 md:px-10 flex flex-col justify-center gap-3">
                        <div className="max-w-xl flex flex-col gap-3">
                          {b.title && (
                            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight leading-tight text-white drop-shadow-sm">
                              {b.title}
                            </h2>
                          )}
                          {b.subtitle && (
                            <p className="text-sm md:text-base text-white/80 line-clamp-2 max-w-md">
                              {b.subtitle}
                            </p>
                          )}
                          {b.cta_label && b.cta_link && (
                            <a href={b.cta_link} className="inline-block w-fit mt-1">
                              <Button
                                size="sm"
                                className="rounded-full bg-accent text-accent-foreground hover:brightness-95 font-bold px-5 shadow-md"
                              >
                                {b.cta_label}
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          {/* Seta esquerda */}
          <button
            onClick={scrollPrev}
            aria-label="Anterior"
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 h-9 w-9 md:h-11 md:w-11 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Seta direita */}
          <button
            onClick={scrollNext}
            aria-label="Próximo"
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 h-9 w-9 md:h-11 md:w-11 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === selected
                    ? "w-7 h-2 bg-accent"
                    : "w-2 h-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          {/* Contador slide — canto direito inferior */}
          <div className="absolute bottom-4 right-5 text-[11px] font-bold text-white/60 tabular-nums hidden md:block">
            {selected + 1} / {slides.length}
          </div>
        </>
      )}
    </section>
  );
}
