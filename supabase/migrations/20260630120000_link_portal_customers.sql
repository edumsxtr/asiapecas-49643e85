-- =====================================================================
-- Vincular clientes do PORTAL à tabela public.customers (hub do CRM)
--
-- Objetivo: quando alguém se cadastra em /portal/login (aba "Criar conta"),
-- criar automaticamente um registro em customers, vinculado ao auth.users
-- via user_id. Assim esse cliente já pode receber orçamentos/pedidos (sales),
-- contatos (customer_contacts), equipamentos, faturas, etc. — todos referenciam
-- customers.id.
--
-- Estratégia: trigger AFTER INSERT em auth.users (SECURITY DEFINER) que lê o
-- raw_user_meta_data enviado no signUp. Isso evita problemas de RLS e de
-- confirmação de e-mail (o cliente é criado mesmo antes da sessão existir).
--
-- Aplicar com: supabase db push
-- =====================================================================

-- 1) Colunas de vínculo + dados pessoais do cadastro do portal.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_name     text,
  ADD COLUMN IF NOT EXISTS last_name      text,
  ADD COLUMN IF NOT EXISTS birth_date     date,
  ADD COLUMN IF NOT EXISTS phone_landline text,
  ADD COLUMN IF NOT EXISTS origin         text NOT NULL DEFAULT 'manual';

-- Um cliente do portal por usuário (NULLs múltiplos são permitidos p/ clientes do CRM).
CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_key ON public.customers (user_id);

-- 2) RLS: o cliente do portal lê e edita o PRÓPRIO registro (a equipe já tem
--    acesso total via políticas staff_* existentes — estas são aditivas).
DROP POLICY IF EXISTS "customer_reads_own" ON public.customers;
DROP POLICY IF EXISTS "customer_updates_own" ON public.customers;

CREATE POLICY "customer_reads_own" ON public.customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "customer_updates_own" ON public.customers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3) Trigger de criação do cliente a partir do cadastro do portal.
CREATE OR REPLACE FUNCTION public.handle_new_portal_customer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta  jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  bdate date;
BEGIN
  -- Só trata cadastros do portal (que enviam cpf_cnpj). Convites de equipe não têm.
  IF coalesce(meta->>'cpf_cnpj', '') <> '' THEN
    BEGIN
      -- data_nascimento chega como "DD/MM/AAAA"; converte com segurança.
      BEGIN
        bdate := to_date(meta->>'data_nascimento', 'DD/MM/YYYY');
      EXCEPTION WHEN others THEN
        bdate := NULL;
      END;

      INSERT INTO public.customers (
        user_id, name, first_name, last_name, cnpj_cpf, email,
        phone, phone_landline, birth_date, origin
      ) VALUES (
        NEW.id,
        coalesce(nullif(trim(meta->>'full_name'), ''), NEW.email),
        meta->>'nome',
        meta->>'sobrenome',
        meta->>'cpf_cnpj',
        NEW.email,
        nullif(meta->>'celular', ''),
        nullif(meta->>'telefone_fixo', ''),
        bdate,
        'portal'
      )
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN others THEN
      -- Nunca bloquear a criação da conta por falha aqui.
      RAISE WARNING 'handle_new_portal_customer falhou para %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_portal ON auth.users;
CREATE TRIGGER on_auth_user_created_portal
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_portal_customer();
