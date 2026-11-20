// Leonida Platinum — the hand-in program for gta6-trophy-guide-01.
// The entry is an offline static web app (Node 22, standard library only):
//   app/index.html        the guide, opens in desktop Chrome with the network off
//   app/data/trophies.json  all 55 official trophies, each with a cited guide
//   screenshots/            four real renders of the app in a browser
// This program gathers app/ and screenshots/ from beside this file into
// /output and writes /output/dossier.json through the vendored make.fun
// library. The library itself stays untouched: the sealed scorer rebuilds
// the dossier from its own copy, and the two must agree byte for byte.
//
// Try the guide with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing — nothing to hand in');
}
const shots = existsSync(join(repoRoot, 'screenshots'))
  ? readdirSync(join(repoRoot, 'screenshots')).filter((n) => !n.startsWith('.'))
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

// The scorer's caps: text_max_bytes shapes the dossier text; the rest refuse
// an entry the sealed scorer would refuse anyway (a screenshot over 256 KiB
// or more than 4 of them; app/ past 993 files and directories or 48 MiB —
// app/ shares /output's own 1000-entry cap with screenshots/ and dossier.json).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
