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

export function slugifyName(value?: string | null): string {
  if (!value) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
  return `name:${slugifyName(c.name)}|${slugifyName(c.city)}`;
}
