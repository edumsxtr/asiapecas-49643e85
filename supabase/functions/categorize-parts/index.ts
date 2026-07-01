import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES = [
  "Filtros",
  "Vedações e Retentores",
  "Motor e Componentes",
  "Sistema Hidráulico",
  "Sistema Elétrico",
  "Estrutural e Chassi",
  "Transmissão",
  "Freios",
  "Refrigeração",
  "Rolamentos e Buchas",
  "Acessórios e Outros",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth obrigatória: exige usuário autenticado real (rejeita anon key pública) ---
    const _authHeader = req.headers.get("Authorization");
    if (!_authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const _authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: _authHeader } } }
    );
    const { data: _authData, error: _authErr } = await _authClient.auth.getUser();
    if (_authErr || !_authData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // --- fim auth ---

    const { limit: batchLimit } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const limit = batchLimit || 20;
    const { data: parts, error: partsError } = await supabase
      .from("parts")
      .select("id, material, description, machine_model")
      .is("part_category", null)
      .limit(limit);

    if (partsError) throw partsError;
    if (!parts || parts.length === 0) {
      return new Response(JSON.stringify({ processed: 0, errors: 0, total: 0, done: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a map of index -> part for reliable matching
    const partsList = parts.map((p, idx) => 
      `${idx + 1}. ID:${p.id} | ${p.material} | ${p.description} | Modelo: ${p.machine_model || "N/A"}`
    ).join("\n");

    const prompt = `Classifique cada peça XCMG abaixo em EXATAMENTE uma das categorias:
${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Peças para classificar:
${partsList}

IMPORTANTE: Use o ID exato de cada peça (campo após "ID:") no resultado.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em peças de equipamentos pesados XCMG. Classifique peças pela sua função. Retorne SEMPRE o ID exato da peça." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "categorize_parts",
            description: "Return categorized parts with their IDs",
            parameters: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", description: "The exact part UUID" },
                      category: { type: "string", enum: CATEGORIES },
                    },
                    required: ["id", "category"],
                  },
                },
              },
              required: ["categories"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "categorize_parts" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    let processed = 0;
    let errors = 0;
    const validIds = new Set(parts.map(p => p.id));

    if (result?.categories) {
      for (const item of result.categories) {
        if (!item.id || !CATEGORIES.includes(item.category)) {
          console.error("Invalid item:", JSON.stringify(item));
          errors++;
          continue;
        }
        if (!validIds.has(item.id)) {
          console.error("ID not found in batch:", item.id);
          errors++;
          continue;
        }
        const { error: updateError, count } = await supabase
          .from("parts")
          .update({ part_category: item.category })
          .eq("id", item.id);
        if (updateError) {
          console.error("Update error:", updateError.message, "for id:", item.id);
          errors++;
        } else {
          processed++;
        }
      }
    } else {
      console.error("No categories in AI result:", JSON.stringify(aiData.choices?.[0]?.message));
      errors = parts.length;
    }

    console.log(`Batch done: ${processed} processed, ${errors} errors, ${parts.length} total`);

    return new Response(JSON.stringify({ 
      processed, errors, total: parts.length,
      done: parts.length < limit,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("categorize-parts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
