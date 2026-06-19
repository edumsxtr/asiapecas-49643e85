import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Sale } from "@/hooks/use-sales";
import { applySellPrice } from "@/hooks/use-pricing";
import type { WarrantyTemplate } from "@/hooks/use-warranty-templates";
import type { ScheduleEntry } from "@/hooks/use-payment-templates";
import type { ProposalSettings } from "@/hooks/use-proposal-settings";
import type { Salesperson } from "@/hooks/use-salespeople";
import type { CustomerContact } from "@/hooks/use-customer-contacts";

export type ProposalItem = {
  id: string;
  material: string;
  description: string;
  quantity: number;
  unit_price: number; // cost
  sell_price: number;
  condition: string; // Novo / Recondicionado / Usado
  warranty_template: WarrantyTemplate | null;
  warranty_custom_months: number | null;
  warranty_custom_text: string | null;
  pickup_address: string | null;
};

export type ProposalClient = {
  name: string;
  legal_name?: string | null;
  trade_name?: string | null;
  cnpj_cpf?: string | null;
  state_registration?: string | null;
  municipal_registration?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_district?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  // Fallback antigos:
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type ProposalPayload = {
  proposalNumber: string;
  date: Date;
  validityDays: number;
  intro: string;
  settings: ProposalSettings;
  salesperson: Salesperson;
  client: ProposalClient;
  contact: CustomerContact | null;
  items: ProposalItem[];
  paymentTemplateName: string | null;
  schedule: ScheduleEntry[];
  freightTerms: string;
  observations: string;
};

const BLACK: [number, number, number] = [20, 20, 20];
const GRAY_DARK: [number, number, number] = [70, 70, 70];
const GRAY_MED: [number, number, number] = [120, 120, 120];
const GRAY_LIGHT: [number, number, number] = [235, 235, 235];
const WHITE: [number, number, number] = [255, 255, 255];
const LINE: [number, number, number] = [180, 180, 180];

function fmtBRL(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("pt-BR");
}

function buildClientAddress(c: ProposalClient): string[] {
  const lines: string[] = [];
  const street = [c.address_street, c.address_number].filter(Boolean).join(", ");
  const compl = [street, c.address_complement].filter(Boolean).join(" - ");
  if (compl) lines.push(compl);
  const dist = c.address_district || null;
  if (dist) lines.push(dist);
  const cityLine = [c.address_city || c.city, c.address_state || c.state].filter(Boolean).join("/");
  const cep = c.address_zip ? `CEP ${c.address_zip}` : null;
  const cityCep = [cityLine, cep].filter(Boolean).join(" - ");
  if (cityCep) lines.push(cityCep);
  if (lines.length === 0 && c.address) lines.push(c.address);
  return lines;
}

export async function generateProposalInstitutional(payload: ProposalPayload, logoBase64?: string) {
  const { proposalNumber, date, validityDays, intro, settings, salesperson, client, contact, items, paymentTemplateName, schedule, freightTerms, observations } = payload;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = W - margin * 2;
  let y = margin;

  // ───── Header ─────
  // Logo (top-left)
  if (logoBase64) {
    try { doc.addImage(logoBase64, "PNG", margin, y, 22, 22); } catch { /* ignore */ }
  }

  // Right: proposal box
  const boxX = W - margin - 60;
  const boxY = y;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.rect(boxX, boxY, 60, 22);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Proposta nº", boxX + 3, boxY + 4.5);
  doc.text("Data", boxX + 3, boxY + 11.5);
  doc.text("Validade", boxX + 3, boxY + 18.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BLACK);
  doc.text(proposalNumber, boxX + 22, boxY + 4.5);
  doc.text(fmtDate(date), boxX + 22, boxY + 11.5);
  doc.text(`${validityDays} dias`, boxX + 22, boxY + 18.5);

  y += 28;

  // ───── Intro paragraph ─────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  const introLines = doc.splitTextToSize(intro, contentW);
  doc.text(introLines, margin, y);
  y += introLines.length * 4.5 + 4;

  // ───── 1. Identificação das Partes ─────
  y = drawSectionTitle(doc, "1. IDENTIFICAÇÃO DAS PARTES", margin, y);

  const addrSupplier: string[] = [];
  if (settings.legal_company_name) addrSupplier.push(`Razão Social: ${settings.legal_company_name}`);
  if (settings.cnpj) addrSupplier.push(`CNPJ: ${settings.cnpj}`);
  if (settings.legal_state_registration) addrSupplier.push(`Inscrição Estadual: ${settings.legal_state_registration}`);
  if (settings.address) addrSupplier.push(`Endereço: ${settings.address}`);
  if (salesperson.name) addrSupplier.push(`Contato: ${salesperson.name}`);
  if (salesperson.phone || settings.phone) addrSupplier.push(`Telefone: ${salesperson.phone || settings.phone}`);
  if (salesperson.email || settings.email) addrSupplier.push(`E-mail: ${salesperson.email || settings.email}`);
  if (settings.website) addrSupplier.push(`Site: ${settings.website}`);

  const addrClient: string[] = [];
  const clientName = client.legal_name || client.name;
  addrClient.push(clientName);
  if (client.trade_name && client.trade_name !== clientName) addrClient.push(`Nome Fantasia: ${client.trade_name}`);
  if (client.cnpj_cpf) addrClient.push(`CNPJ: ${client.cnpj_cpf}`);
  if (client.state_registration) addrClient.push(`Inscrição Estadual: ${client.state_registration}`);
  if (client.municipal_registration) addrClient.push(`Inscrição Municipal: ${client.municipal_registration}`);
  const addrLines = buildClientAddress(client);
  if (addrLines.length) {
    addrClient.push(`Endereço: ${addrLines[0]}`);
    for (let i = 1; i < addrLines.length; i++) addrClient.push(addrLines[i]);
  }
  if (contact) {
    if (contact.name) addrClient.push(`Contato: ${contact.name}${contact.role ? ` (${contact.role})` : ""}`);
    if (contact.phone || client.phone) addrClient.push(`Telefone: ${contact.phone || client.phone}`);
    if (contact.email || client.email) addrClient.push(`E-mail: ${contact.email || client.email}`);
  } else {
    if (client.phone) addrClient.push(`Telefone: ${client.phone}`);
    if (client.email) addrClient.push(`E-mail: ${client.email}`);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["FORNECEDOR", "CLIENTE"]],
    body: [[
      `${settings.company_name}\n${addrSupplier.join("\n")}`,
      addrClient.join("\n"),
    ]],
    styles: { fontSize: 8.5, cellPadding: 3, textColor: BLACK, lineColor: LINE, lineWidth: 0.2, valign: "top" },
    headStyles: { fillColor: GRAY_LIGHT, textColor: BLACK, fontStyle: "bold", fontSize: 8.5, halign: "left" },
    columnStyles: { 0: { cellWidth: contentW / 2 }, 1: { cellWidth: contentW / 2 } },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ───── 2. Objeto da Proposta ─────
  y = drawSectionTitle(doc, "2. OBJETO DA PROPOSTA", margin, y);

  const total = items.reduce((s, it) => s + it.sell_price * it.quantity, 0);
  const body = items.map((it, i) => [
    String(i + 1).padStart(2, "0"),
    it.description || it.material,
    String(it.quantity).padStart(2, "0"),
    it.condition,
    fmtBRL(it.sell_price),
    fmtBRL(it.sell_price * it.quantity),
  ]);
  body.push([
    { content: "", styles: { fillColor: WHITE } } as never,
    { content: "", styles: { fillColor: WHITE } } as never,
    { content: "", styles: { fillColor: WHITE } } as never,
    { content: "", styles: { fillColor: WHITE } } as never,
    { content: "VALOR TOTAL DA PROPOSTA", styles: { fontStyle: "bold", fillColor: GRAY_LIGHT, halign: "right" } } as never,
    { content: fmtBRL(total), styles: { fontStyle: "bold", fillColor: GRAY_LIGHT, halign: "right" } } as never,
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Item", "Descrição", "Qtd.", "Condição", "Valor Unitário", "Valor Total"]],
    body,
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: BLACK, lineColor: LINE, lineWidth: 0.2 },
    headStyles: { fillColor: BLACK, textColor: WHITE, fontStyle: "bold", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: "auto" as never },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 32, halign: "right" },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ───── 3. Condições Comerciais & Dados Bancários ─────
  y = ensurePageSpace(doc, y, 50, W);
  y = drawSectionTitle(doc, "3. CONDIÇÕES COMERCIAIS, BOLETOS E DADOS PARA PAGAMENTO", margin, y);

  if (paymentTemplateName) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GRAY_DARK);
    doc.text(`Condição: ${paymentTemplateName}`, margin, y);
    y += 4;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Condição", "Valor", "Vencimento"]],
    body: schedule.map((s) => [s.label, fmtBRL(s.amount), s.due_date ? fmtDate(s.due_date) : "—"]),
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: BLACK, lineColor: LINE, lineWidth: 0.2 },
    headStyles: { fillColor: GRAY_LIGHT, textColor: BLACK, fontStyle: "bold", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: "right" },
      2: { cellWidth: "auto" as never, halign: "center" },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // Bank
  if (settings.bank_name || settings.pix_key) {
    const bankLines: string[] = [];
    if (settings.bank_name) bankLines.push(`Banco: ${settings.bank_name}`);
    if (settings.bank_agency) bankLines.push(`Agência: ${settings.bank_agency}`);
    if (settings.bank_account) bankLines.push(`Conta: ${settings.bank_account}`);
    if (settings.bank_cnpj) bankLines.push(`CNPJ: ${settings.bank_cnpj}`);
    if (settings.bank_favored) bankLines.push(`Favorecido: ${settings.bank_favored}`);
    if (settings.pix_key) bankLines.push(`Chave PIX: ${settings.pix_key}`);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Dados bancários para pagamento"]],
      body: [[bankLines.join("\n")]],
      styles: { fontSize: 8.5, cellPadding: 3, textColor: BLACK, lineColor: LINE, lineWidth: 0.2, valign: "top" },
      headStyles: { fillColor: GRAY_LIGHT, textColor: BLACK, fontStyle: "bold", fontSize: 8.5 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // ───── 4. Prazo, Retirada, Frete ─────
  y = ensurePageSpace(doc, y, 40, W);
  y = drawSectionTitle(doc, "4. PRAZO DE ENTREGA, RETIRADA E FRETE", margin, y);
  const pickupRows = items
    .filter((it) => it.pickup_address && it.pickup_address.trim() !== "")
    .map((it) => [it.description || it.material, it.pickup_address as string]);
  pickupRows.push(["Prazo", "Entrega imediata após a confirmação do pagamento da entrada."]);
  pickupRows.push(["Frete", freightTerms]);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Item", "Local de Retirada / Condição"]],
    body: pickupRows,
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: BLACK, lineColor: LINE, lineWidth: 0.2 },
    headStyles: { fillColor: GRAY_LIGHT, textColor: BLACK, fontStyle: "bold", fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: "auto" as never } },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ───── 5. Garantia ─────
  y = ensurePageSpace(doc, y, 60, W);
  y = drawSectionTitle(doc, "5. GARANTIA", margin, y);
  const warrantyGroups = groupWarranty(items);
  for (const group of warrantyGroups) {
    y = ensurePageSpace(doc, y, 40, W);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text(`▸ ${group.itemsLabel} — ${group.months > 0 ? `${group.months} ${group.months === 1 ? "mês" : "meses"}` : "Sem garantia"}`, margin, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const intro = doc.splitTextToSize(group.intro || "—", contentW);
    doc.text(intro, margin, y);
    y += intro.length * 4 + 2;
    if (group.conditions.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Condições para validade da garantia"]],
        body: group.conditions.map((c, i) => [`${i + 1}. ${c}`]),
        styles: { fontSize: 8, cellPadding: 2, textColor: BLACK, lineColor: LINE, lineWidth: 0.2 },
        headStyles: { fillColor: GRAY_LIGHT, textColor: BLACK, fontStyle: "bold", fontSize: 8 },
      });
      y = (doc as any).lastAutoTable.finalY + 2;
    }
    if (group.exclusions.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Exclusões da garantia"]],
        body: [[group.exclusions.join(" ")]],
        styles: { fontSize: 8, cellPadding: 2, textColor: BLACK, lineColor: LINE, lineWidth: 0.2 },
        headStyles: { fillColor: GRAY_LIGHT, textColor: BLACK, fontStyle: "bold", fontSize: 8 },
      });
      y = (doc as any).lastAutoTable.finalY + 3;
    }
    y += 1;
  }

  // ───── 6. Observações Gerais ─────
  y = ensurePageSpace(doc, y, 40, W);
  y = drawSectionTitle(doc, "6. OBSERVAÇÕES GERAIS", margin, y);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: [
      ["Documento fiscal", `A venda será acompanhada de nota fiscal emitida por ${settings.legal_company_name} / ${settings.company_name}.`],
      ["Forma de negociação", "Condição comercial elaborada para atendimento corporativo do cliente."],
      ["Validade da proposta", `${validityDays} dias corridos a partir de ${fmtDate(date)}.`],
      ...(observations ? [["Observações", observations]] : []),
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: BLACK, lineColor: LINE, lineWidth: 0.2, valign: "top" },
    columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" as never }, 1: { cellWidth: "auto" as never } },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ───── Signature ─────
  y = ensurePageSpace(doc, y, 45, W);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BLACK);
  doc.text("Permanecemos à disposição para esclarecimentos técnicos, envio de documentação complementar e formalização do pedido.", margin, y, { maxWidth: contentW });
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Atenciosamente,", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(salesperson.name, margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_DARK);
  if (salesperson.role) { doc.text(salesperson.role, margin, y); y += 4; }
  if (salesperson.phone || settings.phone) { doc.text(salesperson.phone || settings.phone, margin, y); y += 4; }
  if (salesperson.email || settings.email) { doc.text(salesperson.email || settings.email, margin, y); y += 4; }
  if (settings.website) doc.text(settings.website, margin, y);

  // ───── Footer (every page) ─────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(margin, H - 12, W - margin, H - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY_MED);
    doc.text(
      `${settings.company_name} | ${settings.email} | ${settings.phone} | ${settings.website}`,
      margin,
      H - 7,
    );
    doc.text(`Página ${i}/${pageCount}`, W - margin, H - 7, { align: "right" });
  }

  // Save
  const safeName = (client.trade_name || client.name).replace(/\s+/g, "_").replace(/[^\w-]/g, "");
  doc.save(`Proposta_${proposalNumber}_${safeName}.pdf`);
}

function drawSectionTitle(doc: jsPDF, title: string, x: number, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(title, x, y);
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.line(x, y + 1.5, x + doc.getTextWidth(title), y + 1.5);
  return y + 5;
}

function ensurePageSpace(doc: jsPDF, y: number, needed: number, _W: number): number {
  const H = doc.internal.pageSize.getHeight();
  if (y + needed > H - 18) {
    doc.addPage();
    return 18;
  }
  return y;
}

type WarrantyGroup = {
  itemsLabel: string;
  months: number;
  intro: string;
  conditions: string[];
  exclusions: string[];
};

function groupWarranty(items: ProposalItem[]): WarrantyGroup[] {
  const groups = new Map<string, { itemsLabels: string[]; months: number; intro: string; conditions: string[]; exclusions: string[] }>();
  for (const it of items) {
    const months = it.warranty_custom_months ?? it.warranty_template?.months ?? 0;
    const intro = it.warranty_custom_text || it.warranty_template?.intro_text || "";
    const conditions = it.warranty_template?.conditions || [];
    const exclusions = it.warranty_template?.exclusions || [];
    const key = `${months}::${intro}::${conditions.join("|")}::${exclusions.join("|")}`;
    const label = it.description || it.material;
    if (groups.has(key)) {
      groups.get(key)!.itemsLabels.push(label);
    } else {
      groups.set(key, { itemsLabels: [label], months, intro, conditions, exclusions });
    }
  }
  return Array.from(groups.values()).map((g) => ({
    itemsLabel: g.itemsLabels.join(" + "),
    months: g.months,
    intro: g.intro,
    conditions: g.conditions,
    exclusions: g.exclusions,
  }));
}

export async function loadLogoAsBase64(): Promise<string | undefined> {
  try {
    const mod = await import("@/assets/asia-logo.png");
    const url = (mod as { default: string }).default;
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

// Helper builder so the dialog can construct items quickly from a Sale.
export function buildItemsFromSale(
  sale: Sale,
  markup: number,
  pickWarranty: (category: string | null | undefined) => WarrantyTemplate | null,
): ProposalItem[] {
  return (sale.sale_items || []).map((si) => {
    const partRow = si.parts as { material?: string; description?: string; part_category?: string | null } | null;
    const sp = (si as { sell_price?: number }).sell_price && (si as { sell_price?: number }).sell_price! > 0
      ? (si as { sell_price?: number }).sell_price!
      : applySellPrice(si.unit_price, markup);
    return {
      id: si.id,
      material: partRow?.material || "—",
      description: partRow?.description || "—",
      quantity: si.quantity,
      unit_price: si.unit_price,
      sell_price: sp,
      condition: (si as { condition?: string }).condition || "Novo",
      warranty_template: pickWarranty(partRow?.part_category || null),
      warranty_custom_months: null,
      warranty_custom_text: null,
      pickup_address: null,
    };
  });
}
