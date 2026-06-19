import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle } from "lucide-react";
import { type Lang, tr } from "./translations";

const FAQ_KEYS = [1, 2, 3, 4, 5, 6] as const;

export default function QuoteFAQ({ lang }: { lang: Lang }) {
  return (
    <section className="bg-muted/30 py-16">
      <div className="max-w-3xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold font-display text-foreground">{tr("faq.title", lang)}</h2>
          <p className="text-muted-foreground">{tr("faq.subtitle", lang)}</p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_KEYS.map((n) => (
            <AccordionItem key={n} value={`faq-${n}`} className="bg-card rounded-lg border px-4">
              <AccordionTrigger className="text-left text-sm font-medium">{tr(`faq.q${n}` as any, lang)}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{tr(`faq.a${n}` as any, lang)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center">
          <a
            href="https://wa.me/5595974009289?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20um%20especialista%20XCMG"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="h-5 w-5" />
            {tr("faq.specialist", lang)}
          </a>
        </div>
      </div>
    </section>
  );
}
