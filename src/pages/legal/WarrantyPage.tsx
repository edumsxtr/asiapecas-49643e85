import LegalPageShell from "@/components/legal/LegalPageShell";

export default function WarrantyPage() {
  return (
    <LegalPageShell
      title="Garantia de Peças Originais XCMG | Ásia Peças & Máquinas"
      description="Política de garantia para peças originais XCMG distribuídas pela Ásia Peças & Máquinas: cobertura, prazos, exclusões e procedimento de acionamento."
      canonical="/garantia"
      updatedAt="19 de junho de 2026"
    >
      <p>
        As peças originais XCMG comercializadas pela Ásia Peças &amp; Máquinas são cobertas por garantia de fábrica contra defeitos
        de fabricação, observadas as condições descritas nesta página e nas políticas do fabricante.
      </p>

      <h2>1. Cobertura</h2>
      <p>
        A garantia cobre defeitos de fabricação que comprometam a função técnica da peça, identificáveis em condições normais de
        uso, instalação e manutenção conforme manual da máquina.
      </p>

      <h2>2. Prazo</h2>
      <p>
        O prazo padrão é o prazo de garantia indicado pelo fabricante para o item específico, contado a partir da data da nota
        fiscal de venda. Componentes considerados de desgaste natural seguem prazos próprios.
      </p>

      <h2>3. Acionamento</h2>
      <ol>
        <li>Identifique o número do pedido, a nota fiscal e o código da peça.</li>
        <li>Reúna registros do defeito (fotos, vídeos, leituras do sistema da máquina).</li>
        <li>Envie a solicitação para <a href="mailto:vendas@asiapecas.com">vendas@asiapecas.com</a> com o assunto "Garantia — [código da peça]".</li>
        <li>Aguarde a triagem técnica e as orientações para envio do item, quando necessário.</li>
      </ol>

      <h2>4. Exclusões</h2>
      <ul>
        <li>Desgaste natural compatível com o uso.</li>
        <li>Instalação incorreta, fora das especificações do manual.</li>
        <li>Uso de fluidos, óleos ou peças de terceiros incompatíveis.</li>
        <li>Operação em condições não previstas pelo fabricante.</li>
        <li>Avarias por acidente, mau uso, sobrecarga, modificação não autorizada ou falta de manutenção preventiva.</li>
        <li>Manuseio inadequado durante transporte realizado pelo cliente.</li>
      </ul>

      <h2>5. Análise técnica</h2>
      <p>
        A peça reclamada é submetida a análise pela equipe técnica e, quando aplicável, pelo fabricante. O resultado define se o
        caso é coberto pela garantia, com substituição, conserto ou crédito do item, conforme decisão do fabricante.
      </p>

      <h2>6. Custos</h2>
      <p>
        Casos cobertos pela garantia não geram custo para o cliente quanto à reposição da peça. Despesas com mão de obra, viagens,
        diárias, frete de envio ao laboratório e lucros cessantes não são cobertas, salvo previsão contratual específica.
      </p>

      <h2>7. Suporte</h2>
      <p>
        Dúvidas sobre garantia podem ser direcionadas ao canal comercial pelo telefone (31) 99516-5511 ou pelo e-mail
        <a href="mailto:vendas@asiapecas.com"> vendas@asiapecas.com</a>.
      </p>
    </LegalPageShell>
  );
}
