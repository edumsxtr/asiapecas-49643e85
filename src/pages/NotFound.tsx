import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/lib/seo";
import asiaLogo from "@/assets/asia-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: rota inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <SEO
        title="Página não encontrada (404) · Ásia Peças"
        description="A página que você procura não existe ou foi movida."
        noindex
      />

      <Link to="/" aria-label="Ásia Peças & Máquinas">
        <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-12 w-auto" />
      </Link>

      <div className="space-y-2">
        <p className="font-display text-6xl font-extrabold tracking-tight text-primary leading-none">404</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          A página que você procura não existe, foi movida ou o endereço está incorreto.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:brightness-95 transition"
        >
          Voltar ao início
        </Link>
        <Link
          to="/pecas"
          className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition"
        >
          Ver peças
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
