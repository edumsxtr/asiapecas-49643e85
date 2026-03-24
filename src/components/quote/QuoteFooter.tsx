import { Mail, Phone, MapPin } from "lucide-react";

export default function QuoteFooter() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-bold text-primary-foreground text-xs">LL</span>
              </div>
              <span className="font-bold text-lg font-['Space_Grotesk']">Lopes & Lopes</span>
            </div>
            <p className="text-sm text-secondary-foreground/70">
              Distribuidor autorizado de peças originais XCMG para mineração, construção, perfuração e movimentação de cargas.
            </p>
          </div>

          {/* Segments */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">Segmentos</h4>
            <ul className="space-y-1.5 text-sm text-secondary-foreground/70">
              <li>Mineração</li>
              <li>Linha Amarela (Construção)</li>
              <li>Perfuratriz</li>
              <li>Guindaste</li>
              <li>Caminhão Elétrico</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">Contato</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> contato@lopeslopes.com.br</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> (35) 0000-0000</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Pouso Alegre - MG, Brasil</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-8 pt-6 text-center text-xs text-secondary-foreground/50">
          © {new Date().getFullYear()} Lopes & Lopes — Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}
