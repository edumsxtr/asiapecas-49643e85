import { useEffect, useRef, useState } from "react";

interface UseRevealOptions {
  /** Fração da seção visível para disparar (0–1). */
  threshold?: number;
  /** Margem do root do observer. */
  rootMargin?: string;
}

/**
 * Revela um elemento conforme ele entra/sai da viewport (bidirecional:
 * some ao sair, reaparece ao voltar). Respeita `prefers-reduced-motion`:
 * nesse caso o elemento fica sempre visível.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {},
) {
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px" } = options;
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, visible };
}
