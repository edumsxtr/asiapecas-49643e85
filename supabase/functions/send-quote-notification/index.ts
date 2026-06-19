// Sends a new quote request to the sales team.
// Uses Resend HTTP API (requires RESEND_API_KEY secret).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface QuoteItem { material: string; description?: string; quantity: number }
interface Payload {
  customer: {
    name: string; email: string; phone: string; document: string;
    document_type?: string; legal_name?: string; trade_name?: string;
    address?: any; segment?: string; interest_models?: string[] | string;
  };
  items: QuoteItem[];
  notes?: string;
  quote_id?: string;
}

const SALES_TO = 'vendas@asiapecas.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    if (!body?.customer?.email || !Array.isArray(body.items)) {
      return new Response(JSON.stringify({ error: 'invalid_payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_KEY) {
      console.warn('[send-quote-notification] RESEND_API_KEY not configured, skipping send');
      return new Response(JSON.stringify({ ok: true, skipped: 'no_email_provider' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const c = body.customer;
    const addr = c.address || {};
    const itemsRows = body.items.map(i =>
      `<tr><td style="padding:6px 10px;border:1px solid #e5e5e5;font-family:monospace">${i.material}</td>` +
      `<td style="padding:6px 10px;border:1px solid #e5e5e5">${i.description || '-'}</td>` +
      `<td style="padding:6px 10px;border:1px solid #e5e5e5;text-align:right">${i.quantity}</td></tr>`
    ).join('');

    const html = `
      <div style="font-family:Arial,sans-serif;color:#111;max-width:680px;margin:0 auto;padding:24px">
        <div style="background:#000;color:#FFD600;padding:16px 20px;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:18px">Nova cotação recebida — Ásia Peças</h1>
          ${body.quote_id ? `<p style="margin:4px 0 0;font-size:12px;color:#fff7c2">ID: ${body.quote_id}</p>` : ''}
        </div>
        <div style="border:1px solid #e5e5e5;border-top:0;padding:20px;border-radius:0 0 8px 8px">
          <h2 style="font-size:14px;margin:0 0 8px;color:#000">Cliente</h2>
          <p style="margin:2px 0;font-size:13px"><b>${c.name}</b> &lt;${c.email}&gt; · ${c.phone}</p>
          <p style="margin:2px 0;font-size:13px">${c.document_type || 'Doc'}: ${c.document}</p>
          ${c.legal_name ? `<p style="margin:2px 0;font-size:13px">Razão social: ${c.legal_name}</p>` : ''}
          ${c.trade_name ? `<p style="margin:2px 0;font-size:13px">Fantasia: ${c.trade_name}</p>` : ''}
          ${c.segment ? `<p style="margin:2px 0;font-size:13px">Segmento: ${c.segment}</p>` : ''}
          ${addr.street ? `<p style="margin:8px 0 2px;font-size:13px">${addr.street}, ${addr.number || ''} ${addr.complement || ''} — ${addr.district || ''}<br>${addr.city || ''}/${addr.state || ''} — CEP ${addr.zip || ''} — ${addr.country || ''}</p>` : ''}

          <h2 style="font-size:14px;margin:18px 0 8px;color:#000">Itens (${body.items.length})</h2>
          <table style="border-collapse:collapse;width:100%;font-size:12px">
            <thead><tr style="background:#000;color:#FFD600">
              <th style="padding:6px 10px;border:1px solid #000;text-align:left">Código</th>
              <th style="padding:6px 10px;border:1px solid #000;text-align:left">Descrição</th>
              <th style="padding:6px 10px;border:1px solid #000;text-align:right">Qtd</th>
            </tr></thead>
            <tbody>${itemsRows}</tbody>
          </table>

          ${body.notes ? `<h2 style="font-size:14px;margin:18px 0 8px;color:#000">Observações</h2><p style="font-size:13px;white-space:pre-wrap">${body.notes}</p>` : ''}
        </div>
      </div>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Ásia Peças <onboarding@resend.dev>',
        to: [SALES_TO],
        reply_to: c.email,
        subject: `Nova cotação — ${c.name}${c.trade_name ? ' / ' + c.trade_name : ''} (${body.items.length} itens)`,
        html,
      }),
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('[send-quote-notification] resend error', r.status, json);
      return new Response(JSON.stringify({ ok: false, error: json }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true, id: json?.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[send-quote-notification] error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
