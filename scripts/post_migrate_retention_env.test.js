const { test } = require("node:test");
const assert = require("node:assert/strict");

const { resolveEffectiveDays, carriedOverDays } = require("./post_migrate_retention_env");

test("resolveEffectiveDays", () => {
  assert.equal(resolveEffectiveDays(undefined), 365);
  assert.equal(resolveEffectiveDays(""), 365);
  assert.equal(resolveEffectiveDays("-1"), -1);
  assert.equal(resolveEffectiveDays(" -1 "), -1);
  assert.equal(resolveEffectiveDays("400"), 730);
  assert.equal(resolveEffectiveDays("1095"), 1095);
  assert.equal(resolveEffectiveDays("2000"), -1);
  assert.equal(resolveEffectiveDays("90"), 365);
  assert.equal(resolveEffectiveDays("0"), 365);
  assert.equal(resolveEffectiveDays("-5"), 365);
  assert.equal(resolveEffectiveDays("forever"), 365);
  assert.equal(resolveEffectiveDays("1.5"), 365);
});

test("carriedOverDays", () => {
  assert.equal(carriedOverDays(90, 365), 365);
  assert.equal(carriedOverDays(365, 365), 365);
  assert.equal(carriedOverDays(730, 365), 730);
  assert.equal(carriedOverDays(-1, 365), -1);
  assert.equal(carriedOverDays(365, 1095), 1095);
  assert.equal(carriedOverDays(1825, 730), 1825);
  for (const stored of [90, 365, 730, 1825, -1]) {
    assert.equal(carriedOverDays(stored, -1), -1);
  }
});
