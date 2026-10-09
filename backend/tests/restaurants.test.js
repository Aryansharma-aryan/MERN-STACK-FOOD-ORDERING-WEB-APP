const { test } = require("node:test");
const assert = require("node:assert/strict");
const demos = require("../data/demoRestaurants");
test("demo restaurants are explicitly labelled and have unique stable identifiers", () => {
  assert.equal(demos.length, 3);
  assert.equal(new Set(demos.map(item => item.id)).size, 3);
  assert.ok(demos.every(item => item.isDemo && item.id.startsWith("demo-")));
});
