import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, LogIn, Menu, Phone, Mail, ChevronDown } from "lucide-react";
import asiaLogo from "@/assets/asia-logo.png";
import { type Lang } from "@/components/quote/translations";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Props = {
  lang: Lang;
  search: string;
  onSearchChange: (v: string) => void;
  cartCount: number;
  onOpenCart?: () => void;
};

const NAV_LINKS: { label: string; href: string; hash?: boolean }[] = [
  { label: "Início", href: "/cotacao" },
  { label: "Categorias", href: "#pecas", hash: true },
  { label: "Modelos XCMG", href: "#pecas", hash: true },
  { label: "Vitrine", href: "/cotacao/vitrine" },
  { label: "Campanhas", href: "/cotacao/banners" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/contato" },
];

export default function SiteHeader({ lang, search, onSearchChange, cartCount, onOpenCart }: Props) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof document !== "undefined") {
      document.getElementById("pecas")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Topbar institucional preta */}
      <div className="hidden md:block bg-primary text-primary-foreground/85 text-[11px]">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <span className="uppercase tracking-[0.18em] font-medium">
            Distribuidor Autorizado XCMG · Brasil · Venezuela · Guiana
          </span>
          <div className="flex items-center gap-4">
            <a href="mailto:vendas@asiapecas.com" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Mail className="h-3 w-3" /> vendas@asiapecas.com
            </a>
            <span className="text-white/20">|</span>
            <a href="tel:+5531992293767" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="h-3 w-3" /> (31) 99229-3767
            </a>
            <span className="text-white/20">|</span>
            <a href="tel:+5531987334504" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="h-3 w-3" /> (31) 98733-4504
            </a>
          </div>
        </div>
      </div>

      {/* Barra principal branca: logo + busca + ações */}
      <div className="bg-background border-b border-foreground/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4 md:gap-8">
          <Link to="/cotacao" className="flex items-center gap-3 shrink-0">
            <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-12 md:h-14 w-auto" />
            <div className="hidden sm:block leading-tight">
              <p className="font-display font-extrabold text-foreground text-base md:text-lg tracking-tight">
                ÁSIA PEÇAS
              </p>
              <p className="text-[10px] text-foreground/55 uppercase tracking-[0.2em]">& Máquinas</p>
            </div>
          </Link>

          <form onSubmit={submitSearch} className="flex-1 max-w-2xl hidden sm:flex items-stretch h-12 rounded-full border-2 border-foreground/15 focus-within:border-primary overflow-hidden transition-colors">
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar peça, código ou modelo XCMG…"
              className="flex-1 px-5 text-sm bg-transparent outline-none text-foreground placeholder:text-foreground/40"
            />
            <button type="submit" className="bg-primary text-primary-foreground px-5 md:px-7 font-bold text-sm inline-flex items-center gap-2 hover:brightness-95 transition">
              <Search className="h-4 w-4" /> <span className="hidden md:inline">Buscar</span>
            </button>
          </form>

          <div className="flex items-center gap-2 md:gap-3 ml-auto">
            {user ? (
              <Link to="/minhas-cotacoes" className="hidden md:inline-flex items-center gap-2 text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors">
                <User className="h-4 w-4" /> Minhas cotações
              </Link>
            ) : (
              <Link to="/portal/login" className="hidden md:inline-flex items-center gap-2 text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors">
                <LogIn className="h-4 w-4" /> Entrar
              </Link>
            )}

            <button
              onClick={onOpenCart}
              className="relative inline-flex items-center gap-2 bg-foreground text-background px-3 md:px-4 h-11 rounded-full font-semibold text-xs hover:bg-foreground/85 transition"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden md:inline uppercase tracking-wider">Cotação</span>
              <span className="bg-primary text-primary-foreground h-5 min-w-[20px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </button>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 rounded-lg hover:bg-foreground/10">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <img src={asiaLogo} alt="Ásia Peças" className="h-8 w-auto" />
                    ÁSIA PEÇAS
                  </SheetTitle>
                </SheetHeader>
                <form onSubmit={submitSearch} className="mt-4 flex h-11 rounded-full border-2 border-foreground/15 overflow-hidden">
                  <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar peça…"
                    className="flex-1 px-4 text-sm bg-transparent outline-none"
                  />
                  <button className="bg-primary text-primary-foreground px-4"><Search className="h-4 w-4" /></button>
                </form>
                <nav className="flex flex-col mt-4">
                  {NAV_LINKS.map((l) => (
                    l.hash ? (
                      <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="py-3 border-b border-foreground/10 text-sm font-semibold uppercase tracking-wider">
                        {l.label}
                      </a>
                    ) : (
                      <Link key={l.label} to={l.href} onClick={() => setMobileOpen(false)} className="py-3 border-b border-foreground/10 text-sm font-semibold uppercase tracking-wider">
                        {l.label}
                      </Link>
                    )
                  ))}
                  {!user && (
                    <Link to="/portal/login" onClick={() => setMobileOpen(false)} className="py-3 border-b border-foreground/10 text-sm font-semibold uppercase tracking-wider inline-flex items-center gap-2">
                      <LogIn className="h-4 w-4" /> Entrar
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Barra de navegação amarela */}
      <nav className="hidden md:block bg-primary text-primary-foreground sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center">
          <button className="flex items-center gap-2 bg-foreground text-background px-5 py-3 font-bold text-xs uppercase tracking-[0.18em]">
            <Menu className="h-4 w-4" /> Todas as Categorias <ChevronDown className="h-3 w-3" />
          </button>
          <ul className="flex items-center gap-1 ml-2">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                {l.hash ? (
                  <a href={l.href} className="block px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] hover:bg-foreground/10 transition-colors">
                    {l.label}
                  </a>
                ) : (
                  <Link to={l.href} className="block px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] hover:bg-foreground/10 transition-colors">
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <a
            href="https://wa.me/5531992293767?text=Ol%C3%A1%2C%20preciso%20de%20uma%20cota%C3%A7%C3%A3o%20XCMG"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto bg-foreground text-background px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-foreground/85 transition"
          >
            WhatsApp Vendas
          </a>
        </div>
      </nav>
    </>
  );
}
