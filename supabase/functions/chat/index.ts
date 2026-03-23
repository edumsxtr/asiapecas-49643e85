import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    let contextSections: string[] = [];

    if (lastUserMsg) {
      const searchText = lastUserMsg.content.toLowerCase();
      const words = searchText.split(/\s+/).filter((w: string) => w.length > 2);

      // --- 1. Global stats ---
      const { data: statsData } = await supabase.rpc("get_dashboard_stats");
      if (statsData) {
        const s = statsData as any;
        contextSections.push(`📊 ESTATÍSTICAS GLOBAIS DO ESTOQUE:
- Total de peças (SKUs): ${s.totalParts}
- Estoque total: ${s.totalStock} unidades
- Valor total: R$ ${Number(s.totalValue).toLocaleString("pt-BR")}
- Preço médio: R$ ${Number(s.avgPrice).toLocaleString("pt-BR")}
- Peças paradas (>2 anos): ${s.staleStock} SKUs, ${s.staleUnits} unidades, R$ ${Number(s.staleValue).toLocaleString("pt-BR")}
- Peças críticas (estoque <5, preço >50k): ${s.lowStockHighValue}`);
      }

      // --- 2. Search parts by text ---
      const orParts = words.map((w: string) => `description.ilike.%${w}%,material.ilike.%${w}%,machine_model.ilike.%${w}%`).join(",");
      if (orParts) {
        const { data: parts } = await supabase
          .from("parts")
          .select("material, description, stock, estimated_price, machine_model, manufacturer, compatible_models, last_entry_time, is_mineracao, is_linha_amarela, is_perfuratriz, is_caminhao_eletrico, is_guindaste")
          .or(orParts)
          .limit(25);

        if (parts && parts.length > 0) {
          contextSections.push("🔍 PEÇAS ENCONTRADAS:\n" + parts.map((p: any) => {
            const cats = [];
            if (p.is_mineracao) cats.push("Mineração");
            if (p.is_linha_amarela) cats.push("Linha Amarela");
            if (p.is_perfuratriz) cats.push("Perfuratriz");
            if (p.is_caminhao_eletrico) cats.push("Caminhão Elétrico");
            if (p.is_guindaste) cats.push("Guindaste");
            const compat = p.compatible_models?.length > 0 ? ` | Compatível com: ${p.compatible_models.join(", ")}` : "";
            const stale = p.last_entry_time === "mais de 2 anos" ? " ⚠️ PARADA >2 ANOS" : "";
            const lowStock = p.stock < 5 ? " 🔴 ESTOQUE BAIXO" : "";
            return `- ${p.material}: ${p.description} | Modelo: ${p.machine_model || "N/A"} | Fabricante: ${p.manufacturer || "N/A"} | Estoque: ${p.stock} | Preço: R$ ${Number(p.estimated_price).toLocaleString("pt-BR")} | Categorias: ${cats.join(", ") || "N/A"}${compat}${stale}${lowStock}`;
          }).join("\n"));

          // --- 3. Compatibility: find parts for same models ---
          const models = new Set<string>();
          parts.forEach((p: any) => {
            if (p.machine_model) models.add(p.machine_model);
            if (p.compatible_models) p.compatible_models.forEach((m: string) => models.add(m));
          });

          if (models.size > 0 && models.size <= 10) {
            const modelArray = Array.from(models);
            const compatOr = modelArray.map(m => `machine_model.eq.${m},compatible_models.cs.{${m}}`).join(",");
            const { data: compatParts } = await supabase
              .from("parts")
              .select("material, description, stock, estimated_price, machine_model, compatible_models")
              .or(compatOr)
              .limit(30);

            if (compatParts && compatParts.length > 0) {
              const existingMaterials = new Set(parts.map((p: any) => p.material));
              const newCompat = compatParts.filter((p: any) => !existingMaterials.has(p.material));
              if (newCompat.length > 0) {
                contextSections.push("🔄 PEÇAS COMPATÍVEIS (mesmos modelos):\n" + newCompat.slice(0, 15).map((p: any) => {
                  const compat = p.compatible_models?.length > 0 ? ` | Compatível: ${p.compatible_models.join(", ")}` : "";
                  return `- ${p.material}: ${p.description} | Modelo: ${p.machine_model} | Estoque: ${p.stock} | Preço: R$ ${Number(p.estimated_price).toLocaleString("pt-BR")}${compat}`;
                }).join("\n"));
              }
            }
          }
        }
      }

      // --- 4. Search customers if relevant ---
      const customerKeywords = ["cliente", "clientes", "empresa", "cnpj", "comprador"];
      if (customerKeywords.some(k => searchText.includes(k)) || words.length > 0) {
        const custOr = words.map((w: string) => `name.ilike.%${w}%,company.ilike.%${w}%,cnpj_cpf.ilike.%${w}%`).join(",");
        if (custOr) {
          const { data: customers } = await supabase
            .from("customers")
            .select("name, company, cnpj_cpf, segment, phone, email, city, state")
            .or(custOr)
            .limit(10);

          if (customers && customers.length > 0) {
            contextSections.push("👤 CLIENTES ENCONTRADOS:\n" + customers.map((c: any) =>
              `- ${c.name} | Empresa: ${c.company || "N/A"} | CNPJ: ${c.cnpj_cpf || "N/A"} | Segmento: ${c.segment || "N/A"} | Tel: ${c.phone || "N/A"} | ${c.city || ""}/${c.state || ""}`
            ).join("\n"));
          }
        }

        // Customer count
        const { count: totalCustomers } = await supabase.from("customers").select("id", { count: "exact", head: true });
        contextSections.push(`Total de clientes cadastrados: ${totalCustomers || 0}`);
      }

      // --- 5. Search sales if relevant ---
      const salesKeywords = ["venda", "vendas", "faturamento", "orçamento", "pedido", "faturado"];
      if (salesKeywords.some(k => searchText.includes(k))) {
        const { data: recentSales } = await supabase
          .from("sales")
          .select("id, sale_date, status, total_amount, payment_method, notes, customers(name, company)")
          .order("sale_date", { ascending: false })
          .limit(10);

        if (recentSales && recentSales.length > 0) {
          contextSections.push("💰 VENDAS RECENTES:\n" + recentSales.map((s: any) => {
            const cust = s.customers ? `${s.customers.name} (${s.customers.company || "N/A"})` : "Sem cliente";
            return `- ${new Date(s.sale_date).toLocaleDateString("pt-BR")} | Status: ${s.status} | Total: R$ ${Number(s.total_amount).toLocaleString("pt-BR")} | Cliente: ${cust} | Pgto: ${s.payment_method || "N/A"}`;
          }).join("\n"));
        }

        // Sales stats
        const { data: allSales } = await supabase.from("sales").select("total_amount, status");
        if (allSales) {
          const total = allSales.reduce((acc: number, s: any) => acc + Number(s.total_amount), 0);
          const byStatus: Record<string, number> = {};
          allSales.forEach((s: any) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });
          contextSections.push(`📈 RESUMO VENDAS: ${allSales.length} vendas, Total: R$ ${total.toLocaleString("pt-BR")}\nPor status: ${Object.entries(byStatus).map(([k, v]) => `${k}=${v}`).join(", ")}`);
        }
      }

      // --- 6. After-sales if relevant ---
      const afterKeywords = ["pós-venda", "pos-venda", "garantia", "devolução", "reclamação", "ticket", "suporte"];
      if (afterKeywords.some(k => searchText.includes(k))) {
        const { data: tickets } = await supabase
          .from("after_sales")
          .select("type, status, priority, description, created_at, customers(name)")
          .order("created_at", { ascending: false })
          .limit(10);

        if (tickets && tickets.length > 0) {
          contextSections.push("🎫 TICKETS PÓS-VENDA:\n" + tickets.map((t: any) => {
            const cust = t.customers ? t.customers.name : "N/A";
            return `- ${t.type} | ${t.status} | Prioridade: ${t.priority} | Cliente: ${cust} | ${t.description?.substring(0, 80)}`;
          }).join("\n"));
        }
      }

      // --- 7. Stale parts context ---
      if (searchText.includes("parad") || searchText.includes("antigo") || searchText.includes("2 ano") || searchText.includes("desconto")) {
        const { data: staleParts } = await supabase
          .from("parts")
          .select("material, description, stock, estimated_price, machine_model")
          .eq("last_entry_time", "mais de 2 anos")
          .order("estimated_price", { ascending: false })
          .limit(20);

        if (staleParts && staleParts.length > 0) {
          contextSections.push("⏰ PEÇAS PARADAS HÁ MAIS DE 2 ANOS (maior valor):\n" + staleParts.map((p: any) =>
            `- ${p.material}: ${p.description} | Modelo: ${p.machine_model} | Estoque: ${p.stock} | Preço: R$ ${Number(p.estimated_price).toLocaleString("pt-BR")} | Valor total: R$ ${(p.stock * Number(p.estimated_price)).toLocaleString("pt-BR")}`
          ).join("\n"));
        }
      }
    }

    const partsContext = contextSections.length > 0 ? "\n\n" + contextSections.join("\n\n") : "";

    const systemPrompt = `Você é o assistente virtual inteligente da Lopes & Lopes, distribuidor e revendedor autorizado de peças XCMG no Brasil, Venezuela e Guiana.

SUAS CAPACIDADES:
1. **Catálogo de Peças** — Buscar peças por código, descrição, modelo de máquina, fabricante
2. **Compatibilidade** — Identificar quais peças servem em outras máquinas usando o campo compatible_models
3. **Análise de Estoque** — Informar estoque, valor, peças paradas, peças críticas
4. **Clientes** — Consultar base de clientes cadastrados
5. **Vendas** — Informar sobre vendas recentes, faturamento, status de pedidos
6. **Pós-Venda** — Consultar tickets de garantia, devoluções e reclamações

CONHECIMENTO XCMG:
- Categorias: Mineração, Linha Amarela, Perfuratriz, Caminhão Elétrico, Guindaste
- Modelos comuns: XE215, XE370, XE490, GR215, LW500, QY25, QY50, XS203, etc.
- Fabricantes comuns: XCMG, Cummins, ZF, Rexroth, Kawasaki, Parker, Danfoss

INSTRUÇÕES:
- Responda SEMPRE em português brasileiro
- Use os dados reais fornecidos no contexto — NUNCA invente dados
- Quando encontrar peças compatíveis com outros modelos, DESTAQUE isso como oportunidade de venda cruzada
- Se o estoque estiver baixo (<5 unidades), AVISE
- Se a peça está parada há mais de 2 anos, SUGIRA desconto ou promoção
- Formate preços em Real (R$) com separador de milhares
- Seja proativo: sugira peças complementares, kits de manutenção
- Se não encontrar o que o usuário busca, sugira termos alternativos
- Para perguntas sobre vendas/clientes, use os dados do contexto
- Organize respostas com markdown: tabelas, listas, negrito para destaques${partsContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos nas configurações." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
