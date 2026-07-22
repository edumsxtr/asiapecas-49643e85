
-- Enums
DO $$ BEGIN
  CREATE TYPE public.cotacao_status AS ENUM ('recebida','verificando_estoque','aguardando_fabrica','fabrica_respondeu','cotando_parceiro','proposta_enviada','fechada','perdida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cotacao_origem AS ENUM ('trafego_pago','whatsapp','email','indicacao','outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cotacao_item_fonte AS ENUM ('estoque','fabrica','parceiro','sem_fonte');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cotacao_item_disponibilidade AS ENUM ('pendente','tem','nao_tem','parcial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela cotacoes
CREATE TABLE public.cotacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE,
  cliente_nome text NOT NULL,
  cliente_whatsapp text,
  cliente_email text,
  origem public.cotacao_origem NOT NULL DEFAULT 'whatsapp',
  status public.cotacao_status NOT NULL DEFAULT 'recebida',
  responsavel text,
  observacoes text,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  data_envio_fabrica timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes TO authenticated;
GRANT ALL ON public.cotacoes TO service_role;
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage cotacoes" ON public.cotacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Numeração sequencial COT-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.set_cotacao_numero()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_prefix text;
  v_seq int;
BEGIN
  IF NEW.numero IS NOT NULL AND NEW.numero <> '' THEN RETURN NEW; END IF;
  v_prefix := 'COT-' || v_year || '-';
  SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(SPLIT_PART(numero,'-',3), '\D','','g'),'') AS int)),0) + 1
    INTO v_seq FROM public.cotacoes WHERE numero LIKE v_prefix || '%';
  NEW.numero := v_prefix || LPAD(v_seq::text, 4, '0');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_cotacao_numero BEFORE INSERT ON public.cotacoes
FOR EACH ROW EXECUTE FUNCTION public.set_cotacao_numero();

CREATE TRIGGER trg_cotacoes_updated BEFORE UPDATE ON public.cotacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- cotacao_itens
CREATE TABLE public.cotacao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id uuid NOT NULL REFERENCES public.cotacoes(id) ON DELETE CASCADE,
  pn text NOT NULL,
  descricao text,
  quantidade numeric(12,2) NOT NULL DEFAULT 1,
  fonte public.cotacao_item_fonte NOT NULL DEFAULT 'sem_fonte',
  preco_custo numeric(14,2),
  preco_venda numeric(14,2),
  desconto_fabrica numeric(6,2),
  disponibilidade_fabrica public.cotacao_item_disponibilidade NOT NULL DEFAULT 'pendente',
  prazo text,
  data_envio_fabrica timestamptz,
  data_resposta_fabrica timestamptz,
  parceiro_nome text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cotacao_itens_cot ON public.cotacao_itens(cotacao_id);
CREATE INDEX idx_cotacao_itens_pn ON public.cotacao_itens(pn);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacao_itens TO authenticated;
GRANT ALL ON public.cotacao_itens TO service_role;
ALTER TABLE public.cotacao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage cotacao_itens" ON public.cotacao_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_cotacao_itens_updated BEFORE UPDATE ON public.cotacao_itens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- cotacao_status_historico
CREATE TABLE public.cotacao_status_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id uuid NOT NULL REFERENCES public.cotacoes(id) ON DELETE CASCADE,
  status_anterior public.cotacao_status,
  status_novo public.cotacao_status NOT NULL,
  usuario_id uuid,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cot_hist_cot ON public.cotacao_status_historico(cotacao_id);
GRANT SELECT, INSERT ON public.cotacao_status_historico TO authenticated;
GRANT ALL ON public.cotacao_status_historico TO service_role;
ALTER TABLE public.cotacao_status_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth view hist" ON public.cotacao_status_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert hist" ON public.cotacao_status_historico FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger de histórico de status
CREATE OR REPLACE FUNCTION public.log_cotacao_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.cotacao_status_historico (cotacao_id, status_anterior, status_novo, usuario_id)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.cotacao_status_historico (cotacao_id, status_anterior, status_novo, usuario_id)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_cotacao_status_log
AFTER INSERT OR UPDATE OF status ON public.cotacoes
FOR EACH ROW EXECUTE FUNCTION public.log_cotacao_status_change();

-- View histórico por PN
CREATE OR REPLACE VIEW public.historico_pn AS
SELECT
  ci.pn,
  ci.id AS item_id,
  ci.cotacao_id,
  c.numero,
  c.cliente_nome,
  c.created_at AS cotacao_data,
  ci.quantidade,
  ci.disponibilidade_fabrica,
  ci.preco_custo,
  ci.preco_venda,
  ci.desconto_fabrica,
  ci.prazo,
  ci.data_resposta_fabrica,
  ci.fonte,
  ci.parceiro_nome
FROM public.cotacao_itens ci
JOIN public.cotacoes c ON c.id = ci.cotacao_id;

GRANT SELECT ON public.historico_pn TO authenticated;
