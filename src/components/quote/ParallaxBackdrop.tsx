import { useParallax } from "@/hooks/use-parallax";
import { cn } from "@/lib/utils";

interface ParallaxBackdropProps {
  /** URL da imagem de fundo. Se ausente, renderiza um grafismo sutil. */
  image?: string;
  /** Overlay por cima da camada, para legibilidade do texto (ex.: "bg-primary/80"). */
  overlayClassName?: string;
  /** Intensidade do parallax (0–1). */
  speed?: number;
  className?: string;
}

/**
 * Camada de fundo posicionada em `absolute inset-0` dentro de uma seção
 * `relative overflow-hidden`. A camada interna tem folga vertical e desliza
 * (translate3d) conforme o scroll, criando profundidade. Decorativa (aria-hidden).
 */
export default function ParallaxBackdrop({
  image,
  overlayClassName,
  speed,
  className,
}: ParallaxBackdropProps) {
  const { ref, offset } = useParallax<HTMLDivElement>(speed);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="absolute -inset-y-[20%] inset-x-0 will-change-transform"
        style={{ transform: `translate3d(0, ${offset}px, 0)` }}
      >
        {image ? (
          <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          // Grafismo industrial: linhas diagonais esmaecidas
          <div
            className="h-full w-full opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, currentColor 0, currentColor 2px, transparent 2px, transparent 22px)",
            }}
          />
        )}
      </div>

      {overlayClassName && <div className={cn("absolute inset-0", overlayClassName)} />}
    </div>
  );
}
