import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ADMIN_SECRET = Deno.env.get("ELETRO_ADMIN_PIN") ?? "";
const ALLOWED_ORIGINS = new Set(["https://eletroshopp.com.br", "https://www.eletroshopp.com.br"]);

function cors(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://eletroshopp.com.br",
    "Access-Control-Allow-Headers": "content-type, x-admin-pin",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}
function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors(req) });
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function authorized(req: Request) {
  if (ADMIN_SECRET.length < 32) return false;
  const supplied = req.headers.get("x-admin-pin") ?? "";
  return supplied.length >= 32 && constantTimeEqual(supplied, ADMIN_SECRET);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (!["GET", "POST", "DELETE"].includes(req.method)) return json(req, { ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE || ADMIN_SECRET.length < 32) {
    return json(req, { ok: false, error: "ADMIN_NOT_CONFIGURED" }, 503);
  }
  if (!authorized(req)) return json(req, { ok: false, error: "UNAUTHORIZED" }, 401);

  const headers = {
    apikey: SERVICE_ROLE,
    Authorization: "Bearer " + SERVICE_ROLE,
    "Content-Type": "application/json",
  };

  try {
    if (req.method === "GET") {
      const r = await fetch(
        SUPABASE_URL + "/rest/v1/orders?select=*&order=created_at.desc&limit=200",
        { headers },
      );
      const data = await r.json().catch(() => []);
      return json(req, data, r.status);
    }

    const body = await req.json().catch(() => ({}));
    if (req.method === "POST") {
      const id = String(body.id ?? "").trim();
      const status = String(body.status ?? "").trim();
      const allowed = new Set(["novo", "em_separacao", "enviado", "entregue", "cancelado"]);
      if (!id || !allowed.has(status)) return json(req, { ok: false, error: "INVALID_REQUEST" }, 400);
      const r = await fetch(
        SUPABASE_URL + "/rest/v1/orders?id=eq." + encodeURIComponent(id),
        {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify({ status }),
        },
      );
      if (!r.ok) return json(req, { ok: false, error: "UPDATE_FAILED" }, r.status);
      return json(req, { ok: true });
    }

    const id = String(body.id ?? "").trim();
    if (!id) return json(req, { ok: false, error: "INVALID_REQUEST" }, 400);
    const r = await fetch(
      SUPABASE_URL + "/rest/v1/orders?id=eq." + encodeURIComponent(id),
      { method: "DELETE", headers },
    );
    if (!r.ok) return json(req, { ok: false, error: "DELETE_FAILED" }, r.status);
    return json(req, { ok: true });
  } catch (error) {
    console.error("admin-orders error", error);
    return json(req, { ok: false, error: "INTERNAL_ERROR" }, 500);
  }
});
