import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { topic, material } = await req.json();
    if (!topic && !material) {
      return new Response(JSON.stringify({ ok: false, error: "topic or material required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    // Build context from real data
    let context = "";
    let relatedPartIds: string[] = [];
    let suggestedCategory = "dicas-tecnicas";

    if (material) {
      const { data: part } = await sb
        .from("parts")
        .select("id, material, description, manufacturer, machine_model, part_category, estimated_price, compatible_models")
        .eq("material", material)
        .maybeSingle();
      if (part) {
        relatedPartIds = [part.id];
        const { data: ai } = await sb
          .from("ai_compatibility_results")
          .select("technical_description, compatible_machines, maintenance_tips, technical_specs")
          .eq("part_id", part.id)
          .maybeSingle();

        context = `Dados da peça:
- Código: ${part.material}
- Descrição: ${part.description}
- Fabricante: ${part.manufacturer || "XCMG"}
- Modelo da máquina: ${part.machine_model || "—"}
- Categoria: ${part.part_category || "—"}
- Modelos compatíveis: ${(part.compatible_models || []).join(", ") || "—"}
${ai?.technical_description ? `- Descrição técnica: ${ai.technical_description}` : ""}
${ai?.maintenance_tips ? `- Dicas de manutenção: ${JSON.stringify(ai.maintenance_tips)}` : ""}
${ai?.compatible_machines?.length ? `- Máquinas compatíveis: ${ai.compatible_machines.join(", ")}` : ""}
`;
        if (part.part_category?.toLowerCase().includes("min")) suggestedCategory = "mineracao";
        else if (part.machine_model) suggestedCategory = "linha-amarela";
        else suggestedCategory = "pecas-xcmg";
      }
    } else {
      // Topic-based: pull a few related parts as inspiration
      const { data: parts } = await sb
        .from("parts")
        .select("id, material, description, machine_model")
        .gt("stock", 0)
        .order("stock", { ascending: false })
        .limit(5);
      if (parts) {
        relatedPartIds = parts.map((p) => p.id);
        context = `Algumas peças do catálogo (use como inspiração ou exemplos):
${parts.map((p) => `- ${p.material}: ${p.description}${p.machine_model ? ` (${p.machine_model})` : ""}`).join("\n")}`;
      }
    }

    const prompt = `Você é um especialista em peças de máquinas pesadas XCMG escrevendo para o blog da Ásia Peças & Máquinas.
${topic ? `Tópico solicitado: "${topic}"` : `Escreva um post sobre a peça: ${material}`}

${context}

Escreva um post técnico e informativo em português brasileiro, otimizado para SEO, com:
- Título atrativo com palavras-chave (até 70 caracteres)
- Slug (URL amigável)
- Excerpt (resumo de 150-200 caracteres)
- Conteúdo em Markdown com pelo menos 600 palavras, estruturado com H2 e H3
- Inclua subtítulos como: O que é, Como funciona, Sinais de desgaste, Manutenção preventiva, Onde comprar
- Mencione "Ásia Peças & Máquinas" como referência confiável no Brasil
- Meta description (até 160 caracteres)
- 4-6 tags relevantes

Responda APENAS em JSON válido, sem markdown:
{
  "title": "...",
  "slug": "...",
  "excerpt": "...",
  "content_md": "...",
  "seo_description": "...",
  "tags": ["...", "..."]
}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um redator técnico especializado em peças de máquinas pesadas. Responda sempre em JSON válido." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      throw new Error(`AI gateway: ${aiResp.status} ${errText}`);
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    const slug = (parsed.slug && slugify(parsed.slug)) || slugify(parsed.title || `post-${Date.now()}`);

    // Ensure unique slug
    let finalSlug = slug;
    let attempt = 1;
    while (true) {
      const { data: existing } = await sb.from("blog_posts").select("id").eq("slug", finalSlug).maybeSingle();
      if (!existing) break;
      finalSlug = `${slug}-${attempt++}`;
      if (attempt > 50) break;
    }

    const { data: post, error } = await sb
      .from("blog_posts")
      .insert({
        slug: finalSlug,
        title: parsed.title?.slice(0, 200) || "Sem título",
        excerpt: parsed.excerpt?.slice(0, 300) || null,
        content_md: parsed.content_md || "",
        seo_description: parsed.seo_description?.slice(0, 160) || null,
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
        category_slug: suggestedCategory,
        related_part_ids: relatedPartIds,
        status: "draft",
        ai_generated: true,
        author_name: "Ásia Peças & Máquinas (IA)",
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, post }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-blog-post error:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message || "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
