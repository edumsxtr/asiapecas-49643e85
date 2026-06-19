import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { partImage } from "@/lib/default-part-image";

interface Props {
  images: { url: string; alt_text?: string | null }[];
  fallbackUrl?: string | null;
  alt: string;
}

export function PartImageCarousel({ images, fallbackUrl, alt }: Props) {
  const list = images.length > 0 ? images : [{ url: partImage(fallbackUrl), alt_text: alt }];
  const [active, setActive] = useState(0);

  if (list.length === 1) {
    return (
      <div className="aspect-square bg-muted rounded-xl overflow-hidden">
        <img src={list[0].url} alt={list[0].alt_text || alt} className="w-full h-full object-cover" loading="eager" fetchPriority="high" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Carousel className="w-full">
        <CarouselContent>
          {list.map((img, i) => (
            <CarouselItem key={i}>
              <div className="aspect-square bg-muted rounded-xl overflow-hidden">
                <img
                  src={img.url}
                  alt={img.alt_text || `${alt} - foto ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
      <div className="grid grid-cols-5 gap-2">
        {list.slice(0, 5).map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
              active === i ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
            }`}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
