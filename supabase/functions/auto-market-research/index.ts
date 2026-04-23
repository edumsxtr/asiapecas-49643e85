// Auto Market Research — uses Lovable AI Gateway with Google Search
// to find competitor prices for a given part in Brazilian distributors.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  material: string;
  description: string;
  manufacturer?: string | null;
  machine_model?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.material || !body?.description) {
      return new Response(JSON.stringify({ error: "material and description are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um pesquisador de preços de peças para máquinas pesadas (XCMG, Caterpillar, Komatsu, escavadeiras, mineração, perfuratrizes, guindastes) no mercado brasileiro.
Sua tarefa é encontrar preços de concorrentes/distribuidores reais no Brasil para uma peça específica.

REGRAS CRÍTICAS:
- Foque em distribuidores brasileiros: Tracbel, Solar Equipamentos, Mercado Livre, distribuidores oficiais XCMG, Sotreq, etc.
- Retorne APENAS dados que você tenha alta confiança que existem. NUNCA invente preços.
- Se não encontrar referências confiáveis, retorne array vazio em "results" e explique em "search_summary".
- Preços em REAIS (BRL). Prazo em dias úteis. Sempre inclua a URL/origem quando possível.
- Máximo de 5 resultados.`;

    const userPrompt = `Pesquise preços para esta peça no mercado brasileiro:

Código: ${body.material}
Descrição: ${body.description}
${body.manufacturer ? `Fabricante: ${body.manufacturer}` : ""}
${body.machine_model ? `Modelo de máquina: ${body.machine_model}` : ""}

Use busca na web (Google Search) para encontrar distribuidores brasileiros vendendo esta peça ou equivalente.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          { type: "google_search" },
          {
            type: "function",
            function: {
              name: "report_market_research",
              description: "Reporta os preços de concorrentes encontrados.",
              parameters: {
                type: "object",
                properties: {
                  search_summary: {
                    type: "string",
                    description: "Breve resumo da busca: o que foi pesquisado e o que foi encontrado.",
                  },
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        distributor_name: { type: "string", description: "Nome do distribuidor/loja" },
                        price_brl: { type: "number", description: "Preço em reais (BRL)" },
                        delivery_days: { type: "number", description: "Prazo de entrega em dias úteis" },
                        availability: {
                          type: "string",
                          enum: ["em estoque", "sob encomenda", "indisponível"],
                        },
                        source_url: { type: "string", description: "URL da página de origem" },
                        notes: { type: "string", description: "Observações adicionais (condições, frete, etc.)" },
                      },
                      required: ["distributor_name", "price_brl"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["search_summary", "results"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_market_research" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, text);
      return new Response(JSON.stringify({ error: `AI gateway error: ${aiResp.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ search_summary: "IA não retornou resultados estruturados.", results: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: { search_summary: string; results: any[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      parsed = { search_summary: "Falha ao interpretar resposta da IA.", results: [] };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-market-research error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
