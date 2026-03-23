import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { country, state, segment, count = 5 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get stock summary by category
    const { data: statsData } = await supabase.rpc("get_dashboard_stats");
    const stats = statsData as any;

    // Get top available parts
    const { data: topParts } = await supabase
      .from("parts")
      .select("material, description, machine_model, manufacturer, stock, estimated_price, is_mineracao, is_linha_amarela, is_perfuratriz, is_caminhao_eletrico, is_guindaste")
      .gt("stock", 0)
      .order("stock", { ascending: false })
      .limit(50);

    const categoryMap: Record<string, string[]> = {
      mineração: [], construção: [], perfuração: [], transporte: [], guindastes: []
    };
    topParts?.forEach((p: any) => {
      if (p.is_mineracao) categoryMap["mineração"].push(`${p.material}: ${p.description} (${p.stock}un)`);
      if (p.is_linha_amarela) categoryMap["construção"].push(`${p.material}: ${p.description} (${p.stock}un)`);
      if (p.is_perfuratriz) categoryMap["perfuração"].push(`${p.material}: ${p.description} (${p.stock}un)`);
      if (p.is_caminhao_eletrico) categoryMap["transporte"].push(`${p.material}: ${p.description} (${p.stock}un)`);
      if (p.is_guindaste) categoryMap["guindastes"].push(`${p.material}: ${p.description} (${p.stock}un)`);
    });

    const countryNames: Record<string, string> = { BR: "Brasil", VE: "Venezuela", GY: "Guiana" };
    const countryName = countryNames[country] || country;

    const stockSummary = Object.entries(categoryMap)
      .filter(([, parts]) => parts.length > 0)
      .map(([cat, parts]) => `${cat.toUpperCase()} (${parts.length} itens):\n${parts.slice(0, 10).join("\n")}`)
      .join("\n\n");

    const prompt = `Você é um consultor de prospecção comercial especializado em peças de máquinas pesadas XCMG.

CONTEXTO DO ESTOQUE DA LOPES & LOPES:
- Total de SKUs: ${stats?.totalParts || 0}
- Estoque total: ${stats?.totalStock || 0} unidades
- Valor em estoque: R$ ${Number(stats?.totalValue || 0).toLocaleString("pt-BR")}

PEÇAS DISPONÍVEIS POR CATEGORIA:
${stockSummary}

TAREFA: Gere ${count} perfis de empresas que seriam potenciais clientes para estas peças na região:
- País: ${countryName}
${state ? `- Estado/Região: ${state}` : "- Todos os estados/regiões"}
${segment ? `- Segmento: ${segment}` : "- Todos os segmentos (mineração, construção civil, logística, energia, infraestrutura)"}

Para cada prospect, considere:
1. O tipo de maquinário que a empresa provavelmente usa baseado no segmento
2. Quais peças do nosso estoque seriam mais relevantes
3. O potencial de compra (score 0-100)
4. Uma justificativa clara de por que esta empresa seria um bom cliente

${country === "VE" ? "Para Venezuela, considere empresas de mineração (ouro, ferro, bauxita), construção civil, PDVSA e empresas de petróleo, e infraestrutura governamental." : ""}
${country === "GY" ? "Para Guiana, considere empresas de mineração de ouro e diamante, construção civil, exploração de petróleo offshore (Exxon, Hess), e infraestrutura." : ""}

IMPORTANTE: Gere nomes e perfis REALISTAS baseados no mercado real da região. Não invente empresas obviamente fictícias.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.2",
        messages: [
          { role: "system", content: "Você é um especialista em prospecção comercial B2B para peças de máquinas pesadas XCMG na América do Sul." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_prospects",
            description: "Generate prospect profiles for potential clients",
            parameters: {
              type: "object",
              properties: {
                prospects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Nome do contato/responsável" },
                      company: { type: "string", description: "Nome da empresa" },
                      segment: { type: "string", description: "Segmento: mineração, construção, logística, energia, infraestrutura" },
                      city: { type: "string" },
                      state: { type: "string" },
                      score: { type: "number", description: "Score de potencial (0-100)" },
                      matched_parts: { type: "array", items: { type: "string" }, description: "Códigos de peças recomendadas" },
                      ai_summary: { type: "string", description: "Resumo do perfil e justificativa" },
                    },
                    required: ["name", "company", "segment", "city", "state", "score", "matched_parts", "ai_summary"],
                  },
                },
              },
              required: ["prospects"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_prospects" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    let prospects: any[] = [];

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      prospects = parsed.prospects || [];
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        prospects = parsed.prospects || [];
      }
    }

    // Save prospects to database
    const toInsert = prospects.map((p: any) => ({
      name: p.name,
      company: p.company,
      country: country || "BR",
      state: p.state,
      city: p.city,
      segment: p.segment,
      source: "ia",
      status: "novo",
      score: p.score || 50,
      matched_parts: p.matched_parts || [],
      ai_summary: p.ai_summary || "",
    }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from("prospects").insert(toInsert);
      if (insertError) console.error("Insert error:", insertError);
    }

    return new Response(JSON.stringify({ prospects: toInsert, total: toInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("prospect-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
