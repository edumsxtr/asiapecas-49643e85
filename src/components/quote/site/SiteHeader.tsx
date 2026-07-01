import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, LogIn, Menu, Phone, Mail, ChevronDown,
  Pickaxe, Construction, Drill, Container, Truck, Cog, Wrench,
  Filter, Circle, Waves, Gauge, ArrowLeftRight, Zap, Disc3, Layers, Cylinder, RotateCcw } from "lucide-react";
import asiaLogo from "@/assets/asia-logo.png";
import asiaLogoDesktop from "@/assets/asia-logo-desktop.png";
import { type Lang } from "@/components/quote/translations";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

type Props = {
  lang: Lang;
  search: string;
  onSearchChange: (v: string) => void;
  cartCount: number;
  onOpenCart?: () => void;
};

const TICKER_ITEMS: { label: string; href?: string; icon?: React.ReactNode }[] = [
  { label: "Distribuidor Autorizado XCMG" },
  { label: "Brasil · Venezuela · Guiana" },
  { label: "vendas@asiapecas.com", href: "mailto:vendas@asiapecas.com", icon: <Mail className="h-3 w-3 inline shrink-0" /> },
  { label: "(31) 99516-5511", href: "tel:+5531995165511", icon: <Phone className="h-3 w-3 inline shrink-0" /> },
  { label: "(31) 98733-4504", href: "tel:+5531987334504", icon: <Phone className="h-3 w-3 inline shrink-0" /> },
  { label: "Peças Originais e Compatíveis XCMG" },
  { label: "Entrega para todo o Brasil" },
  { label: "Atendimento especializado em máquinas pesadas" },
];

const MACHINE_CATS = [
  { icon: Pickaxe,      label: "Mineração",         href: "/pecas?maq=mineracao" },
  { icon: Construction, label: "Linha Amarela",      href: "/pecas?maq=linha_amarela" },
  { icon: Drill,        label: "Perfuratriz",        href: "/pecas?maq=perfuratriz" },
  { icon: Container,    label: "Guindaste",          href: "/pecas?maq=guindaste" },
  { icon: Truck,        label: "Caminhão Elétrico",  href: "/pecas?maq=caminhao_eletrico" },
];

type NavMenuItem = { label: string; href: string; icon?: React.ElementType };

// Submenu do item "Máquinas" — tipos de máquina (casam com as chaves de ModelsIndexPage)
const MACHINE_MENU: NavMenuItem[] = [
  { icon: Construction, label: "Escavadeira",      href: "/maquinas?tipo=escavadeiras" },
  { icon: Layers,       label: "Motoniveladora",   href: "/maquinas?tipo=motoniveladoras" },
  { icon: Cog,          label: "Rolo Compactador", href: "/maquinas?tipo=rolos" },
  { icon: Wrench,       label: "Retro Escavadeira", href: "/maquinas?tipo=retroescavadeiras" },
  { icon: Truck,        label: "Pá Carregadeira",  href: "/maquinas?tipo=carregadeiras" },
];

// Submenu do item "Peças" — por marca
const PECAS_MENU: NavMenuItem[] = [
  { label: "XCMG", href: "/pecas" },
];

// Mapa rota → submenu dropdown
const NAV_MENUS: Record<string, NavMenuItem[]> = {
  "/pecas": PECAS_MENU,
  "/maquinas": MACHINE_MENU,
};

const PART_CATS = [
  { icon: Filter,         label: "Filtros",               href: "/pecas?sub=Filtros" },
  { icon: RotateCcw,      label: "Rolamentos",             href: "/pecas?sub=Rolamentos" },
  { icon: Waves,          label: "Vedações e Retentores",  href: "/pecas?sub=Vedações e Retentores" },
  { icon: Gauge,          label: "Válvulas",               href: "/pecas?sub=Válvulas" },
  { icon: ArrowLeftRight, label: "Eixos e Cardans",        href: "/pecas?sub=Eixos e Cardans" },
  { icon: Zap,            label: "Bombas",                 href: "/pecas?sub=Bombas" },
  { icon: Disc3,          label: "Freios e Embreagem",     href: "/pecas?sub=Freios e Embreagem" },
  { icon: Layers,         label: "Material Rodante",       href: "/pecas?sub=Material Rodante" },
  { icon: Cylinder,       label: "Cilindros Hidráulicos",  href: "/pecas?sub=Cilindros Hidráulicos" },
  { icon: Circle,         label: "Fixadores",              href: "/pecas?sub=Fixadores" },
];

const NAV_LINKS = [
  { label: "Home",         href: "/" },
  { label: "Peças",        href: "/pecas" },
  { label: "Máquinas",     href: "/maquinas" },
  { label: "Catálogos",    href: "/catalogos" },
  { label: "Blog",         href: "/blog" },
  { label: "Fale conosco", href: "/contato" },
];

export default function SiteHeader({ lang, search, onSearchChange, cartCount, onOpenCart }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    const q = search.trim();
    navigate(q ? `/pecas?q=${encodeURIComponent(q)}` : "/pecas");
  };

  /* ─── Sheet drawer (shared between mobile + desktop hamburger) ─── */
  const DrawerContent = () => (
    <SheetContent side="left" className="w-80 bg-background overflow-y-auto">
      <SheetHeader>
        <SheetTitle>
          <img src={asiaLogo} alt="Ásia Peças" className="h-10 w-auto" />
        </SheetTitle>
      </SheetHeader>

      <form onSubmit={submitSearch} className="mt-4 flex h-9 rounded-full border-2 border-foreground/15 overflow-hidden">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar peça…"
          aria-label="Buscar peça"
          className="flex-1 px-4 text-sm bg-transparent outline-none"
        />
        <button className="bg-primary text-primary-foreground px-4">
          <Search className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/45 px-1 mb-2">Por Máquina</p>
        {MACHINE_CATS.map((c) => (
          <Link key={c.label} to={c.href} onClick={() => setOpen(false)}
            className="flex items-center gap-3 py-2.5 border-b border-foreground/8 text-sm font-semibold">
            <c.icon className="h-4 w-4 text-primary" /> {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/45 px-1 mb-2">Por Tipo de Peça</p>
        {PART_CATS.map((c) => (
          <Link key={c.label} to={c.href} onClick={() => setOpen(false)}
            className="flex items-center gap-3 py-2.5 border-b border-foreground/8 text-sm">
            <c.icon className="h-4 w-4 text-primary" /> {c.label}
          </Link>
        ))}
      </div>

      <nav className="flex flex-col mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/45 px-1 mb-2">Navegação</p>
        {NAV_LINKS.map((l) => {
          const menu = NAV_MENUS[l.href];
          return menu ? (
            <div key={l.label} className="border-b border-foreground/10">
              <button
                type="button"
                onClick={() => setOpenMenu((o) => (o === l.href ? null : l.href))}
                aria-expanded={openMenu === l.href}
                className="w-full flex items-center justify-between py-3 text-sm font-semibold uppercase tracking-wider"
              >
                {l.label}
                <ChevronDown className={`h-4 w-4 transition-transform ${openMenu === l.href ? "rotate-180" : ""}`} />
              </button>
              {openMenu === l.href && (
                <div className="pb-2">
                  {menu.map((m) => (
                    <Link key={m.label} to={m.href} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 py-2.5 pl-3 text-sm">
                      {m.icon && <m.icon className="h-4 w-4 text-primary shrink-0" />} {m.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link key={l.label} to={l.href} onClick={() => setOpen(false)}
              className="py-3 border-b border-foreground/10 text-sm font-semibold uppercase tracking-wider">
              {l.label}
            </Link>
          );
        })}
        {!user && (
          <Link to="/portal/login" onClick={() => setOpen(false)}
            className="py-3 border-b border-foreground/10 text-sm font-semibold uppercase tracking-wider inline-flex items-center gap-2">
            <LogIn className="h-4 w-4" /> Entrar
          </Link>
        )}
      </nav>

      <a
        href="https://wa.me/5531995165511?text=Ol%C3%A1%2C%20preciso%20de%20uma%20cota%C3%A7%C3%A3o%20XCMG"
        target="_blank" rel="noopener noreferrer"
        className="mt-6 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold text-sm py-3 rounded-full"
      >
        <WhatsAppIcon className="h-5 w-5" /> WhatsApp Vendas
      </a>
    </SheetContent>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-40 bg-background shadow-sm">

        {/* Topbar ticker */}
        <div className="bg-accent text-accent-foreground text-[11px] overflow-hidden">
          <div className="ticker-track py-2 select-none">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center gap-0 shrink-0">
                {TICKER_ITEMS.map((item, i) => (
                  <span key={i} className="flex items-center gap-6 px-6">
                    {item.href ? (
                      <a href={item.href} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity whitespace-nowrap">
                        {item.icon} {item.label}
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 whitespace-nowrap uppercase tracking-[0.16em] font-semibold">
                        {item.icon} {item.label}
                      </span>
                    )}
                    <span className="text-accent-foreground/30 text-base leading-none">★</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Logo + Search + Actions */}
        <div className="bg-background border-b border-foreground/10">
          <div className="max-w-7xl mx-auto px-4 md:px-6">

            {/* Linha principal */}
            <div className="py-[7px] flex items-center gap-3 md:gap-4">

              {/* Logo — tamanho fixo, não encolhe (versão horizontal no desktop) */}
              <Link to="/cotacao" className="shrink-0 md:ml-4 lg:ml-10">
                <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-12 w-auto md:hidden" />
                <img src={asiaLogoDesktop} alt="Ásia Peças & Máquinas" className="hidden md:block h-[67px] w-auto" />
              </Link>

              {/* Busca — mobile, na MESMA linha da logo (encolhe conforme o espaço) */}
              <form
                onSubmit={submitSearch}
                className="md:hidden flex-1 min-w-0 flex items-stretch h-9 rounded-full border border-foreground/20 focus-within:border-primary overflow-hidden transition-colors"
              >
                <input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar peça ou código…"
                  aria-label="Buscar peça ou código"
                  inputMode="search"
                  className="flex-1 min-w-0 px-3 text-sm bg-transparent outline-none text-foreground placeholder:text-foreground/40"
                />
                <button
                  type="submit"
                  aria-label="Buscar"
                  className="bg-primary text-primary-foreground px-3.5 inline-flex items-center justify-center hover:brightness-95 transition shrink-0"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>

              {/* Busca — desktop, centralizada e ocupando o meio */}
              <div className="hidden md:flex flex-1 justify-center px-4">
                <form
                  onSubmit={submitSearch}
                  className="w-full max-w-lg flex items-stretch h-10 rounded-full border border-foreground/20 focus-within:border-primary overflow-hidden transition-colors"
                >
                  <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar peça, código ou modelo…"
                    aria-label="Buscar peça, código ou modelo"
                    className="flex-1 min-w-0 px-5 text-sm bg-transparent outline-none text-foreground placeholder:text-foreground/40"
                  />
                  <button
                    type="submit"
                    aria-label="Buscar"
                    className="bg-primary text-primary-foreground px-5 font-bold text-sm inline-flex items-center gap-1.5 hover:brightness-95 transition"
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden lg:inline">Buscar</span>
                  </button>
                </form>
              </div>

              {/* Grupo à direita: ações */}
              <div className="flex items-center gap-2 md:gap-3 shrink-0">

                {/* Entrar / Minhas cotações (desktop) */}
                {user ? (
                  <Link to="/minhas-cotacoes"
                    className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/75 hover:text-foreground transition-colors">
                    <User className="h-4 w-4" /> Minhas cotações
                  </Link>
                ) : (
                  <Link to="/portal/login"
                    className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/75 hover:text-foreground transition-colors">
                    <LogIn className="h-4 w-4" /> Entrar
                  </Link>
                )}

                {/* Cotação (carrinho) */}
                <button
                  onClick={onOpenCart}
                  className="relative inline-flex items-center gap-1.5 bg-foreground text-background px-3 md:px-4 h-9 rounded-full font-semibold text-xs hover:bg-foreground/85 transition"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden md:inline uppercase tracking-wider">Cotação</span>
                  {cartCount > 0 && (
                    <span className="bg-accent text-accent-foreground h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Hamburger — mobile only (desktop usa a nav bar abaixo) */}
                <SheetTrigger asChild>
                  <button className="md:hidden p-2 rounded-lg hover:bg-foreground/10" aria-label="Menu">
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
              </div>
            </div>
          </div>
        </div>

        {/* Nav bar — desktop */}
        <nav className="hidden md:block bg-primary text-primary-foreground shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-center">

            {/* Nav links — centralizados */}
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((l) => {
                const menu = NAV_MENUS[l.href];
                return menu ? (
                  <li key={l.label} className="relative group">
                    <Link
                      to={l.href}
                      className="flex items-center gap-1 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] hover:bg-white/15 group-hover:bg-white/15 transition-colors rounded-sm"
                    >
                      {l.label}
                      <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                    </Link>

                    {/* Dropdown — abre ao passar o mouse (pt-1 = ponte de hover) */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 min-w-[170px] pt-1
                      opacity-0 invisible translate-y-1
                      group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                      transition-all duration-150">
                      <ul className="bg-primary text-primary-foreground rounded-sm shadow-lg overflow-hidden py-1">
                        {menu.map((m) => (
                          <li key={m.label}>
                            <Link
                              to={m.href}
                              className="block px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] whitespace-nowrap hover:bg-white/15 transition-colors"
                            >
                              {m.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ) : (
                  <li key={l.label}>
                    <Link
                      to={l.href}
                      className="block px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] hover:bg-white/15 transition-colors rounded-sm"
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

      </header>

      <DrawerContent />
    </Sheet>
  );
}
