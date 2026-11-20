# Leonida Platinum — GTA VI trophy guide & tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline web app that guides and tracks all 55 PlayStation 5 trophies of Grand Theft Auto VI. It shows the official list with saved progress, filters by kind, a spoiler setting that hides story trophies until earned, export and import of progress, a five-phase roadmap to the platinum, the one potentially missable trophy flagged, and a cited guide for every trophy. It runs from its own files with the network off.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# out/ holds app/, screenshots/ and dossier.json
```

## Files

- `app/index.html` — the guide
- `app/app.js` — tracker logic (progress, filters, spoiler mode, export/import)
- `app/style.css` — the look
- `app/data/trophies.json` — the 55 official trophies with guides and sources
- `screenshots/` — four real renders of the app
- `main.ts` — builds `/output` with `dossier.json`
- `serve.ts` — tiny static server for local tries
- `vendor/makefun-frontend.ts` — the make.fun dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=cefc1nk2&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
