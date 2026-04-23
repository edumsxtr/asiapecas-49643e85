import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const enrichTool = {
  type: "function",
  function: {
    name: "register_enrichment",
    description: "Retorna dados enriquecidos sobre uma empresa cliente do setor de máquinas pesadas.",
    parameters: {
      type: "object",
      properties: {
        official_name: { type: "string" },
        cnpj_formatted: { type: ["string", "null"] },
        cnae: { type: ["string", "null"] },
        company_size: { type: ["string", "null"], enum: ["ME", "EPP", "Medio", "Grande", null] },
        segment: { type: "string", enum: ["mineração", "construção", "logística", "energia", "agronegócio", "geral"] },
        website: { type: ["string", "null"] },
        linkedin: { type: ["string", "null"] },
        instagram: { type: ["string", "null"] },
        alt_phone: { type: ["string", "null"] },
        full_address: { type: ["string", "null"] },
        decision_maker_role: { type: ["string", "null"] },
        commercial_notes: { type: ["string", "null"] },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        sources: { type: "array", items: { type: "string" } },
      },
      required: ["official_name", "segment", "confidence", "sources"],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { customer_id } = await req.json();
    if (!customer_id) {
      return new Response(JSON.stringify({ error: "customer_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: customer, error } = await supabase.from("customers").select("*").eq("id", customer_id).single();
    if (error || !customer) {
      return new Response(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Enriqueça o cadastro deste cliente brasileiro do setor de máquinas pesadas (XCMG).

Dados atuais:
- Nome / Contato: ${customer.name}
- Empresa: ${customer.company || "—"}
- CNPJ/CPF: ${customer.cnpj_cpf || "—"}
- Email: ${customer.email || "—"}
- Telefone: ${customer.phone || "—"}
- Cidade/UF: ${customer.city || "—"} / ${customer.state || "—"}
- Endereço: ${customer.address || "—"}
- Segmento atual: ${customer.segment || "—"}
- Notas: ${customer.notes || "—"}

Pesquise informações públicas (site oficial, LinkedIn, registros públicos) e retorne:
- Razão social oficial
- CNPJ formatado se conhecido
- CNAE principal
- Porte (ME/EPP/Medio/Grande)
- Setor mais provável
- Site, LinkedIn, Instagram
- Telefone alternativo, endereço completo
- Cargo do tomador de decisão típico para compras de peças/máquinas
- Observação comercial relevante (ex: "opera frota de escavadeiras XCMG na região norte")
- Nível de confiança (high/medium/low) baseado em quantas fontes você cruzou
- URLs das fontes consultadas

Se não encontrar a empresa com confiança, retorne confidence "low" e preencha apenas o que for seguro.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "Você é um analista B2B brasileiro especialista em pesquisa de empresas do setor industrial e construção. Sempre use a tool register_enrichment para retornar a resposta. Nunca invente CNPJ — se não encontrar fonte confiável, deixe null.",
          },
          { role: "user", content: userPrompt },
        ],
        tools: [enrichTool],
        tool_choice: { type: "function", function: { name: "register_enrichment" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns minutos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações > Workspace." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");

    const args = JSON.parse(toolCall.function.arguments);

    // Non-destructive merge: only fill empty fields
    const updates: Record<string, unknown> = {
      enrichment_status: "enriched",
      enriched_at: new Date().toISOString(),
      enrichment_data: { ...args, _enriched_at: new Date().toISOString() },
    };
    if (!customer.company && args.official_name) updates.company = args.official_name;
    if (!customer.cnpj_cpf && args.cnpj_formatted) updates.cnpj_cpf = args.cnpj_formatted;
    if (!customer.phone && args.alt_phone) updates.phone = args.alt_phone;
    if (!customer.address && args.full_address) updates.address = args.full_address;
    if ((!customer.segment || customer.segment === "geral") && args.segment) updates.segment = args.segment;

    await supabase.from("customers").update(updates).eq("id", customer_id);

    return new Response(JSON.stringify({ success: true, enrichment: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("enrich-customer error", err);
    const msg = err instanceof Error ? err.message : "unknown";
    // Mark failed
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { customer_id } = await req.clone().json().catch(() => ({ customer_id: null }));
      if (customer_id) await supabase.from("customers").update({ enrichment_status: "failed" }).eq("id", customer_id);
    } catch (_) {
      // ignore
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
