import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { material, description, part_category, subcategory, manufacturer, machine_model, condition } = body ?? {};

    if (!description && !material) {
      return new Response(JSON.stringify({ error: 'description or material required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = `Gere um termo de garantia adequado para a seguinte peça vendida no Brasil:

- Código/Material: ${material || '—'}
- Descrição: ${description || '—'}
- Categoria: ${part_category || '—'}
- Subcategoria: ${subcategory || '—'}
- Fabricante: ${manufacturer || '—'}
- Modelo da máquina: ${machine_model || '—'}
- Condição: ${condition || 'Novo'}

Considere o tipo de peça (consumível, hidráulico, elétrico, motor, rodante, recondicionado, usado etc.) para definir um prazo realista. Devolva APENAS um JSON com este formato:
{
  "months": número inteiro (0 se for consumível sem garantia),
  "suggested_name": "Nome curto do template (ex: Garantia Hidráulica 3m)",
  "intro_text": "Parágrafo introdutório do termo de garantia (2-3 frases)",
  "conditions": ["condição 1", "condição 2", "..."],
  "exclusions": ["exclusão 1", "exclusão 2", "..."]
}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um especialista em garantia de peças industriais e de máquinas pesadas. Responda SEMPRE em português do Brasil e apenas com JSON válido.' },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: 'Limite de requisições. Tente novamente em alguns instantes.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos no workspace.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: 'AI gateway error: ' + t.slice(0, 300) }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const result = {
      months: Number(parsed.months ?? 3) || 0,
      suggested_name: String(parsed.suggested_name ?? 'Garantia personalizada'),
      intro_text: String(parsed.intro_text ?? ''),
      conditions: Array.isArray(parsed.conditions) ? parsed.conditions.map(String) : [],
      exclusions: Array.isArray(parsed.exclusions) ? parsed.exclusions.map(String) : [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
