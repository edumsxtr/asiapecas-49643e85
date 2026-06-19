import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = [
  { q: "Qual o prazo de entrega das peças?", a: "Peças em estoque são expedidas em até 48 horas úteis. Itens sob encomenda têm prazo informado durante a cotação, geralmente entre 15 e 45 dias." },
  { q: "As peças possuem garantia?", a: "Sim. Peças originais XCMG têm garantia de fábrica conforme o tipo de componente. Detalhes na página de Política de Garantia." },
  { q: "Vocês atendem fora do Brasil?", a: "Sim. Atendemos clientes na Venezuela e Guiana com regularidade, e avaliamos demandas pontuais para outros países da América Latina." },
  { q: "Quais formas de pagamento são aceitas?", a: "Boleto bancário, transferência, PIX e cartão de crédito. Para exportação trabalhamos com carta de crédito e TT." },
  { q: "Como verifico a compatibilidade com minha máquina?", a: "Cada ficha de produto traz os modelos compatíveis identificados pela nossa equipe técnica. Em caso de dúvida, nosso consultor confirma antes da emissão da proposta." },
  { q: "Emitem nota fiscal?", a: "Sim. Toda venda é acompanhada de nota fiscal eletrônica e documentação fiscal de transporte." },
];

export default function FAQPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <InstitutionalLayout
      title="Perguntas Frequentes"
      description="Tire dúvidas sobre prazos, garantia, pagamentos, compatibilidade e atendimento internacional."
      canonical="/faq"
      crumbs={[{ label: "FAQ" }]}
      jsonLd={ld}
    >
      <Accordion type="single" collapsible className="not-prose space-y-2">
        {FAQ.map((f, i) => (
          <AccordionItem key={i} value={`q${i}`} className="bg-card border rounded-lg px-4">
            <AccordionTrigger className="text-left font-medium text-sm">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </InstitutionalLayout>
  );
}
