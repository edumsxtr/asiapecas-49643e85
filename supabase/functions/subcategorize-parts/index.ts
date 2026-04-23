import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUBCATEGORIES = [
  "Mangueiras e Conexões",
  "Vedações e Retentores",
  "Rolamentos",
  "Parafusos e Fixadores",
  "Cabos e Elétrica",
  "Iluminação",
  "Sensores",
  "Lubrificantes e Fluidos",
  "Ferramentas",
  "Pneus e Rodas",
  "Cabine e Acabamento",
  "Estrutura e Chassi",
  "Outros Acessórios",
] as const;

interface PartIn {
  id: string;
  material: string;
  description: string;
  manufacturer?: string | null;
  machine_model?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const mode: "preview" | "apply" = body.mode === "apply" ? "apply" : "preview";
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 100);

    if (mode === "apply") {
      const updates: Array<{ id: string; subcategory: string }> = body.updates || [];
      let ok = 0;
      for (const u of updates) {
        const { error } = await supabase
          .from("parts")
          .update({ part_category: u.subcategory, reviewed_at: new Date().toISOString() })
          .eq("id", u.id);
        if (!error) ok++;
      }
      return new Response(JSON.stringify({ updated: ok, total: updates.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // preview: pega lote em "Acessórios e Outros" / sem categoria
    const { data: parts, error } = await supabase
      .from("parts")
      .select("id,material,description,manufacturer,machine_model,part_category")
      .or("part_category.ilike.%acess%,part_category.is.null")
      .limit(limit);

    if (error) throw error;
    if (!parts || parts.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itemsForAI = (parts as PartIn[]).map((p) => ({
      id: p.id,
      desc: p.description?.slice(0, 200) || p.material,
      mfr: p.manufacturer || "",
      model: p.machine_model || "",
    }));

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é especialista em peças de máquinas pesadas. Classifique cada peça em UMA das subcategorias fornecidas. Retorne via tool call.",
          },
          {
            role: "user",
            content: `Classifique cada peça abaixo. Subcategorias permitidas: ${SUBCATEGORIES.join(", ")}\n\nPeças:\n${JSON.stringify(itemsForAI)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_parts",
              description: "Classifica peças em subcategorias",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        subcategory: { type: "string", enum: [...SUBCATEGORIES] },
                        confidence: { type: "number", minimum: 0, maximum: 1 },
                        reasoning: { type: "string" },
                      },
                      required: ["id", "subcategory", "confidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["results"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_parts" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit. Tente novamente em alguns segundos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos esgotados na Lovable AI." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      throw new Error(`AI gateway: ${aiResp.status} ${t}`);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { results: [] };

    const partMap = new Map(parts.map((p) => [p.id, p]));
    const suggestions = (args.results || []).map((r: any) => {
      const p = partMap.get(r.id);
      return {
        id: r.id,
        material: p?.material,
        description: p?.description,
        currentCategory: p?.part_category || "Sem categoria",
        suggestedSubcategory: r.subcategory,
        confidence: r.confidence,
        reasoning: r.reasoning,
      };
    });

    return new Response(JSON.stringify({ suggestions, batchSize: parts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("subcategorize-parts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
