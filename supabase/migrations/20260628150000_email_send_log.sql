-- =====================================================================
-- Rate-limit de envio de e-mail (send-quote-notification)
-- Tabela usada apenas pela edge function (service_role) para limitar a
-- frequência de envios por IP e evitar abuso/spam do e-mail de vendas.
-- Sem políticas RLS → inacessível via API REST (só service_role).
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  kind text NOT NULL DEFAULT 'quote',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_email_send_log_ip_time
  ON public.email_send_log (ip, created_at DESC);
