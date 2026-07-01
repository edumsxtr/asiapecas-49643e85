import { useEffect, useRef, useState } from "react";

/**
 * Deslocamento vertical (px) para uma camada de fundo em parallax.
 * Só ativa no desktop (pointer fino + largura ≥ 768px) e sem `prefers-reduced-motion`.
 * Em touch/mobile ou reduced-motion o offset fica fixo em 0 (fundo estático).
 *
 * O elemento com o `ref` deve cobrir a seção; a camada interna que recebe o
 * `offset` precisa ter folga vertical (ex.: `-inset-y-[20%]`) para nunca vazar.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(speed = 0.18) {
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const canParallax =
      window.matchMedia("(min-width: 768px)").matches &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canParallax) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Progresso do centro da seção em relação ao centro da viewport: ~ -0.5..0.5
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      setOffset(-progress * speed * rect.height);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return { ref, offset };
}
