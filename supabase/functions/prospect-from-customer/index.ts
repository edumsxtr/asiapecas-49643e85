import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { customer_ids = [] } = (await req.json()) as { customer_ids: string[] };
    if (!customer_ids.length) {
      return new Response(JSON.stringify({ error: "customer_ids required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: customers } = await supabase.from("customers")
      .select("id,name,company,cnpj_cpf,city,state,segment,interest_models")
      .in("id", customer_ids);

    if (!customers || customers.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum cliente encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pre-fetch parts samples for matching
    const { data: parts } = await supabase.from("parts").select("material,description,machine_model").gt("stock", 0).limit(200);
    const partsCtx = (parts || []).slice(0, 80).map((p) => `${p.material} | ${p.description} | ${p.machine_model || ""}`).join("\n");

    const created: Array<{ customer_id: string; prospect_id: string; score: number }> = [];
    const failed: Array<{ customer_id: string; error: string }> = [];

    for (const c of customers) {
      try {
        const prompt = `Você é analista B2B de vendas de peças pesadas (XCMG). Cliente alvo:
Nome: ${c.name}
Empresa: ${c.company || "—"}
CNPJ: ${c.cnpj_cpf || "—"}
Cidade/UF: ${c.city || "—"} / ${c.state || "—"}
Segmento: ${c.segment || "—"}
Modelos de interesse: ${(c.interest_models || []).join(", ") || "—"}

Catálogo (amostra):
${partsCtx}

Tarefa: pesquise informação pública e retorne JSON com chaves:
- summary (2-3 frases sobre porte, atividade, frota provável)
- segment (string curta)
- score (0-100, prob. de fechar negócio com peças XCMG)
- matched_parts (até 5 códigos do catálogo mais alinhados)
- recommended_action (1 frase)`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Responda apenas JSON válido, sem markdown." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (aiRes.status === 429 || aiRes.status === 402) {
          failed.push({ customer_id: c.id, error: aiRes.status === 429 ? "Rate limit" : "Sem créditos" });
          continue;
        }
        if (!aiRes.ok) {
          failed.push({ customer_id: c.id, error: `AI ${aiRes.status}` });
          continue;
        }
        const aiJson = await aiRes.json();
        const txt = (aiJson.choices?.[0]?.message?.content || "").trim().replace(/^```json\s*|\s*```$/g, "");
        let parsed: { summary?: string; segment?: string; score?: number; matched_parts?: string[]; recommended_action?: string } = {};
        try { parsed = JSON.parse(txt); } catch { parsed = { summary: txt.slice(0, 500) }; }

        const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 50)));
        const summary = String(parsed.summary || "").slice(0, 1000);
        const matched = Array.isArray(parsed.matched_parts) ? parsed.matched_parts.slice(0, 10).map(String) : [];
        const action = String(parsed.recommended_action || "").slice(0, 300);

        // Upsert: search existing by customer_id
        const { data: existingP } = await supabase.from("prospects").select("id").eq("customer_id", c.id).maybeSingle();
        let pid: string;
        if (existingP) {
          await supabase.from("prospects").update({
            name: c.name, company: c.company, cnpj_cpf: c.cnpj_cpf, city: c.city, state: c.state,
            segment: parsed.segment || c.segment || "geral", source: "crm_empty",
            status: "novo", score, matched_parts: matched, ai_summary: summary,
            notes: action ? `Ação recomendada: ${action}` : null,
          }).eq("id", existingP.id);
          pid = existingP.id;
        } else {
          const { data: ins, error } = await supabase.from("prospects").insert({
            name: c.name, company: c.company, cnpj_cpf: c.cnpj_cpf, city: c.city, state: c.state,
            country: "BR", segment: parsed.segment || c.segment || "geral",
            source: "crm_empty", status: "novo", score, matched_parts: matched,
            ai_summary: summary, customer_id: c.id,
            notes: action ? `Ação recomendada: ${action}` : null,
          } as never).select("id").single();
          if (error) { failed.push({ customer_id: c.id, error: error.message }); continue; }
          pid = ins!.id;
        }

        await supabase.from("customers").update({ relationship_status: "em_prospeccao" }).eq("id", c.id);
        created.push({ customer_id: c.id, prospect_id: pid, score });
      } catch (e) {
        failed.push({ customer_id: c.id, error: e instanceof Error ? e.message : "unknown" });
      }
    }

    return new Response(JSON.stringify({ success: true, created, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("prospect-from-customer error", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
