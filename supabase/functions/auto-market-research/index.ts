// Auto Market Research — Lovable AI Gateway with Google Search
// Focused on ORIGINAL XCMG parts. CONTENT-VERIFIES URLs server-side (not just HTTP 200).
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

// Pathnames that almost always indicate listings/categories/home — not a single product page.
const GENERIC_PATH_REGEX =
  /^\/?$|^\/(produtos?|categorias?|catalogo|catálogo|busca|buscar|search|ofertas|loja|marca|marcas|lista|departamento|departamentos|home|index)(\/|$)|[?&](q|search|busca|query)=/i;

/** Normalize part numbers for tolerant matching (lowercase, strip space/hyphen/dot/underscore). */
function normalizePartNumber(s: string): string {
  return (s || "").toLowerCase().replace(/[\s\-._]/g, "");
}

// Proteção contra SSRF: bloqueia URLs que apontam para IPs internos/privados.
function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) return true;
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]), b = Number(m[2]);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;            // link-local + metadata cloud
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;  // CGNAT
  return false;
}
async function isSafePublicUrl(raw: string): Promise<boolean> {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^[\d.]+$/.test(host) || host.includes(":")) return !isPrivateIp(host); // IP literal
  try {
    const a = await Deno.resolveDns(host, "A").catch(() => null as string[] | null);
    if (a && a.some(isPrivateIp)) return false;
  } catch { /* Deno.resolveDns indisponível neste runtime */ }
  return true;
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isGenericUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    const pathAndQuery = u.pathname + u.search;
    if (GENERIC_PATH_REGEX.test(pathAndQuery)) return true;
    // Mercado Livre product anuncios always include /MLB-NNN- or /p/MLB
    if (/mercadolivre\.com|mercadolibre\./i.test(u.hostname)) {
      const isProduct = /\/MLB-?\d|\/p\/MLB/i.test(u.pathname);
      if (!isProduct) return true;
    }
    return false;
  } catch {
    return true;
  }
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&shy;/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      try { return String.fromCharCode(parseInt(n, 10)); } catch { return ""; }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      try { return String.fromCharCode(parseInt(n, 16)); } catch { return ""; }
    });
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function extractMetaSnippets(html: string): string {
  const parts: string[] = [];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) parts.push(titleMatch[1]);
  const metaMatches = html.matchAll(/<meta[^>]+(?:name|property)=["'](?:description|og:title|og:description|twitter:title|twitter:description|keywords)["'][^>]*content=["']([^"']+)["']/gi);
  for (const m of metaMatches) parts.push(m[1]);
  const h1Matches = html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  for (const m of h1Matches) parts.push(stripTags(m[1]));
  // JSON-LD product info
  const ldMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldMatches) parts.push(m[1]);
  return parts.join(" \n ");
}

function findEvidenceSnippet(text: string, needle: string): string | null {
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return null;
  const start = Math.max(0, idx - 50);
  const end = Math.min(text.length, idx + needle.length + 50);
  return text.slice(start, end).replace(/\s+/g, " ").trim().slice(0, 120);
}

interface VerifyResult { ok: boolean; evidence: string | null; reason?: string }

// In-memory verification cache (TTL 1h)
const verifyCache = new Map<string, { result: VerifyResult; ts: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

async function verifyUrlContainsPartNumber(
  url: string,
  material: string,
  alternateMatch?: string,
  timeoutMs = 6000,
): Promise<VerifyResult> {
  const cacheKey = `${url}|${material}|${alternateMatch || ""}`;
  const cached = verifyCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.result;

  const targets = Array.from(new Set([material, alternateMatch].filter(Boolean) as string[]));
  const targetsNorm = targets.map(normalizePartNumber);

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    if (isGenericUrl(url)) {
      const result = { ok: false, evidence: null, reason: "generic_url" };
      verifyCache.set(cacheKey, { result, ts: Date.now() });
      console.info(`verify reject (generic_url): ${url}`);
      return result;
    }

    if (!(await isSafePublicUrl(url))) {
      const result = { ok: false, evidence: null, reason: "blocked_url" };
      verifyCache.set(cacheKey, { result, ts: Date.now() });
      console.info(`verify reject (blocked_url): ${url}`);
      return result;
    }

    // HEAD probe — discard 404/timeout
    let head: Response | null = null;
    try {
      head = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AsiaPecasBot/1.0)" },
      });
    } catch { /* fall through to GET */ }
    if (head && head.status >= 400 && head.status !== 405 && head.status !== 403) {
      const result = { ok: false, evidence: null, reason: `http_${head.status}` };
      verifyCache.set(cacheKey, { result, ts: Date.now() });
      console.info(`verify reject (http_${head.status}): ${url}`);
      return result;
    }

    // Partial GET (200KB) for content verification
    const resp = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AsiaPecasBot/1.0)",
        Range: "bytes=0-204800",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (resp.status >= 400) {
      const result = { ok: false, evidence: null, reason: `http_${resp.status}` };
      verifyCache.set(cacheKey, { result, ts: Date.now() });
      console.info(`verify reject (http_${resp.status}): ${url}`);
      return result;
    }
    const html = decodeHtmlEntities(await resp.text());
    const meta = extractMetaSnippets(html);
    const text = stripTags(html);
    const combinedNorm = normalizePartNumber(meta + " " + text);

    // 1) Exact literal match in meta-tags / title / h1 / JSON-LD (highest trust)
    for (const target of targets) {
      const ev = findEvidenceSnippet(meta, target);
      if (ev) {
        const result = { ok: true, evidence: ev };
        verifyCache.set(cacheKey, { result, ts: Date.now() });
        console.info(`verify ok (meta literal "${target}"): ${url}`);
        return result;
      }
    }

    // 2) Literal match anywhere in body
    for (const target of targets) {
      const ev = findEvidenceSnippet(text, target);
      if (ev) {
        const result = { ok: true, evidence: ev };
        verifyCache.set(cacheKey, { result, ts: Date.now() });
        console.info(`verify ok (body literal "${target}"): ${url}`);
        return result;
      }
    }

    // 3) Normalized match (handles 860-126-593 vs 860126593)
    for (const tn of targetsNorm) {
      if (tn && combinedNorm.includes(tn)) {
        const idx = combinedNorm.indexOf(tn);
        const ev = combinedNorm.slice(Math.max(0, idx - 40), Math.min(combinedNorm.length, idx + tn.length + 40));
        const result = { ok: true, evidence: `[normalizado] ${ev}`.slice(0, 120) };
        verifyCache.set(cacheKey, { result, ts: Date.now() });
        console.info(`verify ok (normalized "${tn}"): ${url}`);
        return result;
      }
    }

    const result = { ok: false, evidence: null, reason: "no_match" };
    verifyCache.set(cacheKey, { result, ts: Date.now() });
    console.info(`verify reject (no_match): ${url}`);
    return result;
  } catch (e) {
    const result = { ok: false, evidence: null, reason: "fetch_error" };
    console.info(`verify reject (fetch_error): ${url} — ${e instanceof Error ? e.message : "?"}`);
    return result;
  } finally {
    clearTimeout(t);
  }
}

function buildSearchUrl(distributor: string, material: string, genuineOnly: boolean): string {
  const d = distributor.toLowerCase();
  const suffix = genuineOnly ? ' "original XCMG"' : "";
  const q = encodeURIComponent(`"${material}"${suffix}`);
  if (d.includes("mercado livre") || d.includes("mercadolivre")) {
    const term = genuineOnly ? `${material} original XCMG` : material;
    return `https://lista.mercadolivre.com.br/${encodeURIComponent(term)}`;
  }
  if (d.includes("tracbel")) return `https://www.google.com/search?q=site%3Atracbel.com.br+${q}`;
  if (d.includes("solar")) return `https://www.google.com/search?q=site%3Asolarequipamentos.com.br+${q}`;
  if (d.includes("sotreq")) return `https://www.google.com/search?q=site%3Asotreq.com.br+${q}`;
  return `https://www.google.com/search?q=${encodeURIComponent(`${distributor} "${material}"${suffix}`)}`;
}

// Export verifier so verify-market-url can reuse it (not actually used by Deno serve here, but kept clean).
export { verifyUrlContainsPartNumber };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = parsed.data;
    const genuineOnly = body.genuine_only !== false;
    const targetNorm = normalizePartNumber(body.material);

    const systemPrompt = `Você é um pesquisador de preços de peças GENUÍNAS / ORIGINAIS XCMG no mercado brasileiro.
A empresa que está pesquisando vende EXCLUSIVAMENTE peças ORIGINAIS XCMG (OEM/genuínas) — a comparação de preços precisa refletir isso.

REGRA DE OURO — MATCH EXATO DO CÓDIGO DE PEÇA:
- Você está procurando o CÓDIGO DE PEÇA EXATO: "${body.material}".
- Aceite SOMENTE anúncios/páginas que mostrem LITERALMENTE este mesmo código (ou variação trivial: hífen, espaço, ponto, maiúscula/minúscula).
- Se o anúncio NÃO mostra o código literal, DESCARTE — não invente match.
- Para CADA resultado retorne "matched_part_number" (texto LITERAL do código no anúncio) e "match_confidence" ("exact" | "normalized" | "uncertain").

REGRA DE OURO — source_url:
- source_url DEVE ser a URL EXATA da PÁGINA INDIVIDUAL DO ANÚNCIO (página de produto/peça específica).
- NÃO retorne URLs de homepage, listagem, busca, categoria ou marca. Exemplos PROIBIDOS:
  ❌ https://www.tracbel.com.br/
  ❌ https://www.tracbel.com.br/produtos
  ❌ https://lista.mercadolivre.com.br/...
  ❌ https://mercadolivre.com.br/ofertas
  ❌ qualquer URL com /busca, /search, /categoria, ?q=
- Exemplos ACEITÁVEIS:
  ✅ https://produto.mercadolivre.com.br/MLB-12345678-pistao-xcmg-860126593-_JM
  ✅ https://www.tracbel.com.br/pecas/produto/860126593-pistao-xcmg
- Se você NÃO tem certeza absoluta da URL exata da página do anúncio, OMITA o campo source_url. Melhor sem URL do que URL errada — URLs inválidas serão verificadas e descartadas pelo servidor.

REGRAS XCMG:
- Foque SOMENTE em peças GENUÍNAS / ORIGINAIS / OEM XCMG. ${genuineOnly ? "IGNORE COMPLETAMENTE peças paralelas, similares, compatíveis, recondicionadas, remanufaturadas, aftermarket." : "Inclua originais e paralelas, marcando is_genuine corretamente."}
- Distribuidores prioritários: XCMG Brasil oficial, Tracbel, Sotreq, Solar Equipamentos, distribuidores AUTORIZADOS XCMG, e Mercado Livre APENAS quando o anúncio diz explicitamente "Original XCMG".
- NUNCA invente preços. Preços em REAIS (BRL). Prazo em dias úteis. Máximo de 5 resultados.
- is_genuine: true SOMENTE quando o anúncio confirma "original XCMG", "genuína XCMG", "OEM XCMG" ou é dealer autorizado.`;

    const userPrompt = `Pesquise preços para esta peça ${genuineOnly ? "ORIGINAL XCMG (genuína / OEM)" : ""}:

Código EXATO procurado: ${body.material}
Descrição: ${body.description}
${body.manufacturer ? `Fabricante: ${body.manufacturer}` : ""}
${body.machine_model ? `Modelo de máquina: ${body.machine_model}` : ""}

Use Google Search com o código entre aspas para correspondência exata. Aceite SOMENTE resultados onde o código aparece LITERALMENTE no anúncio. Inclua source_url APENAS se for a URL exata da página do anúncio individual.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
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
              description: "Reporta preços de concorrentes com match exato do código de peça e URL verificável.",
              parameters: {
                type: "object",
                properties: {
                  search_summary: { type: "string" },
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        distributor_name: { type: "string" },
                        price_brl: { type: "number" },
                        delivery_days: { type: "number" },
                        availability: { type: "string", enum: ["em estoque", "sob encomenda", "indisponível"] },
                        source_url: { type: "string" },
                        is_genuine: { type: "boolean" },
                        matched_part_number: { type: "string" },
                        match_confidence: { type: "string", enum: ["exact", "normalized", "uncertain"] },
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
      return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos em Settings > Workspace > Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, text);
      return new Response(JSON.stringify({ error: `AI gateway error: ${aiResp.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ search_summary: "IA não retornou resultados estruturados.", results: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsedAI: { search_summary: string; results: ResultItem[] };
    try { parsedAI = JSON.parse(toolCall.function.arguments); }
    catch { parsedAI = { search_summary: "Falha ao interpretar resposta da IA.", results: [] }; }

    // 1) Drop parallel/aftermarket entries when genuine_only
    const rawResults = parsedAI.results || [];
    let droppedParallel = 0;
    const afterParallel = rawResults.filter((r) => {
      const haystack = `${r.distributor_name || ""} ${r.notes || ""}`;
      if (genuineOnly && (PARALLEL_REGEX.test(haystack) || r.is_genuine === false)) {
        droppedParallel++;
        return false;
      }
      return true;
    });

    // 2) Server-side EXACT part-number validation (from AI's reported matched_part_number)
    let droppedMismatch = 0;
    const afterMatch = afterParallel
      .map((r) => {
        const matched = (r.matched_part_number || "").trim();
        if (!matched || r.match_confidence === "uncertain") { droppedMismatch++; return null; }
        const matchedNorm = normalizePartNumber(matched);
        if (matched === body.material) return { ...r, match_confidence: "exact" as const };
        if (matchedNorm === targetNorm) return { ...r, match_confidence: "normalized" as const };
        droppedMismatch++; return null;
      })
      .filter((x): x is ResultItem => !!x);

    let summary = parsedAI.search_summary;
    if (afterMatch.length === 0 && rawResults.length > 0) {
      if (droppedMismatch > 0 && droppedParallel === 0) summary = `IA não localizou anúncios com o código exato "${body.material}". ${summary || ""}`.trim();
      else if (droppedParallel > 0 && droppedMismatch === 0) summary = `IA encontrou apenas peças paralelas. ${summary || ""}`.trim();
      else summary = `IA não encontrou referências válidas. ${summary || ""}`.trim();
    }

    // 3) CONTENT verification of URLs in parallel
    const validations = await Promise.allSettled(
      afterMatch.map(async (r) => {
        const candidate = r.source_url?.trim();
        let finalUrl: string | undefined;
        let urlType: "page" | "search" = "search";
        let verified = false;
        let evidence: string | null = null;

        if (candidate && isValidHttpUrl(candidate)) {
          const v = await verifyUrlContainsPartNumber(candidate, body.material, r.matched_part_number);
          if (v.ok) {
            finalUrl = candidate;
            urlType = "page";
            verified = true;
            evidence = v.evidence;
          }
        }

        if (!finalUrl) {
          finalUrl = buildSearchUrl(r.distributor_name, body.material, genuineOnly);
          urlType = "search";
          verified = false;
        }

        // Encode evidence inside notes (no migration required)
        let notes = r.notes || "";
        if (verified && evidence) {
          notes = `${notes}${notes ? " " : ""}[verificado: "${evidence.replace(/"/g, "'")}"]`;
        } else if (candidate && !verified) {
          notes = `${notes}${notes ? " " : ""}[link direto não confirmado — usando busca]`;
        }

        return {
          ...r,
          source_url: finalUrl,
          source_url_type: urlType,
          url_verified: verified,
          is_genuine: r.is_genuine === true,
          notes,
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
