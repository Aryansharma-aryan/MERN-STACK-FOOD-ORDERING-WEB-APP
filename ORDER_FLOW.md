# Ordering flow

This deployment is a demo. Razorpay must use `rzp_test_` keys; real-payment keys are refused. Restaurant selection, orders and receipts are labelled demo. No actual restaurant fulfilment or real tax invoice is provided.

The home page offers three fictional restaurants using the shared sample menu. A cart belongs to one demo restaurant. The chosen restaurant is stored with the order and shown on receipts. Restaurant choices are built into the frontend, so browsing them does not depend on an API request. Nearby real-restaurant search is not included.

Visitors can browse the menu and keep a guest cart across refreshes. Place Order requests login only when needed. Login and signup merge the guest cart with the account cart and return to checkout. Logout returns to the menu.

Checkout requires a delivery address and phone. Geolocation is optional. The server calculates prices from the product catalog, adds the existing 5% tax, and saves one order per checkout reference. Customers can use cash on delivery or Razorpay. A saved online order remains available in My Orders if payment is interrupted; Refresh payment status recovers captured payments from Razorpay. Retries reuse the same provider order. Never pay again until checking the status of a previous charge.

Receipts use saved order items and totals and download as paginated PDFs. Cash-on-delivery receipts show payment due until the admin confirms delivery and cash collection. Only the owner or an authenticated admin can access order details.

Admin Dashboard now contains Manage orders. Advance Pending â†’ Preparing â†’ Out for Delivery â†’ Delivered. During delivery, enter the actual driver's coordinates, or share the current device's position only if that device is travelling with the order. Customers receive updates every 10 seconds. No location or progress is fabricated; missing and stale coordinates are labelled.

## Deployment and checks

- Deploy both `backend` on Render and `client` on Vercel from the same commit.
- Render requires `URI` and `JWT_SECRET`. Online payments also require `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; enable automatic capture in the Razorpay dashboard. The public key is returned by the backend when opening checkout.
- Production API requests use the same-origin Vercel function in `client/api/proxy.js`, which forwards only to the fixed Render API. New preview domains do not require CORS allowlist edits. Set the Vercel project root to `client` so its functions and `vercel.json` are deployed. Local development still uses `VITE_API_URL` and the backend's localhost allowlist.
- Run `npm test` in backend and client; run `npm run lint` and `npm run build` in client. Payment tests mock Razorpay and do not charge money or write production orders.
- Browser acceptance: browse logged out, add an item, refresh, place order, sign in or sign up, confirm cart survived, place a COD order, open/download its receipt, advance its status as admin, and verify customer progress/location. Use Razorpay test mode to check online payment, cancelled checkout, and captured-payment recovery before accepting real payments.

An admin must supply real progress/location updates. This app does not automatically assign a delivery driver or issue payment refunds.

## Production reliability

The API listens only after MongoDB connects and the checkout/account indexes are ready. `/healthz` returns 503 when MongoDB is disconnected; `/api/health` reports `apiVersion: 2` and readiness. Configure Render's health-check path as `/healthz`.

Authentication requires `JWT_SECRET` with no fallback. Use a strong random secret. Admin roles are read from the current database account. Signup cannot grant admin access. Auth attempts are limited per normalized email in MongoDB for a 15-minute window; expired records are removed by a TTL index. Public signup no longer creates admin accounts as a side effect; use the existing admin provisioning script separately.

To recover test payments automatically after a browser closes, configure a Razorpay test-mode webhook for `payment.captured` at `https://mern-stack-food-ordering-web-app-4sg8.onrender.com/api/webhooks/razorpay`. Set a separate random `RAZORPAY_WEBHOOK_SECRET` in Render and the Razorpay dashboard. It is not the API key secret. The handler verifies the raw-body HMAC, matches amounts and saved provider order IDs, and handles retries idempotently. Until configured, the checkout callback and My Orders â†’ Refresh payment status remain available.

A legacy payment test script containing a hard-coded credential has been removed. Rotate that exposed Razorpay test key in the dashboard and update Render; removal from the current files does not remove Git history. Never put secrets in Git or in Vite-prefixed environment variables.

Run both app tests, frontend lint/build, and `npm audit` before release. Keep Razorpay in test mode as requested. Real-provider payment interaction and browser geolocation require an interactive acceptance test; mock tests alone do not verify those external services.
