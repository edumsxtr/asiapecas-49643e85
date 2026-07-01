-- =====================================================================
-- Auditoria de segurança (S2): restringe DELETE a administradores.
--
-- Contexto: as tabelas sensíveis estavam com DELETE liberado a QUALQUER
-- usuário autenticado (TO authenticated USING (true)). Para uma equipe
-- pequena e confiável, mantemos SELECT/INSERT/UPDATE para autenticados,
-- mas restringimos a operação destrutiva (DELETE) a quem tem role 'admin'.
-- Isso evita que uma conta comum (ou comprometida) apague a base inteira.
--
-- Depende da função public.has_role(uuid, app_role) já existente.
-- =====================================================================

-- --- Tabelas com política de DELETE própria: troca para admin-only ---

DROP POLICY IF EXISTS "Authenticated can delete customers" ON public.customers;
CREATE POLICY "Admins delete customers" ON public.customers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete sales" ON public.sales;
CREATE POLICY "Admins delete sales" ON public.sales
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete sale_items" ON public.sale_items;
CREATE POLICY "Admins delete sale_items" ON public.sale_items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete after_sales" ON public.after_sales;
CREATE POLICY "Admins delete after_sales" ON public.after_sales
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete prospects" ON public.prospects;
CREATE POLICY "Admins delete prospects" ON public.prospects
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete market_research" ON public.market_research;
CREATE POLICY "Admins delete market_research" ON public.market_research
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete campaigns" ON public.prospection_campaigns;
CREATE POLICY "Admins delete campaigns" ON public.prospection_campaigns
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete stock_imports" ON public.stock_imports;
CREATE POLICY "Admins delete stock_imports" ON public.stock_imports
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete stock_import_items" ON public.stock_import_items;
CREATE POLICY "Admins delete stock_import_items" ON public.stock_import_items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete ai_compatibility_results" ON public.ai_compatibility_results;
CREATE POLICY "Admins delete ai_compatibility_results" ON public.ai_compatibility_results
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete customer_equipment" ON public.customer_equipment;
CREATE POLICY "Admins delete customer_equipment" ON public.customer_equipment
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete customer_invoices" ON public.customer_invoices;
CREATE POLICY "Admins delete customer_invoices" ON public.customer_invoices
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete customer_imports" ON public.customer_imports;
CREATE POLICY "Admins delete customer_imports" ON public.customer_imports
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- --- Tabelas com política FOR ALL: desmembra em operações específicas ---

DROP POLICY IF EXISTS "auth all customer_contacts" ON public.customer_contacts;
CREATE POLICY "Authenticated read customer_contacts" ON public.customer_contacts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert customer_contacts" ON public.customer_contacts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update customer_contacts" ON public.customer_contacts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins delete customer_contacts" ON public.customer_contacts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "auth all payment_condition_templates" ON public.payment_condition_templates;
CREATE POLICY "Authenticated read payment_condition_templates" ON public.payment_condition_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert payment_condition_templates" ON public.payment_condition_templates
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update payment_condition_templates" ON public.payment_condition_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins delete payment_condition_templates" ON public.payment_condition_templates
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
