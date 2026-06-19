import type { ProposalPayload } from "@/lib/generate-proposal-institutional";

function fmtBRL(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("pt-BR");
}

type Props = { payload: ProposalPayload | null; logoUrl?: string };

/**
 * Live HTML preview that mirrors the institutional PDF layout.
 * Black & white, sans-serif, narrow margins, dense tables — same visual logic.
 */
export default function ProposalPreviewInstitutional({ payload, logoUrl }: Props) {
  if (!payload) {
    return <div className="p-6 text-sm text-muted-foreground">Pré-visualização aparecerá aqui.</div>;
  }
  const { proposalNumber, date, validityDays, intro, settings, salesperson, client, contact, items, paymentTemplateName, schedule, freightTerms, observations } = payload;
  const total = items.reduce((s, it) => s + it.sell_price * it.quantity, 0);

  const addrLines: string[] = [];
  const street = [client.address_street, client.address_number].filter(Boolean).join(", ");
  const compl = [street, client.address_complement].filter(Boolean).join(" - ");
  if (compl) addrLines.push(compl);
  if (client.address_district) addrLines.push(client.address_district);
  const cityState = [client.address_city || client.city, client.address_state || client.state].filter(Boolean).join("/");
  const cep = client.address_zip ? `CEP ${client.address_zip}` : null;
  const cityLine = [cityState, cep].filter(Boolean).join(" - ");
  if (cityLine) addrLines.push(cityLine);
  if (addrLines.length === 0 && client.address) addrLines.push(client.address);

  // Group warranties
  const warrantyGroups = (() => {
    const m = new Map<string, { labels: string[]; months: number; intro: string; conditions: string[]; exclusions: string[] }>();
    for (const it of items) {
      const months = it.warranty_custom_months ?? it.warranty_template?.months ?? 0;
      const intro = it.warranty_custom_text || it.warranty_template?.intro_text || "";
      const conditions = it.warranty_template?.conditions || [];
      const exclusions = it.warranty_template?.exclusions || [];
      const key = `${months}::${intro}::${conditions.join("|")}::${exclusions.join("|")}`;
      const label = it.description || it.material;
      if (m.has(key)) m.get(key)!.labels.push(label);
      else m.set(key, { labels: [label], months, intro, conditions, exclusions });
    }
    return Array.from(m.values());
  })();

  return (
    <div className="bg-white text-black mx-auto shadow-lg" style={{ width: "210mm", minHeight: "297mm", padding: "18mm", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "9.5pt", lineHeight: 1.35 }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          {logoUrl && <img src={logoUrl} alt="logo" style={{ height: "22mm" }} />}
        </div>
        <table className="border border-black text-[8pt]" style={{ width: "60mm" }}>
          <tbody>
            <tr><td className="font-bold p-1 align-top w-[22mm]">Proposta nº</td><td className="p-1 align-top">{proposalNumber}</td></tr>
            <tr><td className="font-bold p-1 align-top">Data</td><td className="p-1 align-top">{fmtDate(date)}</td></tr>
            <tr><td className="font-bold p-1 align-top">Validade</td><td className="p-1 align-top">{validityDays} dias</td></tr>
          </tbody>
        </table>
      </div>

      <p className="mb-4">{intro}</p>

      {/* 1 */}
      <SectionTitle>1. IDENTIFICAÇÃO DAS PARTES</SectionTitle>
      <table className="w-full border border-gray-400 text-[8.5pt] mb-5">
        <thead>
          <tr className="bg-gray-200 font-bold"><th className="border border-gray-400 p-2 text-left w-1/2">FORNECEDOR</th><th className="border border-gray-400 p-2 text-left w-1/2">CLIENTE</th></tr>
        </thead>
        <tbody>
          <tr className="align-top">
            <td className="border border-gray-400 p-2 whitespace-pre-line">
              <span className="font-bold">{settings.company_name}</span>{"\n"}
              {settings.legal_company_name && `Razão Social: ${settings.legal_company_name}\n`}
              {settings.cnpj && `CNPJ: ${settings.cnpj}\n`}
              {settings.legal_state_registration && `Inscrição Estadual: ${settings.legal_state_registration}\n`}
              {settings.address && `Endereço: ${settings.address}\n`}
              {salesperson.name && `Contato: ${salesperson.name}\n`}
              {(salesperson.phone || settings.phone) && `Telefone: ${salesperson.phone || settings.phone}\n`}
              {(salesperson.email || settings.email) && `E-mail: ${salesperson.email || settings.email}\n`}
              {settings.website && `Site: ${settings.website}`}
            </td>
            <td className="border border-gray-400 p-2 whitespace-pre-line">
              <span className="font-bold">{client.legal_name || client.name}</span>{"\n"}
              {client.trade_name && client.trade_name !== (client.legal_name || client.name) && `Nome Fantasia: ${client.trade_name}\n`}
              {client.cnpj_cpf && `CNPJ: ${client.cnpj_cpf}\n`}
              {client.state_registration && `Inscrição Estadual: ${client.state_registration}\n`}
              {client.municipal_registration && `Inscrição Municipal: ${client.municipal_registration}\n`}
              {addrLines.map((l, i) => `${i === 0 ? "Endereço: " : ""}${l}\n`).join("")}
              {contact?.name && `Contato: ${contact.name}${contact.role ? ` (${contact.role})` : ""}\n`}
              {(contact?.phone || client.phone) && `Telefone: ${contact?.phone || client.phone}\n`}
              {(contact?.email || client.email) && `E-mail: ${contact?.email || client.email}`}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 2 */}
      <SectionTitle>2. OBJETO DA PROPOSTA</SectionTitle>
      <table className="w-full border border-gray-400 text-[8.5pt] mb-5">
        <thead className="bg-black text-white">
          <tr>
            <th className="p-1.5 border border-gray-400 w-10">Item</th>
            <th className="p-1.5 border border-gray-400 text-left">Descrição</th>
            <th className="p-1.5 border border-gray-400 w-12">Qtd.</th>
            <th className="p-1.5 border border-gray-400 w-24">Condição</th>
            <th className="p-1.5 border border-gray-400 w-28 text-right">Valor Unitário</th>
            <th className="p-1.5 border border-gray-400 w-28 text-right">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id}>
              <td className="border border-gray-400 p-1.5 text-center">{String(i + 1).padStart(2, "0")}</td>
              <td className="border border-gray-400 p-1.5">{it.description || it.material}</td>
              <td className="border border-gray-400 p-1.5 text-center">{String(it.quantity).padStart(2, "0")}</td>
              <td className="border border-gray-400 p-1.5 text-center">{it.condition}</td>
              <td className="border border-gray-400 p-1.5 text-right">{fmtBRL(it.sell_price)}</td>
              <td className="border border-gray-400 p-1.5 text-right">{fmtBRL(it.sell_price * it.quantity)}</td>
            </tr>
          ))}
          <tr className="bg-gray-200 font-bold">
            <td colSpan={4} className="border border-gray-400"></td>
            <td className="border border-gray-400 p-1.5 text-right">VALOR TOTAL DA PROPOSTA</td>
            <td className="border border-gray-400 p-1.5 text-right">{fmtBRL(total)}</td>
          </tr>
        </tbody>
      </table>

      {/* 3 */}
      <SectionTitle>3. CONDIÇÕES COMERCIAIS, BOLETOS E DADOS PARA PAGAMENTO</SectionTitle>
      {paymentTemplateName && <p className="italic text-[8.5pt] text-gray-700 mb-1">Condição: {paymentTemplateName}</p>}
      <table className="w-full border border-gray-400 text-[8.5pt] mb-3">
        <thead className="bg-gray-200 font-bold">
          <tr>
            <th className="p-1.5 border border-gray-400 text-left">Condição</th>
            <th className="p-1.5 border border-gray-400 text-right w-32">Valor</th>
            <th className="p-1.5 border border-gray-400 text-center w-32">Vencimento</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((s, i) => (
            <tr key={i}>
              <td className="border border-gray-400 p-1.5">{s.label}</td>
              <td className="border border-gray-400 p-1.5 text-right">{fmtBRL(s.amount)}</td>
              <td className="border border-gray-400 p-1.5 text-center">{s.due_date ? fmtDate(s.due_date) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(settings.bank_name || settings.pix_key) && (
        <table className="w-full border border-gray-400 text-[8.5pt] mb-5">
          <thead className="bg-gray-200 font-bold"><tr><th className="p-1.5 border border-gray-400 text-left">Dados bancários para pagamento</th></tr></thead>
          <tbody><tr><td className="border border-gray-400 p-2 whitespace-pre-line">
            {settings.bank_name && `Banco: ${settings.bank_name}\n`}
            {settings.bank_agency && `Agência: ${settings.bank_agency}\n`}
            {settings.bank_account && `Conta: ${settings.bank_account}\n`}
            {settings.bank_cnpj && `CNPJ: ${settings.bank_cnpj}\n`}
            {settings.bank_favored && `Favorecido: ${settings.bank_favored}\n`}
            {settings.pix_key && `Chave PIX: ${settings.pix_key}`}
          </td></tr></tbody>
        </table>
      )}

      {/* 4 */}
      <SectionTitle>4. PRAZO DE ENTREGA, RETIRADA E FRETE</SectionTitle>
      <table className="w-full border border-gray-400 text-[8.5pt] mb-5">
        <thead className="bg-gray-200 font-bold"><tr><th className="p-1.5 border border-gray-400 text-left w-1/3">Item</th><th className="p-1.5 border border-gray-400 text-left">Local de Retirada / Condição</th></tr></thead>
        <tbody>
          {items.filter(it => it.pickup_address).map((it) => (
            <tr key={it.id}><td className="border border-gray-400 p-1.5">{it.description || it.material}</td><td className="border border-gray-400 p-1.5">{it.pickup_address}</td></tr>
          ))}
          <tr><td className="border border-gray-400 p-1.5 font-bold">Prazo</td><td className="border border-gray-400 p-1.5">Entrega imediata após a confirmação do pagamento da entrada.</td></tr>
          <tr><td className="border border-gray-400 p-1.5 font-bold">Frete</td><td className="border border-gray-400 p-1.5">{freightTerms}</td></tr>
        </tbody>
      </table>

      {/* 5 */}
      <SectionTitle>5. GARANTIA</SectionTitle>
      {warrantyGroups.map((g, i) => (
        <div key={i} className="mb-4">
          <p className="font-bold mb-1">▸ {g.labels.join(" + ")} — {g.months > 0 ? `${g.months} ${g.months === 1 ? "mês" : "meses"}` : "Sem garantia"}</p>
          <p className="mb-2">{g.intro}</p>
          {g.conditions.length > 0 && (
            <table className="w-full border border-gray-400 text-[8pt] mb-2">
              <thead className="bg-gray-200 font-bold"><tr><th className="p-1.5 border border-gray-400 text-left">Condições para validade da garantia</th></tr></thead>
              <tbody>{g.conditions.map((c, j) => <tr key={j}><td className="border border-gray-400 p-1.5">{j + 1}. {c}</td></tr>)}</tbody>
            </table>
          )}
          {g.exclusions.length > 0 && (
            <table className="w-full border border-gray-400 text-[8pt]">
              <thead className="bg-gray-200 font-bold"><tr><th className="p-1.5 border border-gray-400 text-left">Exclusões da garantia</th></tr></thead>
              <tbody><tr><td className="border border-gray-400 p-1.5">{g.exclusions.join(" ")}</td></tr></tbody>
            </table>
          )}
        </div>
      ))}

      {/* 6 */}
      <SectionTitle>6. OBSERVAÇÕES GERAIS</SectionTitle>
      <table className="w-full border border-gray-400 text-[8.5pt] mb-6">
        <tbody>
          <tr><td className="border border-gray-400 p-1.5 font-bold w-40">Documento fiscal</td><td className="border border-gray-400 p-1.5">A venda será acompanhada de nota fiscal emitida por {settings.legal_company_name} / {settings.company_name}.</td></tr>
          <tr><td className="border border-gray-400 p-1.5 font-bold">Forma de negociação</td><td className="border border-gray-400 p-1.5">Condição comercial elaborada para atendimento corporativo do cliente.</td></tr>
          <tr><td className="border border-gray-400 p-1.5 font-bold">Validade da proposta</td><td className="border border-gray-400 p-1.5">{validityDays} dias corridos a partir de {fmtDate(date)}.</td></tr>
          {observations && <tr><td className="border border-gray-400 p-1.5 font-bold">Observações</td><td className="border border-gray-400 p-1.5">{observations}</td></tr>}
        </tbody>
      </table>

      <p className="mb-4">Permanecemos à disposição para esclarecimentos técnicos, envio de documentação complementar e formalização do pedido.</p>
      <p className="font-bold mb-2">Atenciosamente,</p>
      <p className="font-bold">{salesperson.name}</p>
      <p className="text-gray-700 text-[8.5pt]">{salesperson.role}</p>
      <p className="text-gray-700 text-[8.5pt]">{salesperson.phone || settings.phone}</p>
      <p className="text-gray-700 text-[8.5pt]">{salesperson.email || settings.email}</p>
      <p className="text-gray-700 text-[8.5pt]">{settings.website}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-bold text-[10pt] border-b-2 border-black inline-block mb-2 mt-3">{children}</h2>;
}
