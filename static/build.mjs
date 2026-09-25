// Minifies analytics.js and replay.js, and bakes a content hash of the minified
// replay.js into analytics.js as its cache-buster.
// usage: node build.mjs <srcDir> <outDir>
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const [srcDir = '.', outDir = '.'] = process.argv.slice(2);

function esbuild(...args) {
  execFileSync('npx', ['--yes', 'esbuild@0.28.1', ...args], { stdio: 'inherit' });
}

const replayOut = path.join(outDir, 'replay.min.js');
esbuild(path.join(srcDir, 'replay.js'), '--minify', `--outfile=${replayOut}`);

const replayHash = createHash('sha256').update(readFileSync(replayOut)).digest('hex').slice(0, 8);

esbuild(
  path.join(srcDir, 'analytics.js'),
  '--minify',
  `--define:__BL_REPLAY_HASH__="${replayHash}"`,
  `--outfile=${path.join(outDir, 'analytics.min.js')}`,
);

console.log(`replay.js hash: ${replayHash}`);
