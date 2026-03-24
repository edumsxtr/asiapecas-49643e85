import { Mail, Phone, MapPin } from "lucide-react";
import { type Lang, tr } from "./translations";
import eliteLogo from "@/assets/elite-logo.png";

export default function QuoteFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src={eliteLogo} alt="Elite Peças XCMG" className="h-8 w-auto rounded-lg" />
              <span className="font-bold text-lg font-['Space_Grotesk']">Elite Peças XCMG</span>
            </div>
            <p className="text-sm text-secondary-foreground/70">{tr("footer.about", lang)}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">{tr("footer.segments", lang)}</h4>
            <ul className="space-y-1.5 text-sm text-secondary-foreground/70">
              <li>{tr("footer.mining", lang)}</li>
              <li>{tr("footer.construction", lang)}</li>
              <li>{tr("footer.drilling", lang)}</li>
              <li>{tr("footer.crane", lang)}</li>
              <li>{tr("footer.eTruck", lang)}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">{tr("footer.contact", lang)}</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> contato@elitepecas.com.br</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> (95) 9 7400-9289</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Brasil | Venezuela | Guiana</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-8 pt-6 text-center text-xs text-secondary-foreground/50">
          © {new Date().getFullYear()} Elite Peças XCMG — {tr("footer.rights", lang)}
        </div>
      </div>
    </footer>
  );
}
