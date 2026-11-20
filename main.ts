// Sunset Platinum — the hand-in program for gta6-trophy-guide-01.
//
// The entry is a static web app (Node 22, standard library only). This
// program gathers what the grader needs from beside this file into the
// output directory and writes the dossier with the vendored make.fun
// library, which is left exactly as shipped: the sealed scorer rebuilds
// the dossier from its own copy, and the two copies must match byte for
// byte.
//
//   app/index.html          the guide; runs in desktop Chrome, network off
//   app/data/trophies.json  all 55 official trophies, each with a guide
//   screenshots/            four real renders of the app in a browser
//
// Local try: `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  throw new Error(message);
}

function listShots(): string[] {
  const dir = join(here, 'screenshots');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => !name.startsWith('.'));
}

if (!existsSync(join(here, 'app', 'index.html'))) {
  fail('app/index.html is missing — there is nothing to hand in');
}

const shots = listShots();
if (shots.length < 3 || shots.length > 4) {
  fail(`expected 3 or 4 screenshots, found ${shots.length}`);
}

mkdirSync(destination, { recursive: true });
cpSync(join(here, 'app'), join(destination, 'app'), { recursive: true });
cpSync(join(here, 'screenshots'), join(destination, 'screenshots'), { recursive: true });

// These caps mirror the sealed scorer's own limits, so an entry this
// program accepts is one the scorer accepts too: the dossier text cap,
// at most 4 screenshots of at most 256 KiB each, and app/ kept inside
// 993 files and directories / 48 MiB (app/ shares /output's own
// 1000-entry cap with screenshots/ and dossier.json).
writeFileSync(
  join(destination, 'dossier.json'),
  buildDossier(destination, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
