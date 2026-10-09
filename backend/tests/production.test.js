const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { credentials, foodInput } = require("../utils/validation");
const { createAccounts } = require("../controller/accountController");
const { createAuthLimit } = require("../middleware/authLimit");
function response() {
  return { statusCode: 200, headers: {}, setHeader(k,v) { this.headers[k] = v; }, status(value) { this.statusCode = value; return this; }, json(body) { this.body = body; return this; } };
}
test("credentials normalize email and reject query operators and invalid passwords", () => {
  assert.equal(credentials({ email: " USER@EXAMPLE.COM ", password: "abcdef", name: " User " }, true).email, "user@example.com");
  assert.throws(() => credentials({ email: { $ne: "" }, password: "abc" }), /Email/);
  assert.throws(() => credentials({ email: "a@b.co", password: "abc", name: "User" }, true), /Password/);
  assert.throws(() => credentials({ email: "a@b.co", password: "é".repeat(40) }), /Password/);
});
test("catalog validation rejects negative prices, empty prices and executable image URLs", () => {
  const valid = { name: "Pizza", description: "Fresh pizza", price: 199, image: "https://example.com/pizza.jpg" };
  assert.equal(foodInput(valid).price, 199);
  for (const price of [-1, "", Infinity, {}, null]) assert.throws(() => foodInput({ ...valid, price }));
  assert.throws(() => foodInput({ ...valid, image: "javascript:alert(1)" }));
});
test("signup always creates a regular user with a hashed password", async () => {
  process.env.JWT_SECRET = "production-tests-only-secret";
  let saved;
  const api = createAccounts({ findOne: async () => null, create: async data => { saved = data; return { ...data, _id: "507f1f77bcf86cd799439011" }; } });
  const res = response();
  await api.signup({ body: { name: "User", email: "USER@example.com", password: "secret123", role: "admin" } }, res, error => { throw error; });
  assert.equal(res.statusCode, 201); assert.equal(saved.role, "user"); assert.equal(saved.email, "user@example.com");
  assert.equal(await bcrypt.compare("secret123", saved.password), true);
  assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).role, "user");
});
test("failed login does not disclose whether an account exists", async () => {
  process.env.JWT_SECRET = "production-tests-only-secret";
  for (const user of [null, { password: await bcrypt.hash("different-password", 4) }]) {
    const api = createAccounts({ findOne: async () => user }); const res = response();
    await api.loginUser({ body: { email: "user@example.com", password: "wrong-password" } }, res, error => { throw error; });
    assert.equal(res.statusCode, 401); assert.equal(res.body.message, "Email or password is incorrect.");
  }
});
test("authentication reads current account role rather than stale JWT role", async t => {
  process.env.JWT_SECRET = "production-tests-only-secret";
  const User = require("../models/User");
  t.mock.method(User, "findById", () => ({ select: () => ({ lean: async () => ({ _id: "507f1f77bcf86cd799439011", name: "User", role: "user" }) }) }));
  const token = jwt.sign({ id: "507f1f77bcf86cd799439011", role: "admin" }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } }; let passed = false;
  await require("../middleware/AuthMiddleware")(req, response(), () => { passed = true; });
  assert.equal(passed, true); assert.equal(req.user.role, "user");
  const rejected = response(); require("../middleware/AdminMiddleware")(req, rejected, () => assert.fail("Non-admin was permitted"));
  assert.equal(rejected.statusCode, 403);
});
test("missing auth secret never falls back to a built-in key", async () => {
  delete process.env.JWT_SECRET;
  const res = response();
  await require("../middleware/AuthMiddleware")({ headers: { authorization: "Bearer invalid" } }, res, () => assert.fail("Unexpected access"));
  assert.equal(res.statusCode, 503);
});
test("repeated auth attempts are limited with a retry time", async () => {
  let key;
  const middleware = createAuthLimit({ findOneAndUpdate: async query => { key = query._id; return { count: 31 }; } });
  const res = response();
  await middleware({ path: "/login", body: { email: "user@example.com" } }, res, () => assert.fail("Limit was bypassed"));
  assert.equal(res.statusCode, 429); assert.ok(Number(res.headers["Retry-After"]) > 0); assert.equal(key.includes("user@example.com"), false);
});
test("readiness fails when MongoDB is disconnected; malformed JSON returns 400 when ready", async () => {
  const app = require("../app");
  const server = await new Promise(resolve => { const value = app.listen(0, "127.0.0.1", () => resolve(value)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const original = Object.getOwnPropertyDescriptor(mongoose.connection, "readyState");
  try {
    assert.equal((await fetch(base + "/healthz")).status, 503);
    assert.equal((await fetch(base + "/api/food")).status, 503);
    Object.defineProperty(mongoose.connection, "readyState", { configurable: true, get: () => 1 });
    assert.equal((await fetch(base + "/healthz")).status, 204);
    const bad = await fetch(base + "/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{invalid" });
    assert.equal(bad.status, 400); assert.equal((await bad.json()).message, "Invalid JSON request.");
  } finally {
    if (original) Object.defineProperty(mongoose.connection, "readyState", original); else delete mongoose.connection.readyState;
    await new Promise(resolve => server.close(resolve));
  }
});
