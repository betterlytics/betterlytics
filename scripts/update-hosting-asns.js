const fs = require("fs");
const path = require("path");

const SOURCE = "https://raw.githubusercontent.com/ipverse/as-metadata/master/as.json";
const TARGET = path.join(__dirname, "..", "backend", "src", "bot_detection", "hosting_asns.txt");

async function main() {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Failed to fetch AS metadata: ${res.status}`);
  const entries = await res.json();

  const hosting = entries
    .filter((e) => e.metadata?.category === "hosting" && Number.isInteger(e.asn) && e.asn > 0)
    .map((e) => e.asn)
    .sort((a, b) => a - b);

  if (hosting.length < 5000) throw new Error(`Hosting ASN list suspiciously small: ${hosting.length}`);

  const header = [
    "# ASNs categorized as hosting/datacenter providers, vendored from a community-maintained dataset.",
    `# Source: ${SOURCE}`,
    `# Generated: ${new Date().toISOString().slice(0, 10)} (${hosting.length} ASNs)`,
    "# Regenerate with: node scripts/update-hosting-asns.js",
  ];

  fs.writeFileSync(TARGET, header.join("\n") + "\n" + hosting.join("\n") + "\n");
  console.log(`Wrote ${hosting.length} hosting ASNs to ${TARGET}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
