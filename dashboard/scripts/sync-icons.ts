import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BROWSERS, type IconAsset } from '../src/constants/browserIcons';
import { OS_ICONS } from '../src/constants/operatingSystemIcons';

type Target = { dir: string; asset: IconAsset };

async function main() {
  const targets = new Map<string, Target>();

  for (const def of Object.values(BROWSERS)) {
    targets.set(`browser-icons/${def.file}`, { dir: 'browser-icons', asset: def });
  }
  for (const def of Object.values(OS_ICONS)) {
    targets.set(`os-icons/${def.icon.file}`, { dir: 'os-icons', asset: def.icon });
    if (def.iconDark) {
      targets.set(`os-icons/${def.iconDark.file}`, { dir: 'os-icons', asset: def.iconDark });
    }
  }

  let failures = 0;

  for (const [rel, { dir, asset }] of targets) {
    if (!asset.source) {
      console.log(`skip      ${rel} (hand-maintained)`);
      continue;
    }

    const url = `https://api.iconify.design/${asset.source}.svg`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`FAILED    ${rel} (${res.status} from ${url})`);
      failures++;
      continue;
    }

    const body = Buffer.from(await res.arrayBuffer());
    const target = path.join('public', dir, asset.file);
    await mkdir(path.dirname(target), { recursive: true });

    const existing = await readFile(target).catch(() => null);
    if (existing?.equals(body)) {
      console.log(`unchanged ${rel}`);
      continue;
    }

    await writeFile(target, body);
    console.log(`wrote     ${rel}`);
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
