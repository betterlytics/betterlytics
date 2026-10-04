const fs = require("fs");
const path = require("path");

const SOURCE = "https://raw.githubusercontent.com/ipverse/as-metadata/master/as.json";
const TARGET = path.join(__dirname, "..", "backend", "src", "bot_detection", "hosting_asns.txt");

// CDN / consumer-relay egress networks that carry large real-user populations
// (iCloud Private Relay exits via Cloudflare/Akamai/Fastly, Google One VPN via
// Google): flagging these would tag ordinary visitors on every event.
const RELAY_EGRESS_ASNS = new Set([
  714, // Apple
  13335, // Cloudflare
  15169, // Google
  20940, // Akamai
  36183, // Akamai
  54113, // Fastly
]);

async function main() {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Failed to fetch AS metadata: ${res.status}`);
  const entries = await res.json();

  const hosting = entries
    .filter((e) => e.metadata?.category === "hosting" && Number.isInteger(e.asn) && e.asn > 0)
    .map((e) => e.asn)
    .filter((asn) => !RELAY_EGRESS_ASNS.has(asn))
    .sort((a, b) => a - b);

  if (hosting.length < 5000) throw new Error(`Hosting ASN list suspiciously small: ${hosting.length}`);

  const header = [
    "# ASNs categorized as hosting/datacenter providers, vendored from a community-maintained dataset.",
    "# Excludes CDN/consumer-relay egress networks (see RELAY_EGRESS_ASNS in the update script).",
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
