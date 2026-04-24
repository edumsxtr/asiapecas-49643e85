import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Lang } from "./translations";
import { Button } from "@/components/ui/button";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  cta_link: string | null;
}

export default function HeroCarousel({ lang, fallback }: { lang: Lang; fallback: React.ReactNode }) {
  const { data: banners } = useQuery({
    queryKey: ["vitrine-banners", lang],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("vitrine_banners")
        .select("id, image_url, title, subtitle, cta_label, cta_link")
        .eq("active", true)
        .or(`lang.eq.${lang},lang.eq.all`)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("sort_order", { ascending: true });
      return (data || []) as Banner[];
    },
    staleTime: 60_000,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5500, stopOnInteraction: false })]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setSelected(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  if (!banners || banners.length === 0) return <>{fallback}</>;

  return (
    <section className="relative bg-secondary text-secondary-foreground">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((b) => (
            <div key={b.id} className="relative flex-[0_0_100%] min-w-0">
              <div className="relative h-[260px] sm:h-[360px] md:h-[440px]">
                <img src={b.image_url} alt={b.title || "Banner"} className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/70 to-transparent" />
                <div className="relative max-w-6xl mx-auto h-full px-6 flex flex-col justify-center max-w-md md:max-w-xl gap-3">
                  {b.title && <h2 className="text-3xl md:text-5xl font-bold font-['Space_Grotesk'] tracking-tight">{b.title}</h2>}
                  {b.subtitle && <p className="text-base md:text-lg text-secondary-foreground/80">{b.subtitle}</p>}
                  {b.cta_label && b.cta_link && (
                    <a href={b.cta_link} className="inline-block w-fit">
                      <Button size="lg" className="rounded-full">{b.cta_label}</Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button onClick={() => emblaApi?.scrollPrev()} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 text-foreground flex items-center justify-center shadow hover:bg-background">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => emblaApi?.scrollNext()} aria-label="Próximo" className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 text-foreground flex items-center justify-center shadow hover:bg-background">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => emblaApi?.scrollTo(i)} aria-label={`Slide ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6 bg-primary" : "w-1.5 bg-secondary-foreground/40"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
