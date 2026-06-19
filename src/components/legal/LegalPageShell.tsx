import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import asiaLogo from "@/assets/asia-logo.png";
import { Mail, Phone, MapPin } from "lucide-react";

interface Props {
  title: string;
  description: string;
  canonical: string;
  updatedAt?: string;
  jsonLd?: Record<string, any>;
  children: React.ReactNode;
}

const SITE = "https://asiapecas.lovable.app";

const NAV = [
  { href: "/cotacao", label: "Portal" },
  { href: "/blog", label: "Blog" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

const LEGAL = [
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/politica-de-cookies", label: "Política de Cookies" },
  { href: "/garantia", label: "Garantia" },
  { href: "/trocas-e-devolucoes", label: "Trocas e Devoluções" },
  { href: "/seguranca-e-compliance", label: "Segurança e Compliance" },
];

export default function LegalPageShell({ title, description, canonical, updatedAt, jsonLd, children }: Props) {
  const url = canonical.startsWith("http") ? canonical : `${SITE}${canonical}`;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <html lang="pt-BR" />
        <title>{title}</title>
        <meta name="description" content={description.slice(0, 160)} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description.slice(0, 160)} />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="Ásia Peças & Máquinas" />
        {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
      </Helmet>

      <header className="sticky top-0 z-40 bg-secondary text-secondary-foreground border-b border-secondary-foreground/10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/cotacao" className="flex items-center gap-3">
            <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="font-semibold text-sm font-['Space_Grotesk'] leading-tight">Ásia Peças &amp; Máquinas</p>
              <p className="text-[10px] text-secondary-foreground/60 uppercase tracking-wider">Distribuidor Autorizado XCMG</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} to={n.href} className="hover:text-primary transition-colors">{n.label}</Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <nav className="text-xs text-muted-foreground mb-4">
            <Link to="/cotacao" className="hover:text-primary">Início</Link>
            <span className="mx-2">/</span>
            <span>{title.split("—")[0].trim().split("|")[0].trim()}</span>
          </nav>
          <h1 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {title.split("—")[0].trim().split("|")[0].trim()}
          </h1>
          {updatedAt && (
            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
              Última atualização: {updatedAt}
            </p>
          )}
          <div className="prose prose-neutral max-w-none mt-8
            prose-headings:font-['Space_Grotesk'] prose-headings:text-foreground
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
            prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-foreground/80 prose-p:leading-relaxed
            prose-li:text-foreground/80
            prose-strong:text-foreground
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            {children}
          </div>
        </div>
      </main>

      <footer className="bg-secondary text-secondary-foreground mt-12">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-10 w-auto" />
            <p className="text-xs text-secondary-foreground/70 leading-relaxed">
              Ásia Peças &amp; Máquinas. Distribuidor autorizado de peças originais XCMG no Brasil, Venezuela e Guiana.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-primary font-semibold">Institucional</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link to="/sobre" className="hover:text-primary">Sobre a empresa</Link></li>
              <li><Link to="/contato" className="hover:text-primary">Contato</Link></li>
              <li><Link to="/garantia" className="hover:text-primary">Garantia</Link></li>
              <li><Link to="/trocas-e-devolucoes" className="hover:text-primary">Trocas e devoluções</Link></li>
              <li><Link to="/blog" className="hover:text-primary">Blog técnico</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-primary font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              {LEGAL.map((l) => (
                <li key={l.href}><Link to={l.href} className="hover:text-primary">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-primary font-semibold">Atendimento</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> contato@asiapecas.com.br</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +55 (95) 9 7400-9289</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Brasil — Venezuela — Guiana</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/10">
          <div className="max-w-6xl mx-auto px-6 py-4 text-center text-xs text-secondary-foreground/50">
            © {new Date().getFullYear()} Ásia Peças &amp; Máquinas. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
