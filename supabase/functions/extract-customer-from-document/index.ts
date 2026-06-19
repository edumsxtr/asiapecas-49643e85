// Extracts structured customer registration data from free text, a PDF, or a DOCX file using Lovable AI Gateway (Gemini).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

type ReqBody = {
  text?: string;
  fileBase64?: string;
  fileType?: "pdf" | "docx";
  fileName?: string;
};

const SYSTEM_PROMPT = `Você é um assistente que extrai dados cadastrais de clientes (empresas brasileiras) a partir de textos, PDFs ou documentos Word.
Retorne SEMPRE um JSON puro (sem markdown, sem comentários) seguindo exatamente este schema:

{
  "legal_name": string|null,         // Razão Social
  "trade_name": string|null,         // Nome Fantasia
  "cnpj_cpf": string|null,           // Apenas dígitos
  "state_registration": string|null, // Inscrição Estadual
  "municipal_registration": string|null,
  "email": string|null,              // email principal
  "phone": string|null,              // telefone principal
  "website": string|null,
  "segment": string|null,            // mineração, construção, logística, energia, agronegócio, geral
  "address": {
    "street": string|null,
    "number": string|null,
    "complement": string|null,
    "district": string|null,
    "city": string|null,
    "state": string|null,            // UF, 2 letras
    "zip": string|null               // apenas dígitos
  },
  "contacts": [
    { "name": string, "role": string|null, "phone": string|null, "email": string|null, "is_primary": boolean }
  ],
  "notes": string|null               // observações relevantes que não couberam em outros campos
}

Regras:
- Se a informação não estiver clara, use null. Não invente.
- CNPJ e CEP somente dígitos.
- UF em maiúsculas.
- Email em minúsculas.
- Marque is_primary=true no contato mais provável (1 só).
- Detecte múltiplos contatos (nome + cargo/setor).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;
    const { text, fileBase64, fileType, fileName } = body || {};

    if (!text && !fileBase64) {
      return new Response(JSON.stringify({ error: "Informe 'text' ou 'fileBase64'." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (fileBase64) {
      const approxBytes = Math.floor((fileBase64.length * 3) / 4);
      if (approxBytes > MAX_BYTES) {
        return new Response(JSON.stringify({ error: "Arquivo maior que 10MB." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (fileType !== "pdf" && fileType !== "docx") {
        return new Response(JSON.stringify({ error: "fileType deve ser 'pdf' ou 'docx'." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const userContent: Array<Record<string, unknown>> = [];
    userContent.push({
      type: "text",
      text: text
        ? `Extraia os dados cadastrais do cliente a partir do texto abaixo:\n\n${text}`
        : `Extraia os dados cadastrais do cliente a partir do arquivo anexo (${fileName || fileType}).`,
    });

    if (fileBase64 && fileType) {
      const mime = fileType === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      userContent.push({
        type: "file",
        file: {
          filename: fileName || (fileType === "pdf" ? "cliente.pdf" : "cliente.docx"),
          file_data: `data:${mime};base64,${fileBase64}`,
        },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      const status = aiRes.status;
      console.error("AI gateway error", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha no serviço de IA.", detail: errText.slice(0, 500) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content: string | undefined = aiJson?.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: Record<string, unknown>;
    try {
      // Try direct JSON; if it came wrapped in markdown fences, strip them.
      const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse failed", e, content);
      return new Response(JSON.stringify({ error: "JSON inválido retornado pela IA.", raw: content.slice(0, 500) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize
    const onlyDigits = (s: unknown) => typeof s === "string" ? s.replace(/\D+/g, "") || null : null;
    const upper = (s: unknown) => typeof s === "string" ? s.trim().toUpperCase() || null : null;
    const lower = (s: unknown) => typeof s === "string" ? s.trim().toLowerCase() || null : null;
    const str = (s: unknown) => typeof s === "string" ? s.trim() || null : null;

    const addr = (parsed.address || {}) as Record<string, unknown>;
    const contacts = Array.isArray(parsed.contacts) ? parsed.contacts as Record<string, unknown>[] : [];

    const result = {
      legal_name: str(parsed.legal_name),
      trade_name: str(parsed.trade_name),
      cnpj_cpf: onlyDigits(parsed.cnpj_cpf),
      state_registration: str(parsed.state_registration),
      municipal_registration: str(parsed.municipal_registration),
      email: lower(parsed.email),
      phone: str(parsed.phone),
      website: str(parsed.website),
      segment: str(parsed.segment),
      address: {
        street: str(addr.street),
        number: str(addr.number),
        complement: str(addr.complement),
        district: str(addr.district),
        city: str(addr.city),
        state: upper(addr.state)?.slice(0, 2) || null,
        zip: onlyDigits(addr.zip),
      },
      contacts: contacts.map((c) => ({
        name: str(c.name) || "",
        role: str(c.role),
        phone: str(c.phone),
        email: lower(c.email),
        is_primary: Boolean(c.is_primary),
      })).filter((c) => c.name),
      notes: str(parsed.notes),
    };

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-customer-from-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
