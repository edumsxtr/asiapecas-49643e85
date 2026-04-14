import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Sale } from "@/hooks/use-sales";

const COMPANY = {
  name: "Ásia Peças & Máquinas",
  cnpj: "XX.XXX.XXX/XXXX-XX",
  address: "Macapá - AP",
  phone: "+55 95 97400-9289",
  email: "contato@asiapecas.com.br",
};

const PRIMARY_COLOR: [number, number, number] = [204, 163, 0]; // gold/yellow
const DARK: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [100, 100, 100];
const LIGHT_BG: [number, number, number] = [248, 245, 235];

function fmt(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export async function generateProposalPDF(sale: Sale, logoBase64?: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = W - margin * 2;
  let y = margin;

  // ── Top accent bar ──
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, W, 6, "F");

  // ── Logo ──
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, y + 2, 28, 28);
    } catch { /* skip logo on error */ }
  }

  // ── Company header ──
  const headerX = logoBase64 ? margin + 32 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text(COMPANY.name, headerX, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`CNPJ: ${COMPANY.cnpj}  |  ${COMPANY.phone}  |  ${COMPANY.email}`, headerX, y + 18);
  doc.text(COMPANY.address, headerX, y + 22);

  y += 34;

  // ── Title ──
  doc.setFillColor(...DARK);
  doc.roundedRect(margin, y, contentW, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("PROPOSTA COMERCIAL / ORÇAMENTO", W / 2, y + 8.5, { align: "center" });
  y += 18;

  // ── Client & proposal info ──
  const orderNum = (sale as any).order_number ? `#${(sale as any).order_number}` : sale.id.slice(0, 8);
  const clientName = sale.customers?.name || "—";
  const clientCompany = sale.customers?.company || "";
  const saleDate = new Date(sale.sale_date).toLocaleDateString("pt-BR");

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, contentW, 28, 2, 2, "F");

  doc.setFontSize(9);
  doc.setTextColor(...DARK);

  const col1 = margin + 4;
  const col2 = W / 2 + 4;

  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", col1, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(clientName, col1 + 18, y + 6);

  if (clientCompany) {
    doc.setFont("helvetica", "bold");
    doc.text("Empresa:", col1, y + 12);
    doc.setFont("helvetica", "normal");
    doc.text(clientCompany, col1 + 20, y + 12);
  }

  doc.setFont("helvetica", "bold");
  doc.text("Proposta Nº:", col2, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(orderNum, col2 + 26, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text("Data:", col2, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(saleDate, col2 + 12, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Validade:", col2, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text("15 dias", col2 + 20, y + 18);

  if (sale.payment_method) {
    doc.setFont("helvetica", "bold");
    doc.text("Pagamento:", col1, y + 24);
    doc.setFont("helvetica", "normal");
    doc.text(`${sale.payment_method}${sale.payment_terms ? ` — ${sale.payment_terms}` : ""}`, col1 + 24, y + 24);
  }

  y += 34;

  // ── Section: OBJETO ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("1. OBJETO", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text("Fornecimento de peças e componentes para máquinas pesadas, conforme especificações abaixo:", margin, y);
  y += 8;

  // ── Section: ITENS ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("2. ITENS DO ORÇAMENTO", margin, y);
  y += 4;

  const items = sale.sale_items || [];
  const tableBody = items.map((item, i) => [
    String(i + 1).padStart(2, "0"),
    item.parts?.description || "—",
    item.parts?.material || "—",
    String(item.quantity),
    fmt(item.unit_price),
    fmt(item.total_price),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Item", "Descrição", "Material/Modelo", "Qtd", "Valor Unit.", "Valor Total"]],
    body: tableBody,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: DARK,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: DARK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [250, 248, 240] },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 30 },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // ── Total ──
  doc.setFillColor(...PRIMARY_COLOR);
  doc.roundedRect(W - margin - 65, y, 65, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(`TOTAL: ${fmt(sale.total_amount)}`, W - margin - 62, y + 7);
  y += 18;

  // ── Sections 3-6 ──
  const sections = [
    {
      num: "3",
      title: "CONDIÇÕES DE PAGAMENTO",
      lines: sale.payment_method
        ? [`• ${sale.payment_method}${sale.payment_terms ? ` — ${sale.payment_terms}` : ""}`]
        : ["• A combinar"],
    },
    { num: "4", title: "PRAZO DE ENTREGA", lines: ["• 7 a 15 dias úteis após confirmação do pedido"] },
    {
      num: "5",
      title: "GARANTIA",
      lines: [
        "• Garantia de 3 meses contra defeitos de fabricação.",
        "• Não cobre mau uso ou instalação inadequada.",
      ],
    },
    {
      num: "6",
      title: "OBSERVAÇÕES",
      lines: [
        "• Frete: a combinar",
        "• Instalação: não inclusa",
        "• Produtos sujeitos à disponibilidade em estoque",
        "• Valores podem sofrer alteração após vencimento da proposta",
        ...(sale.notes ? [`• ${sale.notes}`] : []),
      ],
    },
  ];

  for (const sec of sections) {
    if (y > H - 40) {
      doc.addPage();
      y = margin;
      doc.setFillColor(...PRIMARY_COLOR);
      doc.rect(0, 0, W, 4, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`${sec.num}. ${sec.title}`, margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    for (const line of sec.lines) {
      doc.text(line, margin + 2, y);
      y += 5;
    }
    y += 4;
  }

  // ── Signature ──
  if (y > H - 50) {
    doc.addPage();
    y = margin;
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, W, 4, "F");
  }

  y += 8;
  doc.setDrawColor(...GRAY);
  doc.line(margin, y, margin + 60, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text("Atenciosamente,", margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, margin, y);

  // ── Footer bar ──
  doc.setFillColor(...DARK);
  doc.rect(0, H - 10, W, 10, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 200, 200);
  doc.text(`${COMPANY.name}  |  ${COMPANY.phone}  |  ${COMPANY.email}`, W / 2, H - 4, { align: "center" });

  // ── Download ──
  doc.save(`Proposta_${orderNum}_${clientName.replace(/\s+/g, "_")}.pdf`);
}

export async function loadLogoAsBase64(): Promise<string | undefined> {
  try {
    const response = await fetch(new URL("@/assets/asia-logo.png", import.meta.url).href);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
