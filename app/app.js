/* Sunset Platinum — offline tracker for the 55 GTA VI trophies.
   No build step, no network: it loads data/trophies.json from its own
   folder and keeps progress in localStorage. Hash routes: #/trophy/<id>,
   #/route, #/risky, #/list. ?seed=demo loads a sample run of 13 earned
   trophies; ?spoiler=1 switches spoiler mode on; ?filter=<kind> picks a
   starting filter; ?noscroll=1 keeps the guide pane from scrolling. */
'use strict';

const STORE_KEY = 'sunset-platinum-v1';
const DATA_PATH = 'data/trophies.json';
const DEMO_SET = [2, 3, 5, 8, 15, 16, 21, 22, 28, 35, 42, 52, 53];

const KINDS = [
  ['all', 'All'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectible', 'Collectibles'],
  ['activity', 'Activities'],
  ['side', 'Side quests'],
  ['crime', 'Crime'],
  ['money', 'Money'],
  ['exploration', 'Exploration'],
  ['misc', 'Secrets & misc'],
  ['completion', '100%'],
  ['platinum', 'Platinum'],
];

/* The five stages of the run, in play order. Hour figures are rough,
   drawn from the cited guides: the full set runs to about 200 hours. */
const STAGES = [
  {
    name: 'Stage 1 — The story',
    time: 'Roughly 50 hours',
    note: 'Chapters 1 to 4, then the finale, played straight through. Meditate once at Jason\u2019s house in Chapter 1 — Positive Mental Attitude is the run\u2019s only missable — and save separately at every chapter start, because there is no mission replay.',
    ids: [2, 3, 28, 4, 8, 9, 10, 5, 11, 12, 6, 13, 7],
  },
  {
    name: 'Stage 2 — Strangers & Bret',
    time: 'Roughly 15 hours',
    note: 'Stranger strands open across the map as the story moves on. Finish any 8 of them for the silver, and run Bret\u2019s hunting strand to the end — his quests sit on the 100% checklist too.',
    ids: [22, 23, 24, 26, 27, 25, 29],
  },
  {
    name: 'Stage 3 — The 100% checklist',
    time: 'Roughly 100 hours',
    note: 'Once the finale is done, the checklist appears under Progress, then Stats, then 100% Completion. It is forgiving — nearer 60% true completion — but robberies, underwater finds, shooting ranges, drone races and Bret\u2019s quests have to be finished in full, and 70 of the 80 challenges are enough.',
    ids: [14, 17, 18, 32, 40],
  },
  {
    name: 'Stage 4 — Collectibles, stunts and races',
    time: 'Roughly 25 hours',
    note: 'Cards, WAiNK scans and vehicle finds while you explore; stunts and races in free-roam. These all feed 100% too, so they are part of the road, not a detour.',
    ids: [15, 16, 19, 20, 21, 30, 31, 35, 42, 46],
  },
  {
    name: 'Stage 5 — Money, crime and secrets',
    time: 'Roughly 20 hours',
    note: 'Launder Marked Bills, spend and buy, rob the vaults and the gangs, lose the heat with your partner, and sweep up the secret trophies whose triggers the published guides have not settled yet. The platinum pops with the last one.',
    ids: [33, 34, 36, 37, 38, 39, 41, 43, 44, 45, 47, 48, 49, 50, 51, 52, 53, 54, 55, 1],
  },
];

let allTrophies = [];
const byId = {};
let saved = readSaved();
let activeKind = 'all';
let query = '';
let keepStill = false;

function el(id) { return document.getElementById(id); }

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readSaved() {
  const fresh = { earned: {}, spoiler: false, earnedOnly: false };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fresh;
    if (parsed.earned && typeof parsed.earned === 'object') fresh.earned = parsed.earned;
    if (typeof parsed.spoiler === 'boolean') fresh.spoiler = parsed.spoiler;
    if (typeof parsed.earnedOnly === 'boolean') fresh.earnedOnly = parsed.earnedOnly;
  } catch (err) { /* a broken save starts over */ }
  return fresh;
}

function writeSaved() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (err) { /* storage full or blocked */ }
}

const earned = (t) => !!saved.earned[t.id];

function concealed(t) {
  return saved.spoiler && !earned(t) && (t.category === 'story' || t.hidden);
}

function medalLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function targetText(t) {
  if (!t.target) return '';
  const shown = t.target >= 1000 ? '$' + t.target.toLocaleString('en-US') : String(t.target);
  return 'Target: ' + shown;
}

function kindMatches(t) {
  if (activeKind === 'missable') return !!t.missable;
  if (activeKind === 'all') return true;
  return t.category === activeKind;
}

function queryMatches(t) {
  if (!query) return true;
  const hay = (t.name + ' ' + t.desc + ' ' + t.guide + ' ' + t.phase).toLowerCase();
  return hay.indexOf(query) !== -1;
}

function shownTrophies() {
  return allTrophies.filter((t) => {
    if (!kindMatches(t)) return false;
    if (!queryMatches(t)) return false;
    if (saved.earnedOnly && !earned(t)) return false;
    return true;
  });
}

function suggestNext() {
  const order = [28, 2, 3, 4, 5, 6, 7, 22, 25, 29, 15, 30, 31];
  for (const id of order) {
    const t = byId[id];
    if (t && !earned(t)) return t.name;
  }
  const rest = allTrophies.find((t) => !earned(t));
  return rest ? rest.name : '';
}

function drawProgress() {
  const got = allTrophies.filter(earned).length;
  el('earnedTotal').textContent = String(got);
  el('meterFill').style.width = (got / allTrophies.length * 100) + '%';
  el('statHint').textContent =
    got === 0 ? 'Tick a trophy to start your run.' :
    got === allTrophies.length ? 'Platinum! Every trophy in Leonida is yours.' :
    (allTrophies.length - got) + ' to go — next up: ' + suggestNext();
  const counts = {};
  allTrophies.forEach((t) => {
    if (earned(t)) counts[t.grade] = (counts[t.grade] || 0) + 1;
  });
  el('statGrades').textContent =
    ['platinum', 'gold', 'silver', 'bronze'].map((g) => (counts[g] || 0) + ' ' + g).join(' · ');
}

function drawChips() {
  const row = el('chipRow');
  row.innerHTML = '';
  KINDS.forEach(([key, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip' + (activeKind === key ? ' active' : '');
    button.textContent = label;
    button.setAttribute('aria-pressed', activeKind === key ? 'true' : 'false');
    button.addEventListener('click', () => {
      activeKind = key;
      drawChips();
      drawRows();
    });
    row.appendChild(button);
  });
}

function makeRow(t) {
  const li = document.createElement('li');
  li.className = 'trow m-' + t.grade + (earned(t) ? ' done' : '');
  li.dataset.trophyId = String(t.id);

  const tick = document.createElement('input');
  tick.type = 'checkbox';
  tick.checked = earned(t);
  tick.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
  tick.addEventListener('click', (ev) => {
    ev.stopPropagation();
    setEarned(t.id, tick.checked);
  });
  li.appendChild(tick);

  const middle = document.createElement('div');
  if (concealed(t)) {
    middle.innerHTML = '<div class="tname concealed">Hidden trophy — earn it to reveal</div>' +
      '<div class="tdesc">A story trophy. Its name and description stay hidden while spoiler mode is on.</div>';
  } else {
    let tags = '<span class="tag">' + esc(t.phase) + '</span>';
    if (t.missable) tags += '<span class="tag warn">Missable</span>';
    if (t.hidden) tags += '<span class="tag hidden-t">Hidden on PSN</span>';
    if (t.target) tags += '<span class="tag">' + esc(targetText(t)) + '</span>';
    middle.innerHTML = '<div class="tname">' + esc(t.name) + '</div>' +
      '<div class="tdesc">' + esc(t.desc) + '</div>' +
      '<div class="ttags">' + tags + '</div>';
  }
  li.appendChild(middle);

  const medal = document.createElement('div');
  medal.className = 'tmedal';
  medal.innerHTML = '<span class="medal-dot"></span><span class="medal-word">' + medalLabel(t.grade) + '</span>';
  li.appendChild(medal);

  li.addEventListener('click', () => showGuide(t.id));
  return li;
}

function drawRows() {
  const list = el('trophyRows');
  const shown = shownTrophies();
  list.innerHTML = '';
  shown.forEach((t) => list.appendChild(makeRow(t)));
  el('showingLine').textContent = shown.length === allTrophies.length
    ? 'Showing all 55 trophies.'
    : 'Showing ' + shown.length + ' of 55 trophies.';
}

function drawStages() {
  const box = el('stageList');
  box.innerHTML = '';
  STAGES.forEach((stage) => {
    const li = document.createElement('li');
    li.className = 'stage';
    const links = stage.ids.map((id) => {
      const t = byId[id];
      if (!t) return '';
      return '<li><a href="#/trophy/' + id + '" class="' + (earned(t) ? 'done' : '') + '">' +
        esc(t.name) + '</a></li>';
    }).join('');
    li.innerHTML = '<h3>' + esc(stage.name) + '</h3>' +
      '<p class="stage-time">' + esc(stage.time) + '</p>' +
      '<p>' + esc(stage.note) + '</p>' +
      '<ul class="stage-trophies">' + links + '</ul>';
    box.appendChild(li);
  });
}

function drawRisky() {
  const box = el('riskyList');
  box.innerHTML = '';
  allTrophies.filter((t) => t.missable).forEach((t) => {
    const card = document.createElement('div');
    card.className = 'stage';
    card.innerHTML = '<h3>' + esc(t.name) + ' <span class="tag warn">Potentially missable</span></h3>' +
      '<p class="official" style="border-left:3px solid var(--coral);padding-left:12px;color:var(--soft);font-style:italic;">' +
      esc(t.desc) + '</p>' +
      '<p>' + esc(t.guide) + '</p>' +
      '<p><a href="#/trophy/' + t.id + '">Open the full guide</a></p>';
    box.appendChild(card);
  });
}

function sourceItems(t) {
  return (t.sources || []).map((s) => {
    if (s.url) return '<li><a href="' + esc(s.url) + '" rel="noopener">' + esc(s.label) + '</a></li>';
    return '<li>' + esc(s.note) + '</li>';
  }).join('');
}

function showGuide(id) {
  const t = byId[id];
  const pane = el('guidePane');
  if (!t) { pane.hidden = true; pane.innerHTML = ''; return; }
  const flag = t.missable
    ? '<div class="warn-box"><strong>Potentially missable.</strong> Do the first meditation during Chapter 1 — see the guide below — and keep a chapter-start save.</div>'
    : '';
  pane.innerHTML =
    '<button class="close-pane" type="button" id="closePane">Close</button>' +
    '<h2>' + esc(t.name) + '</h2>' +
    '<p class="meta-line">' + medalLabel(t.grade) + ' · ' + esc(t.phase) +
    (t.target ? ' · ' + esc(targetText(t)) : '') +
    (t.hidden ? ' · Hidden on PSN' : '') + ' · ' + (earned(t) ? 'Earned' : 'Not earned yet') + '</p>' +
    '<p class="official">Official description: &ldquo;' + esc(t.desc) + '&rdquo;</p>' +
    flag +
    '<p class="guide-text">' + esc(t.guide) + '</p>' +
    '<h3>Sources</h3><ul class="src">' + sourceItems(t) + '</ul>';
  pane.hidden = false;
  el('closePane').addEventListener('click', () => {
    pane.hidden = true;
    pane.innerHTML = '';
    if (location.hash.indexOf('/trophy/') !== -1) history.replaceState(null, '', '#/list');
  });
  if (!keepStill) pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setEarned(id, on) {
  if (on) saved.earned[id] = true; else delete saved.earned[id];
  writeSaved();
  drawProgress();
  drawRows();
  drawStages();
}

function showPage(name) {
  ['list', 'route', 'risky'].forEach((page) => {
    el('page-' + page).hidden = (page !== name);
  });
  document.querySelectorAll('.tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === name);
  });
}

function handleRoute() {
  const hash = location.hash || '#/list';
  const match = hash.match(/^#\/trophy\/(\d+)$/);
  if (match) { showPage('list'); showGuide(Number(match[1])); return; }
  if (hash === '#/route') { showPage('route'); return; }
  if (hash === '#/risky') { showPage('risky'); return; }
  showPage('list');
}

function exportRun() {
  const payload = {
    app: 'sunset-platinum',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: Object.keys(saved.earned).map(Number).sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'gta6-trophy-progress.json';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => { URL.revokeObjectURL(anchor.href); anchor.remove(); }, 500);
}

function importRun(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      const next = {};
      ids.forEach((id) => {
        if (byId[Number(id)]) next[Number(id)] = true;
      });
      saved.earned = next;
      writeSaved();
      drawProgress(); drawRows(); drawStages();
    } catch (err) {
      alert('That file is not a Sunset Platinum progress export.');
    }
  };
  reader.readAsText(file);
}

function readQuery() {
  const params = new URLSearchParams(location.search);
  if (params.get('seed') === 'demo' && Object.keys(saved.earned).length === 0) {
    DEMO_SET.forEach((id) => { saved.earned[id] = true; });
    writeSaved();
  }
  if (params.get('spoiler') === '1') {
    saved.spoiler = true;
    writeSaved();
  }
  const kind = params.get('filter');
  if (kind && KINDS.some(([key]) => key === kind)) activeKind = kind;
  if (params.get('noscroll') === '1') keepStill = true;
}

function boot() {
  readQuery();
  fetch(DATA_PATH).then((r) => r.json()).then((data) => {
    allTrophies = data.trophies;
    allTrophies.forEach((t) => { byId[t.id] = t; });
    el('spoilerBox').checked = saved.spoiler;
    el('earnedBox').checked = saved.earnedOnly;
    drawChips();
    drawProgress();
    drawRows();
    drawStages();
    drawRisky();
    handleRoute();
  }).catch(() => {
    el('trophyRows').innerHTML = '<li>Could not load data/trophies.json. Serve app/ over HTTP or open index.html from the app folder.</li>';
  });

  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => { location.hash = '#/' + button.dataset.page; });
  });
  el('searchBox').addEventListener('input', (ev) => {
    query = ev.target.value.trim().toLowerCase();
    drawRows();
  });
  el('spoilerBox').addEventListener('change', (ev) => {
    saved.spoiler = ev.target.checked;
    writeSaved();
    drawRows();
  });
  el('earnedBox').addEventListener('change', (ev) => {
    saved.earnedOnly = ev.target.checked;
    writeSaved();
    drawRows();
  });
  el('exportButton').addEventListener('click', exportRun);
  el('importButton').addEventListener('click', () => el('importPicker').click());
  el('importPicker').addEventListener('change', (ev) => {
    if (ev.target.files.length) importRun(ev.target.files[0]);
    ev.target.value = '';
  });
  el('resetButton').addEventListener('click', () => {
    if (confirm('Clear all earned trophies and settings?')) {
      saved = { earned: {}, spoiler: false, earnedOnly: false };
      writeSaved();
      el('spoilerBox').checked = false;
      el('earnedBox').checked = false;
      drawProgress(); drawRows(); drawStages();
    }
  });
  window.addEventListener('hashchange', handleRoute);
}

document.addEventListener('DOMContentLoaded', boot);
