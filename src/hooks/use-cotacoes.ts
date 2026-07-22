import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CotacaoStatus =
  | "recebida"
  | "verificando_estoque"
  | "aguardando_fabrica"
  | "fabrica_respondeu"
  | "cotando_parceiro"
  | "proposta_enviada"
  | "fechada"
  | "perdida";

export type CotacaoOrigem = "trafego_pago" | "whatsapp" | "email" | "indicacao" | "outro";
export type ItemFonte = "estoque" | "fabrica" | "parceiro" | "sem_fonte";
export type ItemDisp = "pendente" | "tem" | "nao_tem" | "parcial";

export interface Cotacao {
  id: string;
  numero: string;
  cliente_nome: string;
  cliente_whatsapp: string | null;
  cliente_email: string | null;
  origem: CotacaoOrigem;
  status: CotacaoStatus;
  responsavel: string | null;
  observacoes: string | null;
  valor_total: number;
  data_envio_fabrica: string | null;
  created_at: string;
  updated_at: string;
}

export interface CotacaoItem {
  id: string;
  cotacao_id: string;
  pn: string;
  descricao: string | null;
  quantidade: number;
  fonte: ItemFonte;
  preco_custo: number | null;
  preco_venda: number | null;
  desconto_fabrica: number | null;
  disponibilidade_fabrica: ItemDisp;
  prazo: string | null;
  data_envio_fabrica: string | null;
  data_resposta_fabrica: string | null;
  parceiro_nome: string | null;
  observacoes: string | null;
}

export const STATUS_LABEL: Record<CotacaoStatus, string> = {
  recebida: "Recebida",
  verificando_estoque: "Verificando Estoque",
  aguardando_fabrica: "Aguardando Fábrica",
  fabrica_respondeu: "Fábrica Respondeu",
  cotando_parceiro: "Cotando Parceiro",
  proposta_enviada: "Proposta Enviada",
  fechada: "Fechada",
  perdida: "Perdida",
};

export const STATUS_ORDER: CotacaoStatus[] = [
  "recebida",
  "verificando_estoque",
  "aguardando_fabrica",
  "fabrica_respondeu",
  "cotando_parceiro",
  "proposta_enviada",
  "fechada",
  "perdida",
];

export function useCotacoes() {
  return useQuery({
    queryKey: ["cotacoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cotacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Cotacao[];
    },
  });
}

export function useCotacao(id?: string) {
  return useQuery({
    queryKey: ["cotacao", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("cotacoes").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Cotacao;
    },
  });
}

export function useCotacaoItens(cotacaoId?: string) {
  return useQuery({
    queryKey: ["cotacao-itens", cotacaoId],
    enabled: !!cotacaoId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cotacao_itens")
        .select("*")
        .eq("cotacao_id", cotacaoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as CotacaoItem[];
    },
  });
}

export function useCreateCotacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      cliente_nome: string;
      cliente_whatsapp?: string;
      cliente_email?: string;
      origem: CotacaoOrigem;
      responsavel?: string;
      observacoes?: string;
      itens: { pn: string; descricao?: string; quantidade: number; fonte: ItemFonte }[];
    }) => {
      const { itens, ...cot } = payload;
      const { data: c, error } = await (supabase as any)
        .from("cotacoes")
        .insert(cot)
        .select("*")
        .single();
      if (error) throw error;
      if (itens.length) {
        const rows = itens.map((i) => ({ ...i, cotacao_id: c.id }));
        const { error: e2 } = await (supabase as any).from("cotacao_itens").insert(rows);
        if (e2) throw e2;
      }
      return c as Cotacao;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cotacoes"] });
      toast.success("Cotação criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCotacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Cotacao> }) => {
      const { error } = await (supabase as any).from("cotacoes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["cotacoes"] });
      qc.invalidateQueries({ queryKey: ["cotacao", v.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCotacaoItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CotacaoItem> }) => {
      const { error } = await (supabase as any).from("cotacao_itens").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cotacao-itens"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCotacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("cotacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cotacoes"] }),
  });
}

/** Lookup rápido de PN em `parts`. Retorna null se não encontrar. */
export async function lookupPN(pn: string) {
  if (!pn) return null;
  const { data } = await supabase
    .from("parts")
    .select("id, material, description, stock, estimated_price, machine_model")
    .ilike("material", pn.trim())
    .limit(1)
    .maybeSingle();
  return data;
}

export interface HistoricoPNRow {
  pn: string;
  item_id: string;
  cotacao_id: string;
  numero: string;
  cliente_nome: string;
  cotacao_data: string;
  quantidade: number;
  disponibilidade_fabrica: ItemDisp;
  preco_custo: number | null;
  preco_venda: number | null;
  desconto_fabrica: number | null;
  prazo: string | null;
  data_resposta_fabrica: string | null;
  fonte: ItemFonte;
  parceiro_nome: string | null;
}

export async function fetchHistoricoPN(pn: string): Promise<HistoricoPNRow[]> {
  if (!pn) return [];
  const { data, error } = await (supabase as any)
    .from("historico_pn")
    .select("*")
    .ilike("pn", pn.trim())
    .order("cotacao_data", { ascending: false })
    .limit(20);
  if (error) return [];
  return (data || []) as HistoricoPNRow[];
}

export function useHistoricoPN(pn: string) {
  return useQuery({
    queryKey: ["historico-pn", pn],
    enabled: !!pn && pn.length >= 2,
    queryFn: () => fetchHistoricoPN(pn),
  });
}
