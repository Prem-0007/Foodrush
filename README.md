# FoodRush

Node, Express, MongoDB and Stripe Checkout. The server prices every order from the database, reserves stock atomically, sends the customer to a Stripe-hosted payment page, and marks the order paid only when Stripe's signed webhook says so.

## Run it locally

1. Create a free MongoDB Atlas cluster (or run MongoDB locally) and copy the connection string.
2. In the Stripe dashboard, switch to **Test mode** and copy the secret key (`sk_test_...`).
3. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then run `stripe login`.
4. Set up the project:
   ```
   npm install
   cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET, STRIPE_SECRET_KEY
   npm run seed              # menu items; set ADMIN_EMAIL and ADMIN_PASSWORD first to get an admin
   ```
5. In a second terminal run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. It prints a `whsec_...` value. Put it in `.env` as `STRIPE_WEBHOOK_SECRET`.
6. `npm run dev` and open http://localhost:3000.
7. Register, add food, pay with test card `4242 4242 4242 4242`, any future expiry, any CVC. The page returns to FoodRush and the order turns **paid** when the webhook arrives.

Useful test cards: `4000 0000 0000 9995` (declined), `4000 0025 0000 3155` (asks for 3D Secure).

## Deploy on Render

- New Web Service from your repo. Build command `npm install`, start command `npm start`.
- Health check path: `/readyz`.
- Environment variables: everything in `.env.example`. Set `PUBLIC_URL` to your Render URL.
- In Atlas, Network Access, allow Render's outbound addresses (or `0.0.0.0/0` while testing, with a strong database password).
- In Stripe, Developers, Webhooks, add `https://YOUR-APP.onrender.com/api/webhooks/stripe` with these events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
- Switch to live keys only after a full test-mode run. Your Stripe account must have INR enabled.

## Where each lab concept lives

| Concept | File |
| --- | --- |
| Idempotency (own key and Stripe's) | `src/routes/checkout.js`, `src/services/orders.js`, `Order` unique index |
| Atomic stock, no overselling | `reserveStock` in `src/services/orders.js` |
| Saga and compensating actions | `releaseOrderStock`, used on Stripe failure, expiry and cancel |
| Webhook signature and duplicate events | `src/routes/webhook.js`, `WebhookEvent` model |
| Optimistic locking | `optimisticConcurrency` on `Order`, `PATCH /api/orders/:id/status` |
| Data validation | zod schemas with `.strict()`, `src/middleware/validate.js` |
| JWT, pinned algorithm, short expiry | `src/middleware/auth.js` |
| Rate limiting | `src/app.js`, `auth.js`, `checkout.js` |
| Indexes, lean queries, connection pool | models, `src/routes/menu.js`, `server.js` |
| Health, liveness and readiness | `src/routes/health.js` |
| Structured logs and request ids | `src/app.js` |
| Security headers and CSP | `src/app.js` (helmet) |
| Secrets from environment | `src/config.js` |
| Graceful shutdown | `server.js` |

## Systems Lab at /lab

The lab from the design page is built into the app at **http://localhost:3000/lab/**. Every card is a simulation that runs in the browser. Eight cards also have a **Run it on your real server** section that runs the same idea against your real database.

To turn the real sections on:
1. Add `LAB_ENABLED=true` to `.env` (on Render, add it as an environment variable) and restart.
2. Open `/lab/`, find the **Connected mode** box, and sign in with your admin account.
3. Open a card and expand **Run it on your real server**.

| Card | What runs on your server |
| --- | --- |
| Token-bucket rate limiter | A real limiter returns 200 or 429 with a `Retry-After` header |
| Idempotency keys | Two simultaneous taps race for a unique index in MongoDB |
| Data validation | Your text is checked by the same zod schema as `POST /api/checkout` |
| Locking | Two real concurrent buyers, one portion: none, pessimistic, optimistic or atomic |
| N+1 queries | A loop, a `$in` batch and a `$lookup` timed against your database |
| Indexing | MongoDB's own `explain("executionStats")` with each index forced |
| Caching | A real cache-aside on the menu query, with measured hit and miss times |
| Health checks | Calls your real `/healthz` and `/readyz` |

The Connected mode box also shows live parameters: database state and ping, connection pool size, Stripe test or live mode, whether the webhook secret is set, and your rate limits.

Safety: the lab API is off unless `LAB_ENABLED=true`, needs an admin token, writes only to scratch collections (`labcharges`, `labstocks`, `labrestaurants`, `laborders`), and never touches real orders or menu. The first N+1 or indexing run creates 20,000 scratch orders, which takes a few seconds. Turn `LAB_ENABLED` back to `false` when you do not need it.

## Tests

`npm test` runs 17 checks that need no database or network: validation, auth, forged webhooks, probes, headers, the lab rate limiter and the lab page.

## Known limits

- Stock and order creation are not one transaction, so the code undoes earlier steps on failure. An abandoned checkout releases stock when Stripe sends `checkout.session.expired` (30 minutes).
- A payment that arrives for an already expired order is logged for a manual refund, not refunded automatically.
- Refunds, delivery tracking and an admin screen are not built. Admin status changes use `PATCH /api/orders/:id/status`.
- The login token lives in `localStorage`. For higher security, move it to an `HttpOnly`, `SameSite` cookie with a CSRF token.
