import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";

export default function TermsPage() {
  return (
    <InstitutionalLayout
      title="Termos de Uso"
      description="Condições aplicáveis ao uso do portal e dos serviços digitais da Ásia Peças & Máquinas."
      canonical="/termos-de-uso"
      crumbs={[{ label: "Termos de Uso" }]}
    >
      <p>Última atualização: {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}.</p>

      <h2 className="font-display text-xl font-semibold mt-6">1. Aceitação</h2>
      <p>
        Ao acessar o portal da Ásia Peças & Máquinas, o usuário declara estar de acordo com estes
        Termos de Uso e com a Política de Privacidade. Caso não concorde, deve interromper a
        navegação.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">2. Natureza dos serviços</h2>
      <p>
        O portal disponibiliza catálogo de peças, conteúdo técnico e canal de solicitação de cotação.
        Preços e disponibilidade são informativos e estão sujeitos a confirmação formal por nossa
        equipe comercial antes da emissão da proposta vinculante.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">3. Cadastro e responsabilidades</h2>
      <p>
        O usuário compromete-se a fornecer informações verídicas, manter a confidencialidade de
        credenciais de acesso e utilizar o portal de forma lícita.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">4. Propriedade intelectual</h2>
      <p>
        Todo o conteúdo do portal, incluindo marcas, textos, fotografias, ilustrações, layout e
        software, é protegido por lei. A reprodução integral ou parcial sem autorização prévia e por
        escrito é proibida.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">5. Limitação de responsabilidade</h2>
      <p>
        Empenhamo-nos para manter o portal disponível e com informações precisas. Não nos
        responsabilizamos por indisponibilidades pontuais decorrentes de manutenção, força maior ou
        de terceiros, nem por decisões tomadas com base exclusivamente em informações de
        compatibilidade preliminares, que sempre devem ser validadas com nossa equipe técnica.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">6. Alterações</h2>
      <p>
        Estes Termos podem ser atualizados a qualquer tempo. A versão vigente está sempre publicada
        nesta página, com a respectiva data de atualização.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">7. Foro</h2>
      <p>
        Fica eleito o foro da comarca de Boa Vista — Roraima, Brasil, para dirimir eventuais
        controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.
      </p>
    </InstitutionalLayout>
  );
}
