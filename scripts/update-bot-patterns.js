const fs = require("fs");
const path = require("path");

const SOURCE = "https://raw.githubusercontent.com/omrilotan/isbot/main/src/patterns.json";
const BROWSER_FIXTURES = "https://raw.githubusercontent.com/omrilotan/isbot/main/fixtures/browsers.yml";
const TARGET = path.join(__dirname, "..", "backend", "src", "bot_detection", "bot_patterns.txt");

async function main() {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Failed to fetch patterns: ${res.status}`);
  const patterns = await res.json();

  const invalid = patterns.filter((p) => typeof p !== "string" || p.includes("\n") || p.startsWith("#"));
  if (invalid.length > 0) throw new Error(`Unsupported patterns: ${JSON.stringify(invalid)}`);

  // Rust's regex parser rejects a bare '-' following a class escape inside [...];
  // escaping the hyphen is semantics-preserving in both JS and Rust
  const rustSafe = patterns.map((p) => p.replace(/\\([wdsWDS])-/g, "\\$1\\-"));

  // Guard against upstream regressions: no pattern may match a real browser UA
  // from upstream's human-browser fixture corpus
  const fixturesRes = await fetch(BROWSER_FIXTURES);
  if (!fixturesRes.ok) throw new Error(`Failed to fetch browser fixtures: ${fixturesRes.status}`);
  const humanUas = (await fixturesRes.text())
    .split("\n")
    .filter((line) => line.startsWith("  - "))
    .map((line) => line.slice(4).trim())
    .filter(Boolean);
  if (humanUas.length < 100) throw new Error(`Browser fixture corpus suspiciously small: ${humanUas.length}`);

  const combined = new RegExp(rustSafe.join("|"), "i");
  const falsePositives = humanUas.filter((ua) => combined.test(ua));
  if (falsePositives.length > 0) {
    throw new Error(
      `Refusing to write: ${falsePositives.length} human browser UAs match the pattern list:\n` +
        falsePositives.slice(0, 10).join("\n"),
    );
  }
  console.log(`Verified 0 false positives against ${humanUas.length} human browser UAs`);

  const header = [
    "# Bot user-agent regex patterns, vendored from omrilotan/isbot (Unlicense).",
    `# Source: ${SOURCE}`,
    `# Generated: ${new Date().toISOString().slice(0, 10)} (${patterns.length} patterns)`,
    "# Regenerate with: node scripts/update-bot-patterns.js",
  ];

  fs.writeFileSync(TARGET, header.join("\n") + "\n" + rustSafe.join("\n") + "\n");
  console.log(`Wrote ${rustSafe.length} patterns to ${TARGET}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
