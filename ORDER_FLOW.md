# Ordering flow

Visitors can browse the menu and keep a guest cart across refreshes. Place Order requests login only when needed. Login and signup merge the guest cart with the account cart and return to checkout. Logout returns to the menu.

Checkout requires a delivery address and phone. Geolocation is optional. The server calculates prices from the product catalog, adds the existing 5% tax, and saves one order per checkout reference. Customers can use cash on delivery or Razorpay. A saved online order remains available in My Orders if payment is interrupted; Refresh payment status recovers captured payments from Razorpay. Retries reuse the same provider order. Never pay again until checking the status of a previous charge.

Receipts use saved order items and totals and download as paginated PDFs. Cash-on-delivery receipts show payment due until the admin confirms delivery and cash collection. Only the owner or an authenticated admin can access order details.

Admin Dashboard now contains Manage orders. Advance Pending → Preparing → Out for Delivery → Delivered. During delivery, enter the actual driver's coordinates, or share the current device's position only if that device is travelling with the order. Customers receive updates every 10 seconds. No location or progress is fabricated; missing and stale coordinates are labelled.

## Deployment and checks

- Deploy both `backend` on Render and `client` on Vercel from the same commit.
- Render requires `URI` and `JWT_SECRET`. Online payments also require `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; enable automatic capture in the Razorpay dashboard. The public key is returned by the backend when opening checkout.
- Keep the frontend origin in the backend allowlist or `CORS_ORIGINS` (comma-separated). `VITE_API_URL` points to the Render backend.
- Run `npm test` in backend and client; run `npm run lint` and `npm run build` in client. Payment tests mock Razorpay and do not charge money or write production orders.
- Browser acceptance: browse logged out, add an item, refresh, place order, sign in or sign up, confirm cart survived, place a COD order, open/download its receipt, advance its status as admin, and verify customer progress/location. Use Razorpay test mode to check online payment, cancelled checkout, and captured-payment recovery before accepting real payments.

An admin must supply real progress/location updates. This app does not automatically assign a delivery driver or issue payment refunds.
