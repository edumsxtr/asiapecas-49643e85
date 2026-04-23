// Normalization utilities for deduplication & matching

export function normalizeCnpj(value?: string | null): string | null {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length !== 11 && digits.length !== 14) return null;
  return digits;
}

export function formatCnpj(value?: string | null): string | null {
  const d = normalizeCnpj(value);
  if (!d) return value || null;
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function normalizePhone(value?: string | null): string | null {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits;
}

export function normalizeEmail(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim().toLowerCase();
  if (!trimmed.includes("@")) return null;
  return trimmed;
}

// Brazilian corporate suffixes & noise tokens that should be stripped before name comparison
const COMPANY_SUFFIXES = new Set([
  "ltda", "ltd", "me", "epp", "eireli", "sa", "s/a", "s.a", "sas",
  "cia", "cias", "company", "comp", "co", "inc", "corp", "corporation",
  "filial", "matriz", "grupo", "group", "holding", "holdings",
  "comercio", "comercial", "industria", "industrial", "industrias",
  "servicos", "servico", "ltdame", "ltdaepp",
  // Acronyms/words that often appear and add noise
  "construcoes", "construcao", "construtora",
  "mineracao", "mineracoes", "mineradora",
  "transportes", "transporte", "logistica",
  "engenharia", "tecnologia",
  "do", "da", "de", "dos", "das", "e", "&",
]);

function basicSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyName(value?: string | null): string {
  if (!value) return "";
  return basicSlug(String(value)).replace(/\s+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Canonicalize a company/customer name for fuzzy deduplication:
 * - removes accents, punctuation, lowercases
 * - drops Brazilian corporate suffixes (LTDA, EPP, ME, S/A, EIRELI, ...)
 * - drops common noise tokens (do/da/de, comercio, industria, ...)
 * - collapses whitespace
 *
 * Examples:
 *   "Construtora Santa Maria LTDA"     -> "santamaria"
 *   "CONSTRUTORA SANTA MARIA EIRELI EPP" -> "santamaria"
 *   "Bemisa Holding S.A."              -> "bemisa"
 */
export function canonicalCompanyName(value?: string | null): string {
  if (!value) return "";
  const slug = basicSlug(String(value));
  if (!slug) return "";
  const tokens = slug.split(" ").filter((t) => t && !COMPANY_SUFFIXES.has(t));
  // After stripping suffixes, drop very short noise (single letters)
  const cleaned = tokens.filter((t) => t.length > 1);
  return (cleaned.length > 0 ? cleaned : tokens).join("");
}

export function customerDedupKey(c: {
  cnpj_cpf?: string | null;
  email?: string | null;
  name?: string | null;
  city?: string | null;
}): string {
  const cnpj = normalizeCnpj(c.cnpj_cpf);
  if (cnpj) return `cnpj:${cnpj}`;
  const email = normalizeEmail(c.email);
  if (email) return `email:${email}`;
  const canon = canonicalCompanyName(c.name);
  const cityCanon = canonicalCompanyName(c.city);
  return `name:${canon}|${cityCanon}`;
}
