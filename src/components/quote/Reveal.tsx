import type { ReactNode } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Atraso do stagger em ms (aplicado só quando visível). */
  delay?: number;
}

/**
 * Envolve uma seção e a revela (fade + translateY) ao entrar na viewport.
 * Não altera o layout: renderiza um wrapper block full-width.
 */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-all duration-700 ease-out will-change-[opacity,transform] motion-reduce:transition-none motion-reduce:transform-none",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
