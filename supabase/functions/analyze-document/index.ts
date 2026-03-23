import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, question, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um analista especialista em peças de máquinas pesadas XCMG da Lopes & Lopes. 
O usuário enviou um documento/planilha para análise. Seu trabalho é:

1. **Identificar peças**: Se o documento contém códigos, descrições ou referências a peças, liste-as organizadamente
2. **Analisar preços**: Compare preços encontrados no documento com referências de mercado
3. **Detectar compatibilidade**: Identifique modelos de máquinas e peças compatíveis
4. **Resumir informações**: Crie um resumo executivo claro e organizado

## FORMATO DE RESPOSTA
- Use tabelas markdown quando listar peças ou preços
- Destaque informações importantes com **negrito**
- Use emojis para categorizar: 🔧 peças, 💰 preços, 📊 análise, ⚠️ alertas

## CONTEXTO
- Arquivo analisado: ${fileName || "documento"}
- A empresa trabalha com peças XCMG para mineração, construção civil, guindastes, perfuratrizes

Responda SEMPRE em português brasileiro.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Documento "${fileName}":\n\n${content}\n\n${question ? `Pergunta do usuário: ${question}` : "Analise este documento e extraia todas as informações relevantes sobre peças, preços e compatibilidade."}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
