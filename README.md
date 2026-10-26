# FoodRush

A food delivery app built with Node, Express, MongoDB and Stripe Checkout, plus an interactive Systems Lab that explains the engineering behind it.

How an order works:

1. The customer signs in and builds a basket. The browser sends only item codes and quantities.
2. The server looks up every price in MongoDB, reserves stock with an atomic update, and creates the order as `pending_payment`.
3. The server creates a Stripe Checkout session and sends the customer to Stripe's hosted payment page.
4. Stripe calls the webhook. The order becomes `paid` only after the signature is verified and the amount matches.
5. If the customer abandons the payment, the order expires after 30 minutes and the stock is released.

## Contents

1. [What is in the project](#what-is-in-the-project)
2. [Requirements](#requirements)
3. [Run it locally](#run-it-locally)
4. [Environment variables](#environment-variables)
5. [Test a payment](#test-a-payment)
6. [Admin: move an order along](#admin-move-an-order-along)
7. [Systems Lab at /lab](#systems-lab-at-lab)
8. [Deploy on Render](#deploy-on-render)
9. [Going live with real payments](#going-live-with-real-payments)
10. [Troubleshooting](#troubleshooting)
11. [Where each concept lives](#where-each-concept-lives)
12. [Tests](#tests)
13. [Security notes](#security-notes)
14. [Known limits](#known-limits)

## What is in the project

```
foodrush-app/
  server.js                 Starts the server, connects to MongoDB, handles shutdown
  src/
    app.js                  Middleware, security headers, routes
    config.js               Reads and checks environment variables
    stripe.js               Stripe client
    seed.js                 Creates the menu and an optional admin account
    models/                 User, MenuItem, Order, WebhookEvent, Lab (scratch data)
    routes/                 auth, menu, checkout, orders, webhook, health, lab
    services/orders.js      Pricing, stock reservation, Stripe session, compensation
    middleware/             auth (JWT), validate (zod), errors
  public/
    index.html, app.js      The shop page
    lab/                    The Systems Lab (simulations, plus real-server panels)
  test/                     Tests that need no database or network
  .env.example              Template for your settings
```

## Requirements

- **Node.js 18 or newer.** Check with `node -v`.
- **Git**, for deploying.
- A free **MongoDB Atlas** account, or MongoDB running on your computer.
- Your **own Stripe account**, in Test mode. See the warning below.
- The **Stripe CLI** for testing webhooks on your computer. You can skip it if you test only on the deployed site.

> **Use your own Stripe account.** Some platforms (freelance and payout platforms, for example) create an *Express* connected account for you. It looks like a dashboard at `connect.stripe.com/app/express` showing "Recent earnings". That account cannot create API keys or take payments. Create a standalone account at https://dashboard.stripe.com/register instead. Test mode works without activating the account.

## Run it locally

### 1. Database (Atlas)

1. Create a free **M0** cluster at https://www.mongodb.com/atlas.
2. **Database Access:** add a user with a password made of letters and digits only.
3. **Network Access:** add your current IP address.
4. **Connect → Drivers:** copy the connection string and add the database name `foodrush` before the `?`:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/foodrush?retryWrites=true&w=majority
```

> Always include `/foodrush`. Without a database name, MongoDB uses a database called `test`, which may already hold other projects' data and can cause index errors such as `E11000 duplicate key error ... user_1_idempotencyKey_1`.

### 2. Stripe key

In your own Stripe account, switch on **Test mode**, open **Developers → API keys**, and copy the **Secret key** (`sk_test_...`). Do not use the publishable key (`pk_test_...`) and do not use a `sk_live_...` key while testing.

### 3. Install and configure

Open the project folder in VS Code (**File → Open Folder**, choosing the folder that directly contains `package.json`). Open the terminal with **Ctrl+`** and run:

```
npm install
```

Create your settings file.

- macOS or Linux: `cp .env.example .env`
- Windows PowerShell or cmd: `copy .env.example .env`

Generate a secret for login tokens and copy the output:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Open `.env` and fill it in. See [Environment variables](#environment-variables). Use no quotes and no spaces around `=`.

### 4. Load the menu and admin

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then run:

```
npm run seed
```

It prints `Menu ready (6 items)` and `Admin account ready`. Running it again is safe: it never resets stock or overwrites existing accounts.

The admin is created only if that email does not already exist. If you registered on the site first with the same email, it stays a normal customer. Use another email, or delete that user in Atlas and seed again.

### 5. Forward Stripe webhooks to your computer

Stripe cannot reach `localhost`, so the Stripe CLI forwards events to it. Keep this running in its own terminal. In VS Code, open a second terminal with the **+** button.

**Install the CLI**

- macOS: `brew install stripe/stripe-cli/stripe`
- Windows: download `stripe_X.X.X_windows_x86_64.zip` from https://github.com/stripe/stripe-cli/releases/latest, extract it, and keep the folder somewhere permanent. If Windows SmartScreen blocks `stripe.exe`, right-click the file, choose **Properties**, tick **Unblock**, and click **OK**. Only do this for a file you downloaded from that GitHub page.

`stripe.exe` is a command-line tool. Double-clicking it does nothing. Run it from the terminal.

**Start forwarding.** This version needs no `stripe login`, because it uses your test key directly. The CLI requires the `--events` list.

macOS, Linux, or Windows once `stripe` is on your PATH:

```
stripe listen --api-key sk_test_YOUR_KEY --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to localhost:3000/api/webhooks/stripe
```

Windows PowerShell with a full path. Note the `&` at the start, which PowerShell requires for a quoted path:

```
& "C:\Path\To\stripe.exe" listen --api-key sk_test_YOUR_KEY --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to localhost:3000/api/webhooks/stripe
```

Replace `sk_test_YOUR_KEY` with your real key, on one line, and keep the commas without spaces. The command prints:

```
Ready! Your webhook signing secret is whsec_...
```

Copy that value into `STRIPE_WEBHOOK_SECRET` in `.env`.

### 6. Start the app

In the first terminal:

```
npm run dev
```

It restarts when you save a file. You should see `FoodRush listening on 3000`. Open http://localhost:3000. If you change `.env`, stop it with **Ctrl+C** and start it again.

## Environment variables

| Name | Required | Meaning |
| --- | --- | --- |
| `MONGODB_URI` | yes | Atlas or local connection string. Include `/foodrush` |
| `JWT_SECRET` | yes | Long random string that signs login tokens |
| `STRIPE_SECRET_KEY` | yes | `sk_test_...` while testing |
| `STRIPE_WEBHOOK_SECRET` | yes | `whsec_...` from `stripe listen` locally, or from the dashboard endpoint when deployed |
| `PUBLIC_URL` | yes on a server | Where the site is reachable. Used for Stripe return links. Default `http://localhost:3000` |
| `PORT` | no | Default 3000. Render sets this itself |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for `npm run seed` | Creates the admin account |
| `LAB_ENABLED` | no | `true` switches on the real-server panels in the lab. Default off |

The app refuses to start if a required value is missing, and tells you which one.

## Test a payment

1. Open http://localhost:3000, click **Create an account**, and register with an 8-character or longer password.
2. Add a Chicken Dum Biryani, enter an address such as `12-4-7 Beach Road, Visakhapatnam`, and click **Pay with Stripe**.
3. On Stripe's page enter card `4242 4242 4242 4242`, any future expiry, and any CVC.
4. You return to FoodRush. It shows "Confirming your payment…" and then "Payment received". The order shows as **paid** and the stock drops.

| Test card | Result |
| --- | --- |
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 9995` | Declined |
| `4000 0025 0000 3155` | Asks for 3D Secure |

Also try:

- **Abandon:** start a payment and close the Stripe tab. After 30 minutes the order turns `expired` and the stock returns.
- **Double tap:** click **Pay with Stripe** twice quickly. You get one order and one Stripe page.

## Admin: move an order along

Log in as the admin and call the API. The allowed order is `paid → preparing → out_for_delivery → delivered`, and `paid → cancelled` releases the stock.

PowerShell:

```
$r = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType 'application/json' -Body '{"email":"you@example.com","password":"YOUR_ADMIN_PASSWORD"}'
Invoke-RestMethod -Method Patch -Uri http://localhost:3000/api/orders/ORDER_ID/status -ContentType 'application/json' -Headers @{Authorization="Bearer $($r.token)"} -Body '{"status":"preparing"}'
```

macOS or Linux:

```
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"you@example.com","password":"YOUR_ADMIN_PASSWORD"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/status -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"status":"preparing"}'
```

Tokens last 1 hour. Anyone who registers through the site is always a customer.

## Systems Lab at /lab

The lab is built into the app at **http://localhost:3000/lab/**. It has 41 interactive simulations that run in the browser and touch nothing. Eight cards also have a **Run it on your real server** section that runs the same idea against your real database.

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

Safety:

- The lab API is off unless `LAB_ENABLED=true`, and it accepts only an admin token.
- It writes only to scratch collections (`labcharges`, `labstocks`, `labrestaurants`, `laborders`) and never touches real orders or menu items.
- The first N+1 or indexing run creates 20,000 scratch orders, which takes a few seconds.
- Keep `LAB_ENABLED=false` in production unless you are using it.

## Deploy on Render

### 1. Prepare

- Generate a **new** `JWT_SECRET` for production. Never reuse one that has appeared in a chat or a screenshot.
- In Atlas **Network Access**, allow `0.0.0.0/0`. Render's outgoing addresses change, so a fixed IP will not work. Your long database password is what protects you.
- Confirm your connection string includes `/foodrush`.

### 2. Put the code on GitHub

Run these in the project folder:

```
git init
git add .
git status
```

Read the list. It must **not** include `.env` or `node_modules`. They are in `.gitignore`, so they should not appear. Then:

```
git commit -m "FoodRush"
git branch -M main
git remote add origin https://github.com/YOURNAME/foodrush.git
git push -u origin main
```

Create the repo on github.com first, as a private repo with no README. VS Code can also do this through **Source Control → Publish Branch**.

### 3. Create the Render service

1. At https://render.com choose **New → Web Service** and pick your repo.
2. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
   - Advanced → **Health Check Path:** `/readyz`
3. Add environment variables:

| Name | Value |
| --- | --- |
| `MONGODB_URI` | your Atlas string with `/foodrush` |
| `JWT_SECRET` | the new secret |
| `STRIPE_SECRET_KEY` | `sk_test_...` from your own account |
| `STRIPE_WEBHOOK_SECRET` | `whsec_temp` for now |
| `PUBLIC_URL` | `https://placeholder.onrender.com` for now |
| `LAB_ENABLED` | `false` |

4. Create the service and wait for the log to say `FoodRush listening on`.
5. Copy your real URL (for example `https://foodrush-ab12.onrender.com`), set `PUBLIC_URL` to it, and save. Render redeploys.

### 4. Connect the Stripe webhook

1. In Stripe (your own account, Test mode) go to **Developers → Webhooks → Add endpoint**.
2. URL: `https://YOUR-APP.onrender.com/api/webhooks/stripe`
3. Events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
4. Save, reveal the **Signing secret** (`whsec_...`), and put it in Render as `STRIPE_WEBHOOK_SECRET`. It is different from the one the Stripe CLI printed. Render redeploys.

Until this step is done, payments succeed on Stripe but orders stay `pending_payment`.

### 5. Check it works

1. Open your Render URL. The first load can take about 50 seconds on the free plan.
2. Open `/readyz`. It should show `{"status":"ready"}`.
3. Register, order and pay with `4242 4242 4242 4242`. The order should turn **paid**.
4. In Stripe, **Webhooks → your endpoint** should show the event delivered with `200`.
5. Also test the declined card.

The menu and admin are already in the database if your local `.env` and Render use the same `MONGODB_URI`. Otherwise run `npm run seed` once from your computer with `MONGODB_URI` pointing at the same database.

### 6. Update later

```
git add .
git commit -m "describe the change"
git push
```

Render redeploys by itself.

## Going live with real payments

Do this only after a complete test-mode run on the deployed site, including the declined card and an abandoned payment.

1. Complete Stripe account activation. Your account must support INR.
2. Switch the Stripe dashboard to **Live mode** and copy the live secret key.
3. Create a **new** webhook endpoint in Live mode with the same four events. It has its own signing secret.
4. In Render, update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` with the live values.
5. Consider a paid Render instance so the service does not sleep.
6. Keep `LAB_ENABLED=false`.

The Connected mode box in the lab shows whether the server is in `test` or `live` mode.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `Missing required environment variable ...` | A value is missing from `.env` or Render. Add it. |
| `E11000 duplicate key ... user_1_idempotencyKey_1` | The connection string has no database name and the app is using the shared `test` database. Add `/foodrush`, then run `npm run seed`. Do not delete the other data. |
| Cannot connect to the database | Atlas **Network Access** does not include your IP (or `0.0.0.0/0` on Render), or the password has special characters. |
| `EADDRINUSE` | Port 3000 is already in use. Stop the other server or change `PORT`. |
| `'scoop' is not recognized` | Scoop is not installed. Download the Stripe CLI zip instead. |
| SmartScreen blocks `stripe.exe` | Right-click the file, **Properties**, tick **Unblock**. Only for a file from the official GitHub releases page. |
| `Unexpected token` when running `stripe.exe` | You are in PowerShell. Put `&` before the quoted path. |
| `must specify events to forward using --events` | Add the `--events` list shown above. |
| `Invalid API Key provided: sk_test_***_KEY` | You left the placeholder in the command. Use your real secret key. |
| Stripe shows an Express or "Recent earnings" dashboard | That is a payout account, not yours. Create your own at dashboard.stripe.com/register. |
| Paid on Stripe but the order stays `pending_payment` | The webhook did not arrive. Locally, check `stripe listen` is running and `STRIPE_WEBHOOK_SECRET` is its latest value, then restart the app. On Render, check the endpoint URL and its signing secret. |
| Webhook returns 400 | Wrong signing secret, or the key and secret come from different Stripe accounts or modes. |
| `Not enough stock` after many tests | The seed never resets stock. Edit `stock` in Atlas. |
| Stripe rejects the currency | Your account's country does not allow INR. Change `currency` in `src/config.js`. |
| Admin login fails | The admin email was already registered as a customer. See step 4 of [Run it locally](#run-it-locally). |
| Lab shows no "Run it on your real server" sections | `LAB_ENABLED` is not `true`, you have not signed in as admin, or the page was opened as a plain file. |
| First page load is slow on Render | The free instance was asleep. |
| Stray "Name" label on the sign-in form | Add `[hidden]{display:none!important}` to the end of `public/style.css`. |

## Where each concept lives

| Concept | File |
| --- | --- |
| Idempotency (own key and Stripe's) | `src/routes/checkout.js`, `src/services/orders.js`, `Order` unique index |
| Atomic stock, no overselling | `reserveStock` in `src/services/orders.js` |
| Saga and compensating actions | `releaseOrderStock`, used on Stripe failure, expiry and cancel |
| Webhook signature and duplicate events | `src/routes/webhook.js`, `WebhookEvent` model |
| Optimistic locking | `optimisticConcurrency` on `Order`, `PATCH /api/orders/:id/status` |
| Data validation | zod schemas with `.strict()`, `src/middleware/validate.js` |
| JWT, pinned algorithm, short expiry | `src/middleware/auth.js` |
| Rate limiting | `src/app.js`, `src/routes/auth.js`, `src/routes/checkout.js` |
| Indexes, lean queries, connection pool | models, `src/routes/menu.js`, `server.js` |
| Health, liveness and readiness | `src/routes/health.js` |
| Structured logs and request ids | `src/app.js` |
| Security headers and CSP | `src/app.js` (helmet) |
| Secrets from environment | `src/config.js` |
| Graceful shutdown | `server.js` |
| Real-server lab endpoints | `src/routes/lab.js`, `src/models/Lab.js` |

## Tests

```
npm test
```

Runs 17 checks that need no database or network: validation, auth (including forged and expired tokens and `alg: none`), forged and tampered webhooks, health probes, security headers, the lab rate limiter, the lab validation endpoint, and the lab page.

These paths are **not** covered by automated tests because they need MongoDB and Stripe: stock reservation, order creation, the webhook's order updates, and the database-backed lab panels. Test them with a real payment in Stripe's test mode before relying on them.

## Security notes

- Never commit `.env`. Keep it listed in `.gitignore`.
- Never paste real keys, secrets or passwords into chats, screenshots or issues. If you do, rotate them: **Roll key** in Stripe, a new `JWT_SECRET`, a new database password.
- Prices come only from the database. Requests that include extra fields, such as `total` or `isAdmin`, are rejected.
- Login tokens last 1 hour, and the server accepts only the HS256 algorithm.
- Webhook bodies are verified with Stripe's signature before anything changes.
- The page's Content Security Policy blocks inline scripts. Server data is inserted with `textContent`, never as HTML.
- The login token lives in `localStorage`. For higher security, move it to an `HttpOnly`, `SameSite` cookie with a CSRF token.

## Known limits

- Stock and order creation are not one database transaction, so the code undoes earlier steps on failure. An abandoned checkout releases stock when Stripe sends `checkout.session.expired` (30 minutes).
- A payment that arrives for an already expired order is logged for a manual refund, not refunded automatically.
- Refunds, delivery tracking and an admin screen are not built. Admin status changes use `PATCH /api/orders/:id/status`.
- The free Render plan sleeps after inactivity.
