import { test } from "node:test";
import assert from "node:assert/strict";
import { readCart, mergeCarts, hasSession } from "../src/utils/cart.js";
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null };
test("guest cart survives persistence and merges quantities without losing account items", () => {
  storage.set("cart_guest", JSON.stringify([{ _id: "pizza", quantity: 2 }]));
  const merged = mergeCarts([{ _id: "pizza", quantity: 1 }, { _id: "burger", quantity: 1 }], readCart("cart_guest"));
  assert.deepEqual(merged.map(({ _id, quantity }) => [_id, quantity]), [["pizza", 3], ["burger", 1]]);
});
test("invalid stored carts are safe and expired sessions require login at checkout", () => {
  storage.set("cart_guest", "bad json"); assert.deepEqual(readCart("cart_guest"), []);
  storage.set("authToken", `header.${btoa(JSON.stringify({ exp: 1 }))}.signature`); assert.equal(hasSession(), false);
  storage.set("authToken", `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`); assert.equal(hasSession(), true);
});
test("login does not merge different demo restaurants into the same cart", () => {
  const saved = [{ _id: "pizza", quantity: 1, restaurantId: "demo-pizza-house" }];
  const guest = [{ _id: "curry", quantity: 2, restaurantId: "demo-spice-table" }];
  assert.deepEqual(mergeCarts(saved, guest), guest);
});
