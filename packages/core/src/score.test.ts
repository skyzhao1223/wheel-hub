import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "./score.js";
import type { RepoData } from "./types.js";

const NOW = new Date().toISOString();

function fixture(overrides: Partial<RepoData> = {}): RepoData {
  return {
    fullName: "acme/widget",
    description: "A widget",
    url: "https://github.com/acme/widget",
    stars: 10_000,
    forks: 500,
    openIssues: 100,
    createdAt: "2023-01-01T00:00:00Z",
    pushedAt: NOW,
    archived: false,
    license: "MIT",
    language: "TypeScript",
    topics: ["widget"],
    ...overrides,
  };
}

test("healthy popular repo scores adopt", () => {
  const e = evaluate(fixture());
  assert.ok(e.score >= 75, `expected >=75, got ${e.score}`);
  assert.equal(e.verdict, "adopt");
});

test("archived repo is always avoid", () => {
  const e = evaluate(fixture({ archived: true }));
  assert.equal(e.verdict, "avoid");
});

test("low score repo is avoid", () => {
  const e = evaluate(
    fixture({
      stars: 5,
      createdAt: "2020-01-01T00:00:00Z",
      pushedAt: "2020-02-01T00:00:00Z",
      license: null,
      openIssues: 50,
    }),
  );
  assert.equal(e.verdict, "avoid");
  assert.ok(e.score < 35);
});

test("no license reduces trust and adds a reason", () => {
  const withLicense = evaluate(fixture());
  const withoutLicense = evaluate(fixture({ license: null }));
  assert.ok(withoutLicense.breakdown.trust < withLicense.breakdown.trust);
  assert.ok(withoutLicense.reasons.some((r) => r.includes("license")));
});

test("copyleft license adds obligation warning", () => {
  const e = evaluate(fixture({ license: "GPL-3.0" }));
  assert.ok(e.reasons.some((r) => r.includes("Copyleft")));
});

test("stale repo adds stale reason", () => {
  const e = evaluate(fixture({ pushedAt: "2020-01-01T00:00:00Z" }));
  assert.ok(e.reasons.some((r) => r.includes("Stale")));
});

test("young fast-growing repo adds momentum reason", () => {
  const e = evaluate(
    fixture({
      stars: 20_000,
      createdAt: new Date(Date.now() - 90 * 86_400_000).toISOString(),
    }),
  );
  assert.ok(e.reasons.some((r) => r.includes("momentum")));
});

test("high issue backlog adds backlog reason", () => {
  const e = evaluate(fixture({ openIssues: 5_000 }));
  assert.ok(e.reasons.some((r) => r.includes("backlog")));
});

test("score is monotonic in stars for identical repos", () => {
  const small = evaluate(fixture({ stars: 100 }));
  const large = evaluate(fixture({ stars: 100_000 }));
  assert.ok(large.breakdown.popularity > small.breakdown.popularity);
});

test("all breakdown scores are within 0-100", () => {
  const e = evaluate(fixture({ stars: 999_999, openIssues: 999_999 }));
  for (const v of Object.values(e.breakdown)) {
    assert.ok(v >= 0 && v <= 100, `out of range: ${v}`);
  }
  assert.ok(e.score >= 0 && e.score <= 100);
});
