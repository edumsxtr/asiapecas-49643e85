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

    // Extract search terms from the last user message
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    let partsContext = "";

    if (lastUserMsg) {
      const searchText = lastUserMsg.content;
      
      // Search parts by description, material, or model
      const { data: parts } = await supabase
        .from("parts")
        .select("material, description, stock, estimated_price, machine_model, manufacturer, compatible_models, last_entry_time, is_mineracao, is_linha_amarela, is_perfuratriz, is_caminhao_eletrico, is_guindaste")
        .or(`description.ilike.%${searchText}%,material.ilike.%${searchText}%,machine_model.ilike.%${searchText}%`)
        .limit(20);

      if (parts && parts.length > 0) {
        partsContext = "\n\nPeças encontradas no catálogo:\n" + parts.map((p: any) => {
          const cats = [];
          if (p.is_mineracao) cats.push("Mineração");
          if (p.is_linha_amarela) cats.push("Linha Amarela");
          if (p.is_perfuratriz) cats.push("Perfuratriz");
          if (p.is_caminhao_eletrico) cats.push("Caminhão Elétrico");
          if (p.is_guindaste) cats.push("Guindaste");
          const compat = p.compatible_models?.length > 1 ? ` | Compatível: ${p.compatible_models.join(", ")}` : "";
          return `- ${p.material}: ${p.description} | Modelo: ${p.machine_model} | Estoque: ${p.stock} | Preço: R$ ${p.estimated_price} | Categorias: ${cats.join(", ")}${compat}`;
        }).join("\n");
      } else {
        // Try broader search with individual words
        const words = searchText.split(/\s+/).filter((w: string) => w.length > 2);
        if (words.length > 0) {
          const orConditions = words.map((w: string) => `description.ilike.%${w}%,machine_model.ilike.%${w}%`).join(",");
          const { data: broadParts } = await supabase
            .from("parts")
            .select("material, description, stock, estimated_price, machine_model, manufacturer, compatible_models, last_entry_time, is_mineracao, is_linha_amarela, is_perfuratriz, is_caminhao_eletrico, is_guindaste")
            .or(orConditions)
            .limit(15);

          if (broadParts && broadParts.length > 0) {
            partsContext = "\n\nPeças possivelmente relevantes encontradas:\n" + broadParts.map((p: any) => {
              const cats = [];
              if (p.is_mineracao) cats.push("Mineração");
              if (p.is_linha_amarela) cats.push("Linha Amarela");
              if (p.is_perfuratriz) cats.push("Perfuratriz");
              if (p.is_caminhao_eletrico) cats.push("Caminhão Elétrico");
              if (p.is_guindaste) cats.push("Guindaste");
              return `- ${p.material}: ${p.description} | Modelo: ${p.machine_model} | Estoque: ${p.stock} | Preço: R$ ${p.estimated_price} | Categorias: ${cats.join(", ")}`;
            }).join("\n");
          }
        }
      }

      // Get total stats for context
      const { count } = await supabase.from("parts").select("id", { count: "exact", head: true });
      partsContext += `\n\nTotal de peças no catálogo: ${count}`;
    }

    const systemPrompt = `Você é o assistente virtual da Lopes & Lopes, distribuidor e revendedor autorizado de peças XCMG no Brasil, Venezuela e Guiana. Sua função é ajudar a encontrar peças no catálogo.

Instruções:
- Responda SEMPRE em português brasileiro
- Quando o usuário perguntar sobre uma peça, busque no contexto fornecido
- Mostre informações de forma organizada: código, descrição, estoque, preço, modelo, categorias
- Se a peça tem modelos compatíveis, destaque isso como oportunidade de venda cruzada
- Se não encontrar a peça exata, sugira peças similares
- Formate preços em Real (R$)
- Seja proativo: sugira peças complementares ou compatíveis
- Se o estoque estiver baixo (<5 unidades), avise o usuário
- Se a peça tem mais de 2 anos parada, mencione que pode haver desconto${partsContext}`;

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
