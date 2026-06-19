import { MessageCircle } from "lucide-react";

export default function WhatsAppCTA() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-display font-extrabold text-xl md:text-2xl uppercase tracking-tight leading-tight">
            Precisa de uma peça com urgência?
          </p>
          <p className="text-sm text-primary-foreground/80 mt-1">
            Fale agora com nossa equipe comercial pelo WhatsApp · (31) 99229-3767 · (31) 98733-4504
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="https://wa.me/5531992293767?text=Ol%C3%A1%2C%20preciso%20de%20uma%20cota%C3%A7%C3%A3o%20XCMG"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-foreground text-background px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2 hover:bg-foreground/85 transition"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp Vendas
          </a>
        </div>
      </div>
    </section>
  );
}
