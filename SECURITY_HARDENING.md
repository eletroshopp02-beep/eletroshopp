# Security hardening — deployment checklist

This branch contains security changes. The InfinitePay webhook and payment-verification functions have been deployed to the live Supabase project. The admin endpoint and website files have not been deployed or merged into `main`.

## Required Supabase secrets

Before deploying the new `admin-orders` function:

1. Generate a new random secret with at least 32 characters (preferably 40+), using a password manager.
2. In Supabase Project Settings → Edge Functions → Secrets, set `ELETRO_ADMIN_PIN` to that new value.
3. Do not reuse the old six-digit PIN. It was present in public client code and must be treated as compromised.
4. Keep the value private; never commit it to GitHub or put it in HTML/JavaScript.

The admin login pages now ask for this server-managed secret and no longer contain a PIN value or compare against a hardcoded PIN.

## InfinitePay

The Checkout webhook does not provide a cryptographic signature. The replacement `infinitepay-webhook` therefore does not trust the callback body: it requires `order_nsu`, `transaction_nsu`, and `invoice_slug`/ `slug`, then calls InfinitePay's `/payment_check` endpoint server-to-server. It only marks the order as paid when InfinitePay returns `success: true`, `paid: true`, and the original amount matches the order total.

Set `INFINITEPAY_HANDLE` to the store's InfinitePay handle in Supabase secrets. The code has the existing public handle as a fallback, but setting the secret explicitly is recommended.

The new `infinitepay-verify-payment` function performs the same verification when the customer returns to `pagamento-concluido.html`. The page no longer displays a green success state merely because a URL parameter says Pix or card.

## Deploy order

Deployment status:

- `infinitepay-webhook`: deployed, version 3, JWT verification disabled as required for the provider callback.
- `infinitepay-verify-payment`: deployed, version 1, JWT verification disabled; payment status is independently checked server-to-server.
- `admin-orders`: deployed, version 13. It fails closed with `ADMIN_NOT_CONFIGURED` until a new `ELETRO_ADMIN_PIN` secret (32+ characters) is set. This temporarily suspends admin API access to prevent unauthorized order reads/changes.

After setting the secret, the deployed `admin-orders` function will accept the new secret. Then publish the website files in this branch so the admin screens use the new login flow:

- `admin-orders` — custom header authentication; keep JWT verification disabled for this function because it authenticates with the server-only secret in `x-admin-pin`.


Do not deploy `admin-orders` before the new 32+ character secret is configured; it intentionally returns `ADMIN_NOT_CONFIGURED` otherwise.

## Remaining work not covered by this patch

- Order creation still accepts client-supplied item prices, freight, and totals. This needs a trusted product/price source and a schema check before safely changing the calculation.
- Freight quoting still has client-side fallback dimensions/values and needs validation against the actual product catalog.
- Database RLS/table grants could not be audited because the database connection was unavailable during the audit.
- Accounting data is still stored in browser localStorage.
- Run end-to-end payment tests in a controlled test flow before treating checkout as fully verified.
