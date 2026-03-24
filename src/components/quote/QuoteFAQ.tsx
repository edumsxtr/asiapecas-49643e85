import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle } from "lucide-react";

const faqs = [
  {
    q: "Qual o prazo de entrega das peças?",
    a: "Para peças em estoque, o prazo de envio é de 1 a 3 dias úteis. Para peças sob encomenda, o prazo varia de 15 a 45 dias conforme a origem.",
  },
  {
    q: "As peças possuem garantia?",
    a: "Sim. Todas as peças originais XCMG possuem garantia de fábrica. O prazo de garantia varia conforme o tipo de peça e aplicação.",
  },
  {
    q: "Como faço para rastrear meu pedido?",
    a: "Após a confirmação do pedido, você receberá um código de rastreamento por e-mail. Também é possível acompanhar pelo WhatsApp com nosso atendimento.",
  },
  {
    q: "Vocês atendem fora do Brasil?",
    a: "Sim! Atendemos Venezuela, Guiana e outros países da América Latina. Entre em contato para cotação com frete internacional.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Aceitamos boleto bancário, transferência/PIX, e cartão de crédito (parcelamento sob consulta). Para exportação, trabalhamos com carta de crédito e TT.",
  },
  {
    q: "Como sei se a peça é compatível com minha máquina?",
    a: "Nosso sistema possui pesquisa de compatibilidade por IA. Ao consultar uma peça, você verá os modelos compatíveis. Em caso de dúvida, fale com nossos especialistas.",
  },
];

export default function QuoteFAQ() {
  return (
    <section className="bg-muted/30 py-16">
      <div className="max-w-3xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-foreground">Perguntas Frequentes</h2>
          <p className="text-muted-foreground">Tire suas dúvidas sobre peças, entregas e pagamentos</p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg border px-4">
              <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center">
          <a
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[hsl(142,71%,45%)] text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="h-5 w-5" />
            Fale com um Especialista
          </a>
        </div>
      </div>
    </section>
  );
}
