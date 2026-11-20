# Sunset Platinum — a GTA VI trophy guide & tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/axgzero/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/axgzero/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A static, offline web app for the 55 PlayStation 5 trophies of Grand Theft
Auto VI. It lists every trophy with its official name, description and
grade, lets you tick off the ones you have earned (progress lives in the
browser, with export and import), filters the list by kind, hides story
trophies while spoiler mode is on, lays out a five-step route to the
platinum, calls out the one trophy that can be missed, and gives every
trophy a short guide in this project's own words, with its sources named
beside it. No network, no account, nothing leaves the machine.

## Try it

```sh
node serve.ts
# then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# out/ then holds app/, screenshots/ and dossier.json
```

## What is in here

- `app/index.html` — the page
- `app/app.js` — the tracker: progress, filters, search, spoiler mode,
  export/import, the roadmap and missables views, hash routes
- `app/style.css` — the paper-and-sunset look
- `app/data/trophies.json` — the 55 official trophies, each with a guide
  and its sources
- `screenshots/` — four real browser renders of the app
- `main.ts` — copies `app/` and `screenshots/` into `/output` and writes
  `/output/dossier.json`
- `serve.ts` — a small static server for local tries
- `vendor/makefun-frontend.ts` — the make.fun dossier library, as shipped

---

<sub>Entered on [make.fun](https://make.fun/?ref=cefc1nk2&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
