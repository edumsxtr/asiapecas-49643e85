import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Mail, MapPin, Phone } from "lucide-react";
import asiaLogo from "@/assets/asia-logo.png";
import { SEO, breadcrumbLd } from "@/lib/seo";

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  description: string;
  canonical: string;
  crumbs?: Crumb[];
  jsonLd?: Record<string, any> | Record<string, any>[];
  children: ReactNode;
}

const NAV = [
  { label: "Catálogo", href: "/cotacao" },
  { label: "Categorias", href: "/cotacao/categorias" },
  { label: "Modelos", href: "/cotacao/modelos" },
  { label: "Blog", href: "/blog" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
];

export function InstitutionalLayout({ title, description, canonical, crumbs = [], jsonLd, children }: Props) {
  const breadcrumbsJsonLd = [{ name: "Início", url: "/" }, ...crumbs.map((c) => ({ name: c.label, url: c.href || canonical }))];
  const lds = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        jsonLd={[breadcrumbLd(breadcrumbsJsonLd), ...lds]}
      />

      <header className="bg-secondary text-secondary-foreground border-b border-secondary-foreground/10">
        <div className="border-b border-secondary-foreground/10 bg-black/40">
          <div className="max-w-6xl mx-auto px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-secondary-foreground/70">
            <span className="hidden sm:inline">Distribuidor autorizado XCMG — Brasil, Venezuela e Guiana</span>
            <div className="flex items-center gap-4">
              <a href="tel:+5595974009289" className="inline-flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" />(95) 9 7400-9289</a>
              <a href="mailto:contato@asiapecas.com.br" className="hidden md:inline-flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" />contato@asiapecas.com.br</a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link to="/cotacao" className="flex items-center gap-3">
            <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-10 w-auto rounded" />
            <div>
              <p className="font-display font-bold text-sm tracking-tight">Ásia Peças & Máquinas</p>
              <p className="text-[10px] uppercase tracking-widest text-secondary-foreground/60">Peças XCMG originais</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} to={n.href} className="text-secondary-foreground/80 hover:text-primary transition-colors">{n.label}</Link>
            ))}
          </nav>
        </div>
      </header>

      {crumbs.length > 0 && (
        <nav aria-label="Trilha de navegação" className="border-b bg-muted/30">
          <ol className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Início</Link></li>
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                {c.href && i < crumbs.length - 1 ? <Link to={c.href} className="hover:text-primary">{c.label}</Link> : <span className="text-foreground">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <header className="mb-8 pb-6 border-b">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">{description}</p>
          </header>
          <div className="prose-institutional space-y-6 text-foreground/90 leading-relaxed">
            {children}
          </div>
        </article>
      </main>

      <footer className="bg-secondary text-secondary-foreground mt-16">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-10 w-auto rounded" />
            <p className="text-xs text-secondary-foreground/70 leading-relaxed">
              Distribuidor autorizado de peças originais XCMG para mineração, linha amarela, perfuração, guindastes e caminhões elétricos.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Empresa</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link to="/sobre" className="hover:text-primary">Sobre nós</Link></li>
              <li><Link to="/contato" className="hover:text-primary">Contato</Link></li>
              <li><Link to="/blog" className="hover:text-primary">Blog técnico</Link></li>
              <li><Link to="/faq" className="hover:text-primary">Perguntas frequentes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Atendimento</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link to="/garantia" className="hover:text-primary">Política de garantia</Link></li>
              <li><Link to="/trocas-e-devolucoes" className="hover:text-primary">Trocas e devoluções</Link></li>
              <li><Link to="/entrega-e-frete" className="hover:text-primary">Entrega e frete</Link></li>
              <li><Link to="/cotacao" className="hover:text-primary">Solicitar cotação</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Institucional</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link to="/politica-de-privacidade" className="hover:text-primary">Política de privacidade</Link></li>
              <li><Link to="/termos-de-uso" className="hover:text-primary">Termos de uso</Link></li>
              <li><Link to="/politica-de-cookies" className="hover:text-primary">Política de cookies</Link></li>
            </ul>
            <div className="mt-4 space-y-1 text-xs text-secondary-foreground/70">
              <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-primary" />(95) 9 7400-9289</p>
              <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-primary" />contato@asiapecas.com.br</p>
              <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary" />Boa Vista — RR, Brasil</p>
            </div>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/10">
          <div className="max-w-6xl mx-auto px-6 py-4 text-center text-xs text-secondary-foreground/60">
            © {new Date().getFullYear()} Ásia Peças & Máquinas. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
