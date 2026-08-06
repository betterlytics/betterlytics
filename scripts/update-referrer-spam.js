const fs = require("fs");
const path = require("path");

const SOURCE = "https://raw.githubusercontent.com/matomo-org/referrer-spam-list/master/spammers.txt";
const TARGET = path.join(__dirname, "..", "backend", "src", "bot_detection", "referrer_spam.txt");

async function main() {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Failed to fetch spammer list: ${res.status}`);
  const body = await res.text();

  const domains = body
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line !== "" && !line.startsWith("#"));

  const header = [
    "# Referrer spam domains, vendored from matomo-org/referrer-spam-list.",
    `# Source: ${SOURCE}`,
    `# Generated: ${new Date().toISOString().slice(0, 10)} (${domains.length} domains)`,
    "# Regenerate with: node scripts/update-referrer-spam.js",
  ];

  fs.writeFileSync(TARGET, header.join("\n") + "\n" + domains.join("\n") + "\n");
  console.log(`Wrote ${domains.length} domains to ${TARGET}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
