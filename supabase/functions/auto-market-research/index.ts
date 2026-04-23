// Auto Market Research — Lovable AI Gateway with Google Search
// Focused on ORIGINAL XCMG parts. Validates URLs server-side and falls back to search URLs when needed.
// Enforces EXACT part-number match — discards similar / related codes.

import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  material: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  manufacturer: z.string().max(255).nullable().optional(),
  machine_model: z.string().max(255).nullable().optional(),
  genuine_only: z.boolean().optional().default(true),
});

interface ResultItem {
  distributor_name: string;
  price_brl: number;
  delivery_days?: number;
  availability?: string;
  source_url?: string;
  source_url_type?: "page" | "search";
  url_verified?: boolean;
  is_genuine?: boolean;
  matched_part_number?: string;
  match_confidence?: "exact" | "normalized" | "uncertain";
  notes?: string;
}

const PARALLEL_REGEX =
  /\b(paralel|similar|compat[íi]vel|alternativ|gen[ée]ric|recondicionad|remanufaturad|aftermarket|n[ãa]o\s+original)\b/i;

/** Normalize part numbers for tolerant matching (lowercase, strip space/hyphen/dot/underscore). */
function normalizePartNumber(s: string): string {
  return (s || "").toLowerCase().replace(/[\s\-._]/g, "");
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function checkUrl(url: string, timeoutMs = 4000): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    let resp = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AsiaPecasBot/1.0)" },
    });
    if (resp.status === 405 || resp.status === 403) {
      resp = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: ctrl.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AsiaPecasBot/1.0)",
          Range: "bytes=0-512",
        },
      });
    }
    return resp.status >= 200 && resp.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

function buildSearchUrl(distributor: string, material: string, genuineOnly: boolean): string {
  const d = distributor.toLowerCase();
  const suffix = genuineOnly ? ' "original XCMG"' : "";
  // Force exact code match on search engines via quotes
  const q = encodeURIComponent(`"${material}"${suffix}`);
  if (d.includes("mercado livre") || d.includes("mercadolivre")) {
    const term = genuineOnly ? `${material} original XCMG` : material;
    return `https://lista.mercadolivre.com.br/${encodeURIComponent(term)}`;
  }
  if (d.includes("tracbel")) {
    return `https://www.google.com/search?q=site%3Atracbel.com.br+${q}`;
  }
  if (d.includes("solar")) {
    return `https://www.google.com/search?q=site%3Asolarequipamentos.com.br+${q}`;
  }
  if (d.includes("sotreq")) {
    return `https://www.google.com/search?q=site%3Asotreq.com.br+${q}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${distributor} "${material}"${suffix}`)}`;
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

    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const body = parsed.data;
    const genuineOnly = body.genuine_only !== false;
    const targetNorm = normalizePartNumber(body.material);

    const systemPrompt = `Você é um pesquisador de preços de peças GENUÍNAS / ORIGINAIS XCMG no mercado brasileiro.
A empresa que está pesquisando vende EXCLUSIVAMENTE peças ORIGINAIS XCMG (OEM/genuínas) — a comparação de preços precisa refletir isso.

REGRA DE OURO — MATCH EXATO DO CÓDIGO DE PEÇA:
- Você está procurando o CÓDIGO DE PEÇA EXATO: "${body.material}".
- Aceite SOMENTE anúncios/páginas que mostrem LITERALMENTE este mesmo código (ou variação trivial: hífen, espaço, ponto, maiúscula/minúscula).
  - Exemplo: procurando "860126593" → ACEITE "860126593", "860-126-593", "860 126 593", "860.126.593".
  - REJEITE "860126594", "860126593-A", "860126592", "compatível com 860126593".
- Se o anúncio NÃO mostra o código literal, DESCARTE — não invente match.
- Para CADA resultado retorne o campo "matched_part_number" com o texto LITERAL do código encontrado no anúncio.
- Para CADA resultado retorne "match_confidence":
  - "exact" → o código bate caractere por caractere com "${body.material}"
  - "normalized" → bate ignorando espaços/hífens/pontos/case
  - "uncertain" → você acha que é o mesmo item mas NÃO viu o código literal (NUNCA use sem certeza — se for incerto, melhor não retornar)

REGRAS XCMG:
- Foque SOMENTE em peças GENUÍNAS / ORIGINAIS / OEM XCMG. ${genuineOnly ? "IGNORE COMPLETAMENTE peças paralelas, similares, compatíveis, recondicionadas, remanufaturadas, aftermarket ou de marcas alternativas." : "Inclua tanto originais quanto paralelas, mas marque cada uma corretamente em is_genuine."}
- Distribuidores prioritários: XCMG Brasil oficial (xcmgbrasil), Tracbel (dealer XCMG), Sotreq, Solar Equipamentos, distribuidores AUTORIZADOS XCMG, e Mercado Livre APENAS quando o anúncio diz explicitamente "Original XCMG" ou "Genuína XCMG".
- Retorne APENAS dados que você tenha alta confiança que existem. NUNCA invente preços.
- IMPORTANTÍSSIMO sobre source_url: a URL deve ser EXATAMENTE a página visitada na busca. Se você não tiver certeza absoluta de que a URL existe, OMITA o campo source_url. URLs inventadas serão descartadas.
- Para cada resultado, defina is_genuine: true SOMENTE quando o anúncio confirma explicitamente "original XCMG", "genuína XCMG", "OEM XCMG" ou é dealer autorizado. Caso contrário, is_genuine: false.
${genuineOnly ? '- Se você só encontrar peças paralelas/genéricas ou códigos diferentes, retorne results: [] e explique em search_summary.' : ""}
- Preços em REAIS (BRL). Prazo em dias úteis. Máximo de 5 resultados.`;

    const userPrompt = `Pesquise preços para esta peça ${genuineOnly ? "ORIGINAL XCMG (genuína / OEM)" : ""} no mercado brasileiro:

Código EXATO procurado: ${body.material}
Descrição: ${body.description}
${body.manufacturer ? `Fabricante: ${body.manufacturer}` : ""}
${body.machine_model ? `Modelo de máquina: ${body.machine_model}` : ""}

Use busca na web (Google Search) com o código ENTRE ASPAS para forçar correspondência exata:
"${body.material}" original XCMG
"${body.material}" OEM XCMG
"${body.material}" genuína XCMG

Aceite SOMENTE resultados onde o código "${body.material}" aparece LITERALMENTE no anúncio/página. ${genuineOnly ? "Descarte qualquer resultado paralelo, similar, compatível, recondicionado ou aftermarket." : ""} Para cada resultado, preencha matched_part_number com o código EXATO visto no anúncio e match_confidence ("exact" ou "normalized"). Inclua source_url APENAS se tiver certeza absoluta da URL.`;

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
              description: "Reporta os preços de concorrentes encontrados, com match exato do código de peça.",
              parameters: {
                type: "object",
                properties: {
                  search_summary: {
                    type: "string",
                    description: "Breve resumo da busca: o que foi pesquisado, se foram encontradas peças originais XCMG com o código exato, ou apenas códigos diferentes / paralelas.",
                  },
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        distributor_name: { type: "string" },
                        price_brl: { type: "number" },
                        delivery_days: { type: "number" },
                        availability: {
                          type: "string",
                          enum: ["em estoque", "sob encomenda", "indisponível"],
                        },
                        source_url: { type: "string" },
                        is_genuine: {
                          type: "boolean",
                          description: "true SOMENTE quando o anúncio confirma explicitamente que é peça ORIGINAL XCMG (genuína / OEM).",
                        },
                        matched_part_number: {
                          type: "string",
                          description: "O código de peça EXATO conforme aparece literalmente no anúncio/página visitada.",
                        },
                        match_confidence: {
                          type: "string",
                          enum: ["exact", "normalized", "uncertain"],
                          description: "exact = bate caractere por caractere; normalized = bate ignorando espaços/hífens/case; uncertain = não viu o código literal (será descartado).",
                        },
                        notes: { type: "string" },
                      },
                      required: ["distributor_name", "price_brl", "is_genuine", "matched_part_number", "match_confidence"],
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

    let parsedAI: { search_summary: string; results: ResultItem[] };
    try {
      parsedAI = JSON.parse(toolCall.function.arguments);
    } catch {
      parsedAI = { search_summary: "Falha ao interpretar resposta da IA.", results: [] };
    }

    // 1) Drop parallel/aftermarket entries when genuine_only is on
    const rawResults = parsedAI.results || [];
    let droppedParallel = 0;
    const afterParallel = rawResults.filter((r) => {
      const haystack = `${r.distributor_name || ""} ${r.notes || ""}`;
      const looksParallel = PARALLEL_REGEX.test(haystack);
      if (genuineOnly && (looksParallel || r.is_genuine === false)) {
        droppedParallel++;
        return false;
      }
      return true;
    });

    // 2) Server-side EXACT part-number validation
    let droppedMismatch = 0;
    const afterMatch = afterParallel
      .map((r) => {
        const matched = (r.matched_part_number || "").trim();
        if (!matched || r.match_confidence === "uncertain") {
          droppedMismatch++;
          return null;
        }
        const matchedNorm = normalizePartNumber(matched);
        if (matched === body.material) {
          return { ...r, match_confidence: "exact" as const };
        }
        if (matchedNorm === targetNorm) {
          return { ...r, match_confidence: "normalized" as const };
        }
        droppedMismatch++;
        return null;
      })
      .filter((x): x is ResultItem => !!x);

    let summary = parsedAI.search_summary;
    if (afterMatch.length === 0 && rawResults.length > 0) {
      if (droppedMismatch > 0 && droppedParallel === 0) {
        summary = `IA não localizou anúncios com o código exato "${body.material}" — apenas códigos diferentes ou similares. ${summary || ""}`.trim();
      } else if (droppedParallel > 0 && droppedMismatch === 0) {
        summary = `IA encontrou apenas peças paralelas/genéricas — sem referência confiável de original XCMG. ${summary || ""}`.trim();
      } else {
        summary = `IA não encontrou referências válidas (códigos diferentes ou paralelas descartadas). ${summary || ""}`.trim();
      }
    }

    // 3) Validate URLs in parallel and fall back to search URLs when invalid
    const validations = await Promise.allSettled(
      afterMatch.map(async (r) => {
        const candidate = r.source_url?.trim();
        let finalUrl: string | undefined;
        let urlType: "page" | "search" = "search";
        let verified = false;

        if (candidate && isValidHttpUrl(candidate)) {
          const ok = await checkUrl(candidate);
          if (ok) {
            finalUrl = candidate;
            urlType = "page";
            verified = true;
          }
        }

        if (!finalUrl) {
          finalUrl = buildSearchUrl(r.distributor_name, body.material, genuineOnly);
          urlType = "search";
          verified = false;
        }

        return {
          ...r,
          source_url: finalUrl,
          source_url_type: urlType,
          url_verified: verified,
          is_genuine: r.is_genuine === true,
        } as ResultItem;
      }),
    );

    const enriched = validations
      .map((v) => (v.status === "fulfilled" ? v.value : null))
      .filter((x): x is ResultItem => !!x);

    return new Response(
      JSON.stringify({
        search_summary: summary,
        results: enriched,
        dropped_parallel_count: droppedParallel,
        dropped_mismatch_count: droppedMismatch,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("auto-market-research error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
