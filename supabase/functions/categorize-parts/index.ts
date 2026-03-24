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
    const { materials, limit: batchLimit } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // If no materials specified, get uncategorized parts
    let query = supabase
      .from("parts")
      .select("id, material, description, machine_model")
      .is("part_category", null)
      .limit(batchLimit || 50);

    if (materials && Array.isArray(materials) && materials.length > 0) {
      query = supabase
        .from("parts")
        .select("id, material, description, machine_model")
        .in("material", materials);
    }

    const { data: parts, error: partsError } = await query;
    if (partsError) throw partsError;
    if (!parts || parts.length === 0) {
      return new Response(JSON.stringify({ processed: 0, total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process in sub-batches of 10 for the AI prompt
    let processed = 0;
    let errors = 0;
    const subBatchSize = 10;

    for (let i = 0; i < parts.length; i += subBatchSize) {
      const batch = parts.slice(i, i + subBatchSize);
      const partsList = batch.map((p, idx) => `${idx + 1}. [${p.material}] ${p.description} (Modelo: ${p.machine_model || "N/A"})`).join("\n");

      const prompt = `Classifique cada peça XCMG abaixo em EXATAMENTE uma das categorias:
${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Peças para classificar:
${partsList}

Retorne um array com o material e a categoria de cada peça.`;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "Você é um especialista em peças de equipamentos pesados XCMG. Classifique peças pela sua função." },
              { role: "user", content: prompt },
            ],
            tools: [{
              type: "function",
              function: {
                name: "categorize_parts",
                description: "Return categorized parts",
                parameters: {
                  type: "object",
                  properties: {
                    categories: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          material: { type: "string" },
                          category: { type: "string", enum: CATEGORIES },
                        },
                        required: ["material", "category"],
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
          if (response.status === 429) {
            await new Promise(r => setTimeout(r, 5000));
          }
          errors += batch.length;
          continue;
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

        if (result?.categories) {
          for (const item of result.categories) {
            if (item.material && CATEGORIES.includes(item.category)) {
              const { error: updateError } = await supabase
                .from("parts")
                .update({ part_category: item.category })
                .eq("material", item.material);
              if (!updateError) processed++;
              else errors++;
            }
          }
        }

        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error("Batch categorize error:", err);
        errors += batch.length;
      }
    }

    return new Response(JSON.stringify({ processed, errors, total: parts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("categorize-parts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
