/* Leonida Platinum — offline tracker for the 55 GTA VI trophies.
   No build step, no network: it fetches data/trophies.json from its own
   folder and keeps progress in localStorage. Deep links: #/trophy/<id>,
   #/roadmap, #/missables, #/checklist. ?seed=demo loads a demo run of
   13 earned trophies; ?spoiler=1 turns the spoiler setting on. */
'use strict';

var STORE_KEY = 'leonida-platinum-v1';
var DATA_URL = 'data/trophies.json';
var DEMO_EARNED = [2, 3, 4, 5, 8, 15, 16, 20, 21, 35, 42, 52, 53];

var FILTERS = [
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
  ['platinum', 'Platinum']
];

/* The five phases of the run, in play order. Hours are rough, from the
   cited guides: the whole set runs about 200 hours (PowerPyx). */
var ROADMAP = [
  {
    title: 'Phase 1 — Play the story',
    hours: 'About 50 hours',
    blurb: 'Chapters 1 to 4 and the finale, straight through. Do the first meditation at Jason\u2019s house during Chapter 1 — Positive Mental Attitude is the run\u2019s one missable — and keep a separate save at the start of every chapter, because there is no mission replay.',
    ids: [2, 3, 28, 4, 8, 9, 10, 5, 11, 12, 6, 13, 7]
  },
  {
    title: 'Phase 2 — Strangers & Bret',
    hours: 'About 15 hours',
    blurb: 'Stranger mission strands unlock across the map as the story advances. Finish any 8 strands for the silver, and run Bret\u2019s hunting quests in full — his quests are also on the 100% checklist.',
    ids: [22, 23, 24, 26, 27, 25, 29]
  },
  {
    title: 'Phase 3 — The 100% checklist',
    hours: 'About 100 hours',
    blurb: 'After the finale, the checklist appears under Progress, then Stats, then 100% Completion. It is lenient — nearer 60% true completion — but robberies, underwater discoveries, shooting ranges, drone races and Bret\u2019s quests must be finished in full, and 70 of the 80 challenges are enough.',
    ids: [14, 17, 18, 32, 40]
  },
  {
    title: 'Phase 4 — Collectibles, stunts and races',
    hours: 'About 25 hours',
    blurb: 'Cards, WAiNK scans and vehicle discoveries while you explore; stunts and races in free-roam. These all count toward 100% too, so they are not side content — they are the road.',
    ids: [15, 16, 19, 20, 21, 30, 31, 35, 42, 46]
  },
  {
    title: 'Phase 5 — Money, crime and secrets',
    hours: 'About 20 hours',
    blurb: 'Launder Marked Bills, spend and buy, rob the vaults and the gangs, lose the heat with your partner, and mop up the secret trophies whose triggers the published guides have not pinned down yet. The platinum pops with the last one.',
    ids: [33, 34, 36, 37, 38, 39, 41, 43, 44, 45, 47, 48, 49, 50, 51, 52, 53, 54, 55, 1]
  }
];

var trophies = [];
var byId = {};
var state = loadState();
var currentFilter = 'all';
var currentQuery = '';
var noScroll = false;

function $(id) { return document.getElementById(id); }

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadState() {
  var fallback = { earned: {}, spoiler: false, earnedOnly: false };
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) return fallback;
    var parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (parsed.earned && typeof parsed.earned === 'object') fallback.earned = parsed.earned;
      if (typeof parsed.spoiler === 'boolean') fallback.spoiler = parsed.spoiler;
      if (typeof parsed.earnedOnly === 'boolean') fallback.earnedOnly = parsed.earnedOnly;
    }
  } catch (e) { /* corrupted save: start fresh */ }
  return fallback;
}

function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
}

function isEarned(t) { return !!state.earned[t.id]; }

function isConcealed(t) {
  return state.spoiler && !isEarned(t) && (t.category === 'story' || t.hidden);
}

function gradeWord(g) { return g.charAt(0).toUpperCase() + g.slice(1); }

function targetLine(t) {
  if (!t.target) return '';
  var unit = t.target >= 1000 ? '$' + t.target.toLocaleString('en-US') : String(t.target);
  return 'Target: ' + unit;
}

function matchesFilter(t) {
  if (currentFilter === 'missable') return !!t.missable;
  if (currentFilter === 'all') return true;
  return t.category === currentFilter;
}

function matchesQuery(t) {
  if (!currentQuery) return true;
  var hay = (t.name + ' ' + t.desc + ' ' + t.guide + ' ' + t.phase).toLowerCase();
  return hay.indexOf(currentQuery) !== -1;
}

function visibleTrophies() {
  return trophies.filter(function (t) {
    if (!matchesFilter(t)) return false;
    if (!matchesQuery(t)) return false;
    if (state.earnedOnly && !isEarned(t)) return false;
    return true;
  });
}

function renderProgress() {
  var earned = trophies.filter(isEarned).length;
  $('earnedCount').textContent = String(earned);
  $('progressFill').style.width = (earned / trophies.length * 100) + '%';
  $('progressNote').textContent =
    earned === 0 ? 'Tick a trophy to start your run.' :
    earned === trophies.length ? 'Platinum! Every trophy in Leonida is yours.' :
    (trophies.length - earned) + ' to go — next up: ' + nextSuggestion();
  var counts = {};
  trophies.forEach(function (t) {
    if (isEarned(t)) counts[t.grade] = (counts[t.grade] || 0) + 1;
  });
  $('gradeLine').textContent =
    ['platinum', 'gold', 'silver', 'bronze'].map(function (g) {
      return (counts[g] || 0) + ' ' + g;
    }).join(' · ');
}

function nextSuggestion() {
  var order = [28, 2, 3, 4, 5, 6, 7, 22, 25, 29, 15, 30, 31];
  for (var i = 0; i < order.length; i++) {
    var t = byId[order[i]];
    if (t && !isEarned(t)) return t.name;
  }
  var rest = trophies.find(function (t) { return !isEarned(t); });
  return rest ? rest.name : '';
}

function renderChips() {
  var box = $('filterChips');
  box.innerHTML = '';
  FILTERS.forEach(function (pair) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (currentFilter === pair[0] ? ' active' : '');
    b.textContent = pair[1];
    b.setAttribute('aria-pressed', currentFilter === pair[0] ? 'true' : 'false');
    b.addEventListener('click', function () {
      currentFilter = pair[0];
      renderChips();
      renderList();
    });
    box.appendChild(b);
  });
}

function trophyRow(t) {
  var li = document.createElement('li');
  li.className = 'trophy-row g-' + t.grade + (isEarned(t) ? ' is-earned' : '');
  li.dataset.trophyId = String(t.id);

  var box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(t);
  box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
  box.addEventListener('click', function (ev) {
    ev.stopPropagation();
    toggleEarned(t.id, box.checked);
  });
  li.appendChild(box);

  var mid = document.createElement('div');
  if (isConcealed(t)) {
    mid.innerHTML = '<div class="t-name spoiler-hidden">Hidden trophy — earn it to reveal</div>' +
      '<div class="t-desc">A story trophy. Its name and description stay hidden while spoiler mode is on.</div>';
  } else {
    var tags = '<span class="pill">' + escapeHtml(t.phase) + '</span>';
    if (t.missable) tags += '<span class="pill alert">Missable</span>';
    if (t.hidden) tags += '<span class="pill secret">Hidden on PSN</span>';
    if (t.target) tags += '<span class="pill">' + escapeHtml(targetLine(t)) + '</span>';
    mid.innerHTML = '<div class="t-name">' + escapeHtml(t.name) + '</div>' +
      '<div class="t-desc">' + escapeHtml(t.desc) + '</div>' +
      '<div class="t-tags">' + tags + '</div>';
  }
  li.appendChild(mid);

  var right = document.createElement('div');
  right.className = 't-grade';
  right.innerHTML = '<span class="grade-dot"></span><span class="grade-word">' + gradeWord(t.grade) + '</span>';
  li.appendChild(right);

  li.addEventListener('click', function () { openTrophy(t.id); });
  return li;
}

function renderList() {
  var list = $('trophyList');
  var shown = visibleTrophies();
  list.innerHTML = '';
  shown.forEach(function (t) { list.appendChild(trophyRow(t)); });
  $('listMeta').textContent = shown.length === trophies.length
    ? 'Showing all 55 trophies.'
    : 'Showing ' + shown.length + ' of 55 trophies.';
}

function renderRoadmap() {
  var box = $('roadmapList');
  box.innerHTML = '';
  ROADMAP.forEach(function (phase) {
    var li = document.createElement('li');
    li.className = 'phase';
    var chips = phase.ids.map(function (id) {
      var t = byId[id];
      if (!t) return '';
      return '<li><a href="#/trophy/' + id + '" class="' + (isEarned(t) ? 'done' : '') + '">' +
        escapeHtml(t.name) + '</a></li>';
    }).join('');
    li.innerHTML = '<h3>' + escapeHtml(phase.title) + '</h3>' +
      '<p class="phase-hours">' + escapeHtml(phase.hours) + '</p>' +
      '<p>' + escapeHtml(phase.blurb) + '</p>' +
      '<ul class="phase-trophies">' + chips + '</ul>';
    box.appendChild(li);
  });
}

function renderMissables() {
  var box = $('missableList');
  box.innerHTML = '';
  trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
    var card = document.createElement('div');
    card.className = 'phase';
    card.innerHTML = '<h3>' + escapeHtml(t.name) + ' <span class="pill alert">Potentially missable</span></h3>' +
      '<p class="official" style="border-left:3px solid var(--pink);padding-left:12px;color:var(--muted);font-style:italic;">' +
      escapeHtml(t.desc) + '</p>' +
      '<p>' + escapeHtml(t.guide) + '</p>' +
      '<p><a href="#/trophy/' + t.id + '">Open the full guide</a></p>';
    box.appendChild(card);
  });
}

function sourceList(t) {
  return (t.sources || []).map(function (s) {
    if (s.url) return '<li><a href="' + escapeHtml(s.url) + '" rel="noopener">' + escapeHtml(s.label) + '</a></li>';
    return '<li>' + escapeHtml(s.note) + '</li>';
  }).join('');
}

function openTrophy(id) {
  var t = byId[id];
  var panel = $('detailPanel');
  if (!t) { panel.hidden = true; panel.innerHTML = ''; return; }
  var warn = t.missable
    ? '<div class="flag-box"><strong>Potentially missable.</strong> Do the first meditation during Chapter 1 — see the guide below — and keep a chapter-start save.</div>'
    : '';
  panel.innerHTML =
    '<button class="close-detail" type="button" id="closeDetail">Close</button>' +
    '<h2>' + escapeHtml(t.name) + '</h2>' +
    '<p class="meta-line">' + gradeWord(t.grade) + ' · ' + escapeHtml(t.phase) +
    (t.target ? ' · ' + escapeHtml(targetLine(t)) : '') +
    (t.hidden ? ' · Hidden on PSN' : '') + ' · ' + (isEarned(t) ? 'Earned' : 'Not earned yet') + '</p>' +
    '<p class="official">Official description: &ldquo;' + escapeHtml(t.desc) + '&rdquo;</p>' +
    warn +
    '<p class="guide-body">' + escapeHtml(t.guide) + '</p>' +
    '<h3>Sources</h3><ul class="src">' + sourceList(t) + '</ul>';
  panel.hidden = false;
  $('closeDetail').addEventListener('click', function () {
    panel.hidden = true;
    panel.innerHTML = '';
    if (location.hash.indexOf('/trophy/') !== -1) history.replaceState(null, '', '#/checklist');
  });
  if (!noScroll) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function toggleEarned(id, on) {
  if (on) state.earned[id] = true; else delete state.earned[id];
  saveState();
  renderProgress();
  renderList();
  renderRoadmap();
}

function showView(name) {
  ['checklist', 'roadmap', 'missables'].forEach(function (v) {
    $('view-' + v).hidden = (v !== name);
  });
  document.querySelectorAll('.view-tab').forEach(function (b) {
    b.classList.toggle('active', b.dataset.view === name);
  });
}

function route() {
  var hash = location.hash || '#/checklist';
  var m = hash.match(/^#\/trophy\/(\d+)$/);
  if (m) { showView('checklist'); openTrophy(Number(m[1])); return; }
  if (hash === '#/roadmap') { showView('roadmap'); return; }
  if (hash === '#/missables') { showView('missables'); return; }
  showView('checklist');
}

function exportProgress() {
  var payload = {
    app: 'leonida-platinum',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: Object.keys(state.earned).map(Number).sort(function (a, b) { return a - b; })
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function importProgress(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(String(reader.result));
      var ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      var next = {};
      ids.forEach(function (id) {
        if (byId[Number(id)]) next[Number(id)] = true;
      });
      state.earned = next;
      saveState();
      renderProgress(); renderList(); renderRoadmap();
    } catch (e) {
      alert('That file is not a Leonida Platinum progress export.');
    }
  };
  reader.readAsText(file);
}

function applyQueryParams() {
  var q = new URLSearchParams(location.search);
  if (q.get('seed') === 'demo' && Object.keys(state.earned).length === 0) {
    DEMO_EARNED.forEach(function (id) { state.earned[id] = true; });
    saveState();
  }
  if (q.get('spoiler') === '1') {
    state.spoiler = true;
    saveState();
  }
  var f = q.get('filter');
  if (f && FILTERS.some(function (pair) { return pair[0] === f; })) currentFilter = f;
  if (q.get('noscroll') === '1') noScroll = true;
}

function init() {
  applyQueryParams();
  fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (data) {
    trophies = data.trophies;
    trophies.forEach(function (t) { byId[t.id] = t; });
    $('spoilerToggle').checked = state.spoiler;
    $('earnedOnlyToggle').checked = state.earnedOnly;
    renderChips();
    renderProgress();
    renderList();
    renderRoadmap();
    renderMissables();
    route();
  }).catch(function () {
    $('trophyList').innerHTML = '<li>Could not load data/trophies.json. Serve app/ over HTTP or open index.html from the app folder.</li>';
  });

  document.querySelectorAll('.view-tab').forEach(function (b) {
    b.addEventListener('click', function () { location.hash = '#/' + b.dataset.view; });
  });
  $('searchInput').addEventListener('input', function (e) {
    currentQuery = e.target.value.trim().toLowerCase();
    renderList();
  });
  $('spoilerToggle').addEventListener('change', function (e) {
    state.spoiler = e.target.checked;
    saveState();
    renderList();
  });
  $('earnedOnlyToggle').addEventListener('change', function (e) {
    state.earnedOnly = e.target.checked;
    saveState();
    renderList();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importBtn').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function (e) {
    if (e.target.files.length) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', function () {
    if (confirm('Clear all earned trophies and settings?')) {
      state = { earned: {}, spoiler: false, earnedOnly: false };
      saveState();
      $('spoilerToggle').checked = false;
      $('earnedOnlyToggle').checked = false;
      renderProgress(); renderList(); renderRoadmap();
    }
  });
  window.addEventListener('hashchange', route);
}

document.addEventListener('DOMContentLoaded', init);
