import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { type Lang, tr } from "./translations";
import asiaLogo from "@/assets/asia-logo.png";

const INSTITUTIONAL = [
  { href: "/sobre", pt: "Sobre a empresa", en: "About the company", es: "Sobre la empresa" },
  { href: "/contato", pt: "Contato", en: "Contact", es: "Contacto" },
  { href: "/blog", pt: "Blog técnico", en: "Technical blog", es: "Blog técnico" },
  { href: "/garantia", pt: "Garantia", en: "Warranty", es: "Garantía" },
  { href: "/trocas-e-devolucoes", pt: "Trocas e devoluções", en: "Returns", es: "Cambios y devoluciones" },
];

const LEGAL = [
  { href: "/politica-de-privacidade", pt: "Política de Privacidade", en: "Privacy Policy", es: "Política de Privacidad" },
  { href: "/termos-de-uso", pt: "Termos de Uso", en: "Terms of Use", es: "Términos de Uso" },
  { href: "/politica-de-cookies", pt: "Política de Cookies", en: "Cookie Policy", es: "Política de Cookies" },
  { href: "/seguranca-e-compliance", pt: "Segurança e Compliance", en: "Security & Compliance", es: "Seguridad y Compliance" },
];

const pick = (item: { pt: string; en: string; es: string }, lang: Lang) => item[lang];

export default function QuoteFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-3 md:col-span-1">
            <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-12 w-auto" />
            <p className="text-xs text-secondary-foreground/70 leading-relaxed">
              {tr("footer.about", lang)}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[11px] uppercase tracking-widest text-primary">{tr("footer.segments", lang)}</h4>
            <ul className="space-y-1.5 text-sm text-secondary-foreground/75">
              <li>{tr("footer.mining", lang)}</li>
              <li>{tr("footer.construction", lang)}</li>
              <li>{tr("footer.drilling", lang)}</li>
              <li>{tr("footer.crane", lang)}</li>
              <li>{tr("footer.eTruck", lang)}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[11px] uppercase tracking-widest text-primary">
              {lang === "en" ? "Institutional" : lang === "es" ? "Institucional" : "Institucional"}
            </h4>
            <ul className="space-y-1.5 text-sm text-secondary-foreground/75">
              {INSTITUTIONAL.map((i) => (
                <li key={i.href}><Link to={i.href} className="hover:text-primary transition-colors">{pick(i, lang)}</Link></li>
              ))}
            </ul>
            <h4 className="font-semibold text-[11px] uppercase tracking-widest text-primary pt-2">
              {lang === "en" ? "Legal" : "Legal"}
            </h4>
            <ul className="space-y-1.5 text-sm text-secondary-foreground/75">
              {LEGAL.map((i) => (
                <li key={i.href}><Link to={i.href} className="hover:text-primary transition-colors">{pick(i, lang)}</Link></li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[11px] uppercase tracking-widest text-primary">{tr("footer.contact", lang)}</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/75">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> vendas@asiapecas.com</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> (31) 99229-3767</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> (31) 98733-4504</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Brasil — Venezuela — Guiana</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-secondary-foreground/55">
          <p>© {new Date().getFullYear()} Ásia Peças &amp; Máquinas. {tr("footer.rights", lang)}.</p>
          <p>{lang === "en" ? "Authorized XCMG distributor" : lang === "es" ? "Distribuidor autorizado XCMG" : "Distribuidor autorizado XCMG"}</p>
        </div>
      </div>
    </footer>
  );
}
