import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { material } = await req.json();
    if (!material) throw new Error("material is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch part details
    const { data: part } = await supabase
      .from("parts")
      .select("*")
      .eq("material", material)
      .single();

    if (!part) throw new Error("Part not found");

    const cats = [];
    if (part.is_mineracao) cats.push("Mineração");
    if (part.is_linha_amarela) cats.push("Linha Amarela");
    if (part.is_perfuratriz) cats.push("Perfuratriz");
    if (part.is_caminhao_eletrico) cats.push("Caminhão Elétrico");
    if (part.is_guindaste) cats.push("Guindaste");

    // Find similar parts by description keywords
    const keywords = part.description.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 3);
    let relatedParts: any[] = [];
    if (keywords.length > 0) {
      const orCond = keywords.map((w: string) => `description.ilike.%${w}%`).join(",");
      const { data } = await supabase
        .from("parts")
        .select("material, description, machine_model, stock, estimated_price")
        .or(orCond)
        .neq("material", material)
        .limit(10);
      relatedParts = data || [];
    }

    const prompt = `Você é um especialista em peças de equipamentos pesados XCMG. Analise esta peça e forneça informações técnicas detalhadas.

Peça:
- Código: ${part.material}
- Descrição: ${part.description}
- Modelo da máquina: ${part.machine_model || "N/A"}
- Fabricante: ${part.manufacturer || "XCMG"}
- Categorias: ${cats.join(", ") || "N/A"}
- Modelos compatíveis cadastrados: ${part.compatible_models?.join(", ") || "Nenhum"}

Peças possivelmente relacionadas no catálogo:
${relatedParts.map((p: any) => `- ${p.material}: ${p.description} (${p.machine_model})`).join("\n")}

Responda em JSON com esta estrutura exata:
{
  "technical_description": "Descrição técnica expandida da peça, sua função e aplicação",
  "probable_function": "Função principal da peça no equipamento",
  "compatible_machines": ["Lista de modelos de máquinas XCMG que provavelmente usam esta peça"],
  "technical_specs": ["Especificação 1", "Especificação 2"],
  "maintenance_tips": "Dicas de manutenção e substituição",
  "related_parts": ["Códigos de peças relacionadas do catálogo que podem ser necessárias junto com esta"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista técnico em equipamentos XCMG. Responda SEMPRE em JSON válido." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "part_analysis",
            description: "Return structured part analysis",
            parameters: {
              type: "object",
              properties: {
                technical_description: { type: "string" },
                probable_function: { type: "string" },
                compatible_machines: { type: "array", items: { type: "string" } },
                technical_specs: { type: "array", items: { type: "string" } },
                maintenance_tips: { type: "string" },
                related_parts: { type: "array", items: { type: "string" } },
              },
              required: ["technical_description", "probable_function", "compatible_machines", "technical_specs", "maintenance_tips", "related_parts"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "part_analysis" } },
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
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    let analysis;
    
    // Extract from tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse content as JSON
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse AI response" };
    }

    // Add related parts from our catalog
    analysis.catalog_related = relatedParts.slice(0, 5);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("part-research error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
