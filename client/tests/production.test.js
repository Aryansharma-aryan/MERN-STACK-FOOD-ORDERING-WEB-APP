import { test } from "node:test";
import assert from "node:assert/strict";
import { makeReceiptPdf } from "../src/utils/receipt.js";
import { request } from "../src/utils/orders.js";
test("receipt PDF paginates a large order and reports unpaid COD correctly", () => {
  const pdf = makeReceiptPdf({ _id: "test-order", createdAt: "2026-10-09T10:00:00Z", status: "Pending", paymentMethod: "cod", paymentStatus: "pending", deliveryAddress: "123 Test Street", phone: "9876543210", subtotal: 20000, tax: 1000, totalAmount: 21000,
    items: Array.from({ length: 100 }, (_, i) => ({ name: `Menu item ${i}`, price: 200, quantity: 1 })) });
  assert.ok(pdf.getNumberOfPages() > 1);
  const result = pdf.output();
  assert.ok(result.startsWith("%PDF-"));
  assert.match(result, /Due on delivery/);
  assert.match(result, /Total: INR 21000.00/);
  assert.match(result, /DEMO \/ TEST RECEIPT/);
  assert.match(result, /Restaurant: Food Mania Demo Kitchen/);
});
test("unexpected HTML API responses produce a useful error instead of a JSON exception", async t => {
  globalThis.localStorage = { getItem: () => null };
  t.mock.method(globalThis, "fetch", async () => new Response("<html>Unavailable</html>", { status: 502 }));
  await assert.rejects(request("/food"), /unexpected response/);
});
test("expired session raises a session event and retains the API status", async t => {
  globalThis.localStorage = { getItem: () => "expired-token" };
  let event;
  globalThis.window = { dispatchEvent(value) { event = value.type; } };
  t.mock.method(globalThis, "fetch", async () => new Response('{"message":"Login again"}', { status: 401 }));
  await assert.rejects(request("/orders/user"), error => error.status === 401);
  assert.equal(event, "session-expired");
});
