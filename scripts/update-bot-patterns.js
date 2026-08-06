const fs = require("fs");
const path = require("path");

const SOURCE = "https://raw.githubusercontent.com/omrilotan/isbot/main/src/patterns.json";
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
