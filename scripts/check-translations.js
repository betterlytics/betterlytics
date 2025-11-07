#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function flatten(object, prefix = "", out = []) {
  if (object && typeof object === "object" && !Array.isArray(object)) {
    for (const key of Object.keys(object)) {
      const next = prefix ? `${prefix}.${key}` : key;
      const value = object[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        flatten(value, next, out);
      } else {
        out.push(next);
      }
    }
  }
  return out;
}

function main() {
  const repoRoot = process.cwd();
  const messagesDir = path.join(repoRoot, "dashboard", "messages");
  const baseFile = path.join(messagesDir, "en.json");

  if (!fs.existsSync(messagesDir)) {
    console.error("Messages directory not found:", messagesDir);
    process.exit(1);
  }

  if (!fs.existsSync(baseFile)) {
    console.error("Base translation file not found:", baseFile);
    process.exit(1);
  }

  const base = JSON.parse(fs.readFileSync(baseFile, "utf8"));
  const baseKeys = flatten(base);
  const baseSet = new Set(baseKeys);
  const baseLines = fs.readFileSync(baseFile, "utf8").split(/\r?\n/).length;

  const files = fs
    .readdirSync(messagesDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  console.log(`Base en.json: ${baseKeys.length} keys, ${baseLines} lines`);

  const summary = [];
  let hasMissing = false;
  for (const file of files) {
    if (file === "en.json") continue;
    const fullPath = path.join(messagesDir, file);
    let json;
    try {
      json = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    } catch (e) {
      console.error(`\n${file} could not be parsed as JSON: ${e.message}`);
      hasMissing = true;
      continue;
    }
    const localeKeys = flatten(json);
    const localeSet = new Set(localeKeys);
    const missing = baseKeys.filter((k) => !localeSet.has(k));
    const extra = localeKeys.filter((k) => !baseSet.has(k));
    const lineCount = fs.readFileSync(fullPath, "utf8").split(/\r?\n/).length;

    summary.push({
      file,
      lines: lineCount,
      keys: localeKeys.length,
      missing: missing.length,
      extra: extra.length,
    });
    if (missing.length > 0) {
      hasMissing = true;
      console.error(`\n${file} is missing ${missing.length} key(s):`);
      for (const k of missing) console.error(`  - ${k}`);
    }
    if (extra.length > 0) {
      console.log(`\n${file} has ${extra.length} extra key(s) not in en.json:`);
      for (const k of extra) console.log(`  + ${k}`);
    }
  }

  if (summary.length > 0) {
    console.log("\nLocale summary (excluding en.json):");
    console.log("File\tLines\tKeys\tMissing\tExtra");
    for (const row of summary) {
      console.log(
        `${row.file}\t${row.lines}\t${row.keys}\t${row.missing}\t${row.extra}`
      );
    }
  }

  if (hasMissing) {
    console.error(
      "\nTranslation keys check failed. Please add the missing keys to the affected files."
    );
    process.exit(1);
  }

  console.log("All translation files contain the required keys from en.json.");
}

main();
