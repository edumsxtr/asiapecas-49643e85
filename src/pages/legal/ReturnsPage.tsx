import LegalPageShell from "@/components/legal/LegalPageShell";

export default function ReturnsPage() {
  return (
    <LegalPageShell
      title="Trocas e Devoluções | Ásia Peças & Máquinas"
      description="Procedimento de trocas e devoluções de peças XCMG: prazos, condições de aceitação, restituição de valores e canal para abertura da solicitação."
      canonical="/trocas-e-devolucoes"
      updatedAt="19 de junho de 2026"
    >
      <p>
        Esta página descreve como solicitar trocas ou devoluções de peças adquiridas junto à Ásia Peças &amp; Máquinas, em
        conformidade com o Código de Defesa do Consumidor e com as regras aplicáveis às relações entre empresas (B2B).
      </p>

      <h2>1. Direito de arrependimento (consumidor final)</h2>
      <p>
        Para compras realizadas por consumidor final fora do estabelecimento, é assegurado o prazo de 7 (sete) dias corridos
        contados do recebimento para arrependimento, conforme o art. 49 do CDC, sem necessidade de justificativa.
      </p>

      <h2>2. Trocas por inadequação técnica</h2>
      <p>
        Quando a peça recebida não corresponder ao código solicitado, apresentar avaria de transporte ou incompatibilidade técnica
        comprovada com o modelo informado, o cliente pode solicitar troca em até 7 dias corridos do recebimento, com fotos do
        item, da embalagem e da nota fiscal.
      </p>

      <h2>3. Condições de aceitação</h2>
      <ul>
        <li>Item lacrado, sem indícios de instalação ou uso.</li>
        <li>Embalagem original preservada.</li>
        <li>Nota fiscal de compra e número do pedido.</li>
        <li>Componentes de desgaste, instalados ou personalizados não são elegíveis a devolução por desistência.</li>
      </ul>

      <h2>4. Como solicitar</h2>
      <ol>
        <li>Envie a solicitação para <a href="mailto:contato@asiapecas.com.br">contato@asiapecas.com.br</a> com o assunto "Devolução — [nº do pedido]".</li>
        <li>Aguarde a confirmação e as instruções de envio.</li>
        <li>Despache a peça conforme orientação, mantendo o comprovante de postagem.</li>
        <li>Após o recebimento e a conferência, o valor é restituído ou um novo item é enviado.</li>
      </ol>

      <h2>5. Prazo de análise e restituição</h2>
      <p>
        A análise é concluída em até 10 dias úteis após o recebimento do item. Restituições são efetuadas pelo mesmo meio do
        pagamento, observados os prazos das instituições financeiras envolvidas.
      </p>

      <h2>6. Frete</h2>
      <p>
        Casos de envio de item incorreto, avaria de transporte ou falha imputável ao fornecedor são processados sem custo de frete
        para o cliente. Devoluções por desistência seguem as regras aplicáveis ao tipo de compra.
      </p>

      <h2>7. Itens não elegíveis</h2>
      <ul>
        <li>Peças sob encomenda, fabricadas ou importadas especificamente para o pedido.</li>
        <li>Itens instalados, com indícios de uso ou modificados.</li>
        <li>Componentes de desgaste consumidos após instalação.</li>
      </ul>

      <h2>8. Garantia</h2>
      <p>
        Reclamações fundadas em defeito de fabricação seguem o procedimento descrito na página
        <a href="/garantia"> Garantia</a>.
      </p>
    </LegalPageShell>
  );
}
