import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://eletroshopp.com.br",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Método não permitido" }, 405);
  try {
    const body = await req.json();
    const orderNsu = String(body?.order_nsu ?? "").trim();
    const transactionNsu = String(body?.transaction_nsu ?? "").trim();
    const slug = String(body?.slug ?? "").trim();
    if (!orderNsu || !transactionNsu || !slug) {
      return json({ ok: false, paid: false, error: "Dados de retorno incompletos" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const handle = Deno.env.get("INFINITEPAY_HANDLE") ?? "hely_da_cruz_paula";
    if (!url || !service) return json({ ok: false, paid: false, error: "Configuração interna ausente" }, 500);

    const db = createClient(url, service, { auth: { persistSession: false } });
    const { data: order, error } = await db.from("orders")
      .select("id,grand_total,payment_status")
      .eq("id", orderNsu)
      .maybeSingle();
    if (error) return json({ ok: false, paid: false, error: "Erro ao consultar pedido" }, 500);
    if (!order) return json({ ok: false, paid: false, error: "Pedido não encontrado" }, 404);
    if (order.payment_status === "pago") return json({ ok: true, paid: true, already_processed: true });

    const expectedAmount = Math.round(Number(order.grand_total) * 100);
    if (!Number.isSafeInteger(expectedAmount) || expectedAmount <= 0) {
      return json({ ok: false, paid: false, error: "Valor do pedido inválido" }, 400);
    }

    const response = await fetch("https://api.checkout.infinitepay.io/payment_check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, order_nsu: orderNsu, transaction_nsu: transactionNsu, slug }),
    });
    const checked = await response.json().catch(() => ({}));
    const paid = response.ok && checked?.success === true && checked?.paid === true &&
      Number(checked.amount) === expectedAmount;
    if (!paid) return json({ ok: true, paid: false, message: "Pagamento ainda não confirmado" });

    const { error: updateError } = await db.from("orders").update({
      payment_status: "pago",
      payment_transaction_nsu: transactionNsu,
      payment_invoice_slug: slug,
      payment_method: String(checked.capture_method ?? "").slice(0, 40) || null,
      payment_receipt_url: String(body?.receipt_url ?? "").startsWith("https://") ? String(body.receipt_url) : null,
    }).eq("id", orderNsu);
    if (updateError) return json({ ok: false, paid: false, error: "Não foi possível atualizar o pedido" }, 500);
    return json({ ok: true, paid: true });
  } catch {
    return json({ ok: false, paid: false, error: "Não foi possível verificar o pagamento" }, 400);
  }
});
