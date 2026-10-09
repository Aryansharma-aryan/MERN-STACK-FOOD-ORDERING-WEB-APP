import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../api/proxy.js";

function response() {
  return { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, send(body) { this.body = body; return this; }, end() { return this; } };
}
test("proxy forwards order JSON and bearer auth without forwarding browser Origin or cookies", async t => {
  let sent;
  t.mock.method(globalThis, "fetch", async (url, options) => { sent = { url, options }; return new Response('{"order":{"id":"test"}}', { status: 201, headers: { "content-type": "application/json" } }); });
  const res = response();
  await handler({ method: "POST", query: { path: "orders" }, headers: { authorization: "Bearer test", origin: "https://new-preview.vercel.app", cookie: "private=value" }, body: { items: [] } }, res);
  assert.equal(sent.url, "https://mern-stack-food-ordering-web-app-4sg8.onrender.com/api/orders");
  assert.equal(sent.options.headers.Authorization, "Bearer test");
  assert.equal(sent.options.headers.origin, undefined);
  assert.equal(sent.options.headers.cookie, undefined);
  assert.equal(sent.options.body, '{"items":[]}');
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers["Cache-Control"], "no-store");
});
test("proxy preserves upstream auth failures and rejects invalid paths", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response('{"message":"Login required"}', { status: 401 }));
  const res = response();
  await handler({ method: "GET", query: { path: "orders/user-id" }, headers: {} }, res);
  assert.equal(res.statusCode, 401);
  for (const path of ["../admin", "https://other.example", "food?url=other", ""]) {
    const invalid = response(); await handler({ method: "GET", query: { path }, headers: {} }, invalid); assert.equal(invalid.statusCode, 400);
  }
});
test("proxy reports unavailable backend clearly", async t => {
  t.mock.method(globalThis, "fetch", async () => { throw new Error("unavailable"); });
  const res = response();
  await handler({ method: "GET", query: { path: "food" }, headers: {} }, res);
  assert.equal(res.statusCode, 502);
  assert.match(res.body.message, /temporarily unavailable/);
});
