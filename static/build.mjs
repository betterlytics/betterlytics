// Minifies analytics.js, replay.js, heatmap.js and capture.js, and bakes content hashes of the
// minified scripts that analytics.js and capture.js load into them as their cache-busters.
// usage: node build.mjs <srcDir> <outDir>
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const [srcDir = '.', outDir = '.'] = process.argv.slice(2);

function esbuild(...args) {
  execFileSync('npx', ['--yes', 'esbuild@0.28.1', ...args], { stdio: 'inherit' });
}

function minifyAndHash(name, ...defines) {
  const out = path.join(outDir, `${name}.min.js`);
  esbuild(path.join(srcDir, `${name}.js`), '--minify', ...defines, `--outfile=${out}`);
  return createHash('sha256').update(readFileSync(out)).digest('hex').slice(0, 8);
}

const replayHash = minifyAndHash('replay');
const heatmapHash = minifyAndHash('heatmap');
const captureHash = minifyAndHash('capture', `--define:__BL_REPLAY_HASH__="${replayHash}"`);

esbuild(
  path.join(srcDir, 'analytics.js'),
  '--minify',
  `--define:__BL_REPLAY_HASH__="${replayHash}"`,
  `--define:__BL_HEATMAP_HASH__="${heatmapHash}"`,
  `--define:__BL_CAPTURE_HASH__="${captureHash}"`,
  `--outfile=${path.join(outDir, 'analytics.min.js')}`,
);

console.log(`replay.js hash: ${replayHash}`);
console.log(`heatmap.js hash: ${heatmapHash}`);
console.log(`capture.js hash: ${captureHash}`);
