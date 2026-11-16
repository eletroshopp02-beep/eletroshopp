import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED = new Set(["https://eletroshopp.com.br", "https://www.eletroshopp.com.br"]);
function headers(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.has(origin) ? origin : "https://eletroshopp.com.br",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}
function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers(req) });
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(req) });
  if (req.method !== "POST") return json(req, { ok: false, code: "METHOD_NOT_ALLOWED", error: "Método não permitido." }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return json(req, { ok: false, code: "SERVER_NOT_CONFIGURED", error: "Configuração interna incompleta." }, 503);
  try {
    const order = await req.json();
    if (!order || typeof order !== "object" || !Array.isArray(order.items) || !order.items.length) {
      return json(req, { ok: false, code: "INVALID_ORDER", error: "Pedido sem produtos ou inválido." }, 400);
    }
    const db = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.rpc("create_order_secure", { p_order: order });
    if (error) {
      console.error("create-order database error", error.code, error.message);
      if (error.message?.includes("OUT_OF_STOCK")) return json(req, { ok: false, code: "OUT_OF_STOCK", error: "Estoque insuficiente. Atualize o carrinho." }, 409);
      return json(req, { ok: false, code: "ORDER_SAVE_FAILED", error: "Não foi possível registrar o pedido." }, 500);
    }
    const result = data ?? {};
    if (!result.ok) {
      const status = result.code === "PRICE_CHANGED" || result.code === "OUT_OF_STOCK" || result.code === "DUPLICATE_ORDER" ? 409
        : result.code === "PRODUCT_UNAVAILABLE" ? 422 : 400;
      return json(req, result, status);
    }
    return json(req, result, 201);
  } catch (error) {
    console.error("create-order request error", error instanceof Error ? error.message : String(error));
    return json(req, { ok: false, code: "INVALID_REQUEST", error: "Dados do pedido inválidos." }, 400);
  }
});
