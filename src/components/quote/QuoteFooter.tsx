import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { type Lang, tr } from "./translations";
import asiaLogo from "@/assets/asia-logo.png";

export default function QuoteFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-9 w-auto rounded" />
              <span className="font-bold text-base font-['Space_Grotesk']">Ásia Peças & Máquinas</span>
            </div>
            <p className="text-xs text-secondary-foreground/70 leading-relaxed">{tr("footer.about", lang)}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-widest text-primary">Empresa</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link to="/sobre" className="hover:text-primary">Sobre nós</Link></li>
              <li><Link to="/contato" className="hover:text-primary">Contato</Link></li>
              <li><Link to="/blog" className="hover:text-primary">Blog técnico</Link></li>
              <li><Link to="/faq" className="hover:text-primary">Perguntas frequentes</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-widest text-primary">Atendimento</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link to="/garantia" className="hover:text-primary">Política de garantia</Link></li>
              <li><Link to="/trocas-e-devolucoes" className="hover:text-primary">Trocas e devoluções</Link></li>
              <li><Link to="/entrega-e-frete" className="hover:text-primary">Entrega e frete</Link></li>
              <li><Link to="/politica-de-privacidade" className="hover:text-primary">Política de privacidade</Link></li>
              <li><Link to="/termos-de-uso" className="hover:text-primary">Termos de uso</Link></li>
              <li><Link to="/politica-de-cookies" className="hover:text-primary">Política de cookies</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-widest text-primary">{tr("footer.contact", lang)}</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> contato@asiapecas.com.br</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> (95) 9 7400-9289</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Boa Vista — RR, Brasil</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-10 pt-6 text-center text-xs text-secondary-foreground/60">
          © {new Date().getFullYear()} Ásia Peças & Máquinas. {tr("footer.rights", lang)}.
        </div>
      </div>
    </footer>
  );
}
