-- =====================================================================
-- Auditoria de segurança — fechar vazamento via signup público de clientes
--
-- Problema: o portal tem cadastro público de clientes (/portal/cadastro).
-- Esses clientes viram usuários "authenticated". Como as tabelas internas
-- estavam com RLS "TO authenticated USING (true)", QUALQUER pessoa podia
-- criar conta e ler toda a base de clientes/vendas/financeiro via API REST.
--
-- Correção: separar EQUIPE de CLIENTES via papéis (user_roles). As tabelas
-- internas passam a exigir is_staff() (ter papel em user_roles). Clientes do
-- portal NÃO têm papel → não acessam dados internos. A equipe (com papéis)
-- continua acessando normalmente. DELETE permanece restrito a admin.
--
-- PRÉ-REQUISITO (confirmado): a equipe interna tem papéis em user_roles.
-- Aplicar com: supabase db push.
-- =====================================================================

-- Função auxiliar: usuário atual faz parte da equipe (tem qualquer papel)?
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
$$;

-- Tabelas internas sensíveis: substitui políticas permissivas por is_staff().
-- O loop remove TODAS as políticas existentes de cada tabela e recria um
-- conjunto limpo e consistente (staff lê/insere/edita; admin deleta).
DO $$
DECLARE
  t text;
  pol record;
  tables text[] := ARRAY[
    'customers','sales','sale_items','after_sales','prospects','market_research',
    'prospection_campaigns','customer_contacts','customer_equipment','customer_invoices',
    'customer_imports','stock_imports','stock_import_items','ai_compatibility_results',
    'payment_condition_templates','salespeople'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "staff_select_%1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.is_staff())', t);
    EXECUTE format('CREATE POLICY "staff_insert_%1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.is_staff())', t);
    EXECUTE format('CREATE POLICY "staff_update_%1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())', t);
    EXECUTE format('CREATE POLICY "admin_delete_%1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))', t);
  END LOOP;
END $$;

-- quote_requests: tratamento especial (cliente do portal lê/insere as PRÓPRIAS;
-- a equipe gerencia todas). Visitante anônimo continua podendo solicitar cotação.
DROP POLICY IF EXISTS "Customers read own quotes" ON public.quote_requests;
DROP POLICY IF EXISTS "Authenticated can read quote_requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Authenticated can update quote_requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Authenticated can delete quote_requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Public can insert quote_requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Anyone can insert quote_requests" ON public.quote_requests;

CREATE POLICY "read own or staff quotes" ON public.quote_requests
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid() OR public.is_staff());
CREATE POLICY "public insert quotes" ON public.quote_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff update quotes" ON public.quote_requests
  FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY "admin delete quotes" ON public.quote_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
