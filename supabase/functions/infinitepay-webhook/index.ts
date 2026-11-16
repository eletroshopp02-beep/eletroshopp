import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ success: false, message: "Método não permitido" }, 405);

  try {
    const body = await req.json();
    const orderNsu = String(body?.order_nsu ?? "").trim();
    const transactionNsu = String(body?.transaction_nsu ?? "").trim();
    const invoiceSlug = String(body?.invoice_slug ?? body?.slug ?? "").trim();

    // InfinitePay Checkout webhooks are not signed. Confirm every event server-to-server.
    if (!orderNsu || !transactionNsu || !invoiceSlug) {
      return json({ success: false, message: "Identificadores do pagamento incompletos" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const handle = Deno.env.get("INFINITEPAY_HANDLE") ?? "hely_da_cruz_paula";
    if (!url || !service || !handle) {
      return json({ success: false, message: "Configuração interna ausente" }, 500);
    }

    const db = createClient(url, service, { auth: { persistSession: false } });
    const { data: order, error: findError } = await db
      .from("orders")
      .select("id,grand_total,payment_status")
      .eq("id", orderNsu)
      .maybeSingle();

    if (findError) return json({ success: false, message: "Erro ao consultar pedido" }, 500);
    if (!order) return json({ success: false, message: "Pedido não encontrado" }, 404);
    if (order.payment_status === "pago") return json({ success: true, already_processed: true });

    const expectedAmount = Math.round(Number(order.grand_total) * 100);
    if (!Number.isSafeInteger(expectedAmount) || expectedAmount <= 0) {
      return json({ success: false, message: "Valor do pedido inválido" }, 400);
    }

    const check = await fetch("https://api.checkout.infinitepay.io/payment_check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, order_nsu: orderNsu, transaction_nsu: transactionNsu, slug: invoiceSlug }),
    });
    const verified = await check.json().catch(() => ({}));
    if (!check.ok || verified?.success !== true || verified?.paid !== true) {
      return json({ success: false, message: "Pagamento ainda não confirmado pela InfinitePay" }, 400);
    }
    if (Number(verified.amount) !== expectedAmount) {
      return json({ success: false, message: "Valor confirmado não corresponde ao pedido" }, 400);
    }

    const { error: updateError } = await db.from("orders").update({
      payment_status: "pago",
      payment_transaction_nsu: transactionNsu,
      payment_invoice_slug: invoiceSlug,
      payment_receipt_url: String(body?.receipt_url ?? "").startsWith("https://") ? String(body.receipt_url) : null,
      payment_method: String(verified.capture_method ?? body?.capture_method ?? "").slice(0, 40) || null,
    }).eq("id", orderNsu);

    if (updateError) return json({ success: false, message: "Não foi possível atualizar o pedido" }, 500);
    return json({ success: true });
  } catch (error) {
    console.error("infinitepay-webhook error", error);
    return json({ success: false, message: "Payload inválido" }, 400);
  }
});
