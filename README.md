# Bawat Pieza Energy

Bawat Pieza is a Next.js storefront prototype for a modular kinetic-energy
floor tile and compatible piezoelectric, dynamo, and power-management
components.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The storefront calls the repository-level backend through
`NEXT_PUBLIC_API_URL`, which defaults to [http://localhost:4000](http://localhost:4000)
for local development. Start that service from the repository root with
`npm run dev` inside `backend`.

## Storefront features

- Searchable product catalog with PHP pricing and sample stock counts.
- Product detail pages with technical specifications.
- Stock-limited cart with browser-local persistence.
- Supabase Auth sign-in/sign-up and authenticated order and checkout pages.
- Unified backend API for authenticated account and order requests.
- Checkout with cash on delivery or GCash through PayMongo Hosted Checkout,
  order history, and a sample order-status timeline.

## Prototype limitations

PayMongo Hosted Checkout requires `PAYMONGO_SECRET_KEY` in the backend and a
PayMongo webhook configured to `POST /api/v1/webhooks/paymongo`. Apply the
store payment migration before enabling GCash. Supabase Auth validates
credentials; the `user_accounts` table supplies account/profile information
and must contain an active row for each customer. Cart contents remain local
UI state; orders are persisted by the unified backend and are available across
devices. Fulfillment and courier integrations are not included.

Supabase configuration belongs only in `backend/.env` locally. The ecommerce
Next.js app still needs the public `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` values for Supabase Auth session handling, plus
`NEXT_PUBLIC_API_URL` for the unified backend. These public values are safe to
expose in browser code; never expose or commit `SUPABASE_SERVICE_ROLE_KEY`.

Technical output and stock figures are sample prototype data. Energy output
varies with installation, load, and step force; peak figures are not guaranteed
continuous power ratings.
