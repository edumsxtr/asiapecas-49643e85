
-- ============ 1. customers: campos fiscais + endereço estruturado ============
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS trade_name text,
  ADD COLUMN IF NOT EXISTS state_registration text,
  ADD COLUMN IF NOT EXISTS municipal_registration text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS address_district text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_zip text;

-- ============ 2. customer_contacts ============
CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  phone text,
  email text,
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_contacts TO authenticated;
GRANT ALL ON public.customer_contacts TO service_role;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all customer_contacts" ON public.customer_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer ON public.customer_contacts(customer_id);
CREATE TRIGGER trg_customer_contacts_updated BEFORE UPDATE ON public.customer_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 3. salespeople ============
CREATE TABLE IF NOT EXISTS public.salespeople (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Comercial',
  phone text,
  email text,
  signature_url text,
  active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salespeople TO authenticated;
GRANT ALL ON public.salespeople TO service_role;
ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all salespeople" ON public.salespeople
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_salespeople_updated BEFORE UPDATE ON public.salespeople
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default salesperson
INSERT INTO public.salespeople (name, role, phone, email, is_default, active)
VALUES ('Luís Eduardo', 'Comercial | Ásia Peças & Máquinas', '+55 31 98733-4504', 'vendas@asiapecas.com', true, true)
ON CONFLICT DO NOTHING;

-- ============ 4. warranty_templates ============
CREATE TABLE IF NOT EXISTS public.warranty_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  months integer NOT NULL DEFAULT 3,
  intro_text text NOT NULL DEFAULT '',
  conditions text[] NOT NULL DEFAULT '{}',
  exclusions text[] NOT NULL DEFAULT '{}',
  default_for_category text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_templates TO authenticated;
GRANT ALL ON public.warranty_templates TO service_role;
ALTER TABLE public.warranty_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all warranty_templates" ON public.warranty_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_warranty_templates_updated BEFORE UPDATE ON public.warranty_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: Motor Cummins Novo (from BORAPEÇAS example)
INSERT INTO public.warranty_templates (name, months, intro_text, conditions, exclusions, default_for_category) VALUES
('Motor Novo Cummins', 3,
 'Os motores possuem garantia de 03 (três) meses, contados a partir da emissão da nota fiscal ou entrega do produto, prevalecendo a condição formalizada no pedido. A garantia cobre defeitos de funcionamento relacionados ao motor, desde que não sejam causados por instalação inadequada, mau uso, ausência de manutenção, uso fora da aplicação recomendada, superaquecimento, lubrificação incorreta, contaminação por combustível, entrada de impurezas ou intervenções não autorizadas.',
 ARRAY[
   'Instalação realizada por profissional ou empresa tecnicamente qualificada.',
   'Utilização de óleo, filtros, aditivos e combustível dentro das especificações recomendadas.',
   'Substituição dos filtros, óleo lubrificante e fluidos necessários no momento da instalação.',
   'Verificação prévia dos sistemas de arrefecimento, admissão, alimentação de combustível, sistema elétrico e periféricos.',
   'Operação do motor dentro dos limites normais de temperatura, pressão de óleo, rotação e carga.',
   'Execução das manutenções preventivas conforme horímetro e recomendações técnicas.',
   'Apresentação de nota fiscal, ordem de serviço ou relatório técnico de instalação/manutenção quando solicitado.'
 ],
 ARRAY[
   'Danos por superaquecimento; falta ou baixa pressão de óleo; óleo incorreto ou contaminado; combustível contaminado; entrada de água, poeira ou impurezas.',
   'Instalação incorreta; falhas em radiador, turbina, bomba injetora, bicos, chicote, módulo, sensores ou periféricos externos.',
   'Adaptações ou abertura do motor sem autorização; custos de remoção, instalação, deslocamento, frete, parada de máquina, lucros cessantes ou demais despesas operacionais.'
 ],
 'Motor'),
('Peça Nova - Padrão', 3,
 'Garantia de 03 (três) meses contra defeitos de fabricação, contados a partir da emissão da nota fiscal.',
 ARRAY['Instalação por profissional qualificado.', 'Uso conforme aplicação recomendada.', 'Apresentação da nota fiscal.'],
 ARRAY['Mau uso, instalação inadequada, desgaste natural.', 'Custos de instalação, frete ou parada de máquina.'],
 NULL),
('Sem Garantia', 0,
 'Item vendido sem garantia, conforme acordo entre as partes.',
 ARRAY[]::text[], ARRAY[]::text[], NULL)
ON CONFLICT DO NOTHING;

-- ============ 5. payment_condition_templates ============
CREATE TABLE IF NOT EXISTS public.payment_condition_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'entry_installments', -- 'cash' | 'entry_installments' | 'installments'
  entry_pct numeric NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  interval_days integer NOT NULL DEFAULT 30,
  discount_pct numeric NOT NULL DEFAULT 0,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_condition_templates TO authenticated;
GRANT ALL ON public.payment_condition_templates TO service_role;
ALTER TABLE public.payment_condition_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all payment_condition_templates" ON public.payment_condition_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_payment_condition_templates_updated BEFORE UPDATE ON public.payment_condition_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payment_condition_templates (name, kind, entry_pct, installments, interval_days, discount_pct, notes) VALUES
('À vista PIX (5% desc.)', 'cash', 100, 0, 0, 5, 'Desconto aplicado para pagamento à vista via PIX.'),
('40% + 3x mensal', 'entry_installments', 40, 3, 30, 0, 'Entrada na aprovação, 3 boletos mensais.'),
('30/60/90 dias', 'installments', 0, 3, 30, 0, '3 parcelas iguais em 30, 60 e 90 dias.'),
('50% + 50% em 30 dias', 'entry_installments', 50, 1, 30, 0, NULL)
ON CONFLICT DO NOTHING;

-- ============ 6. proposal_settings: bancário, razão social emissora, tema ============
ALTER TABLE public.proposal_settings
  ADD COLUMN IF NOT EXISTS legal_company_name text NOT NULL DEFAULT 'Lopes e Lopes Mineração Ltda',
  ADD COLUMN IF NOT EXISTS legal_state_registration text,
  ADD COLUMN IF NOT EXISTS website text NOT NULL DEFAULT 'www.asiapecas.com',
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_agency text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS bank_favored text,
  ADD COLUMN IF NOT EXISTS bank_cnpj text,
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pdf_theme text NOT NULL DEFAULT 'bw_institutional',
  ADD COLUMN IF NOT EXISTS intro_paragraph text NOT NULL DEFAULT 'Apresentamos abaixo nossa proposta comercial, elaborada com condições comerciais, garantia e logística definidas para o atendimento de sua empresa.';

-- ============ 7. sales: proposta + vendedor + pagamento + frete ============
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS proposal_number text,
  ADD COLUMN IF NOT EXISTS salesperson_id uuid REFERENCES public.salespeople(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_template_id uuid REFERENCES public.payment_condition_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS freight_terms text NOT NULL DEFAULT 'Por conta do comprador.',
  ADD COLUMN IF NOT EXISTS validity_days integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS intro_paragraph text,
  ADD COLUMN IF NOT EXISTS observations text,
  ADD COLUMN IF NOT EXISTS proposal_status text NOT NULL DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.customer_contacts(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_proposal_number ON public.sales(proposal_number) WHERE proposal_number IS NOT NULL;

-- ============ 8. sale_items: condição, garantia, retirada ============
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS condition text NOT NULL DEFAULT 'Novo',
  ADD COLUMN IF NOT EXISTS description_override text,
  ADD COLUMN IF NOT EXISTS warranty_template_id uuid REFERENCES public.warranty_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS warranty_custom_months integer,
  ADD COLUMN IF NOT EXISTS warranty_custom_text text,
  ADD COLUMN IF NOT EXISTS pickup_address text;

-- ============ 9. proposal number generator ============
CREATE OR REPLACE FUNCTION public.generate_proposal_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date text := to_char(now(), 'DDMMYYYY');
  v_prefix text := 'AP-' || v_date || '-';
  v_seq int;
  v_num text;
BEGIN
  SELECT COALESCE(MAX(
    CAST(NULLIF(regexp_replace(SPLIT_PART(proposal_number, '-', 3), '\D', '', 'g'), '') AS int)
  ), 0) + 1
  INTO v_seq
  FROM public.sales
  WHERE proposal_number LIKE v_prefix || '%';
  v_num := v_prefix || LPAD(v_seq::text, 3, '0');
  RETURN v_num;
END;
$$;
GRANT EXECUTE ON FUNCTION public.generate_proposal_number() TO authenticated;
