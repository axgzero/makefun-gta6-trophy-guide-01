// Leonida Trophy Guide: tracker, roadmap and missables for the 55 GTA VI trophies.
// Static files only: the list comes from data/trophies.json (same origin), progress
// lives in localStorage, and nothing is fetched from the network at run time.
// Demo hook for screenshots only: ?seed=demo pre-fills 13 earned trophies and
// turns the spoiler setting off. It never runs unless the query is present.
const KEY = 'gta6-trophy-guide-v1';
const DEMO_EARNED_IDS = [2, 3, 8, 15, 16, 18, 19, 21, 35, 42, 52, 53, 55];

const view = document.getElementById('view');
const detail = document.getElementById('detail');
const controls = document.getElementById('controls');
const searchInput = document.getElementById('search');
const kindFilter = document.getElementById('kindFilter');
const gradeFilter = document.getElementById('gradeFilter');
const statusFilter = document.getElementById('statusFilter');
const missableOnly = document.getElementById('missableOnly');
const spoilerToggle = document.getElementById('spoilerToggle');

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const byName = new Map(trophies.map((t) => [t.name, t]));

let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { saved = {}; }
const state = {
  earned: new Set((saved.earned ?? []).filter((n) => byName.has(n))),
  spoilers: saved.spoilers !== false,
};
const params = new URLSearchParams(location.search);
if (params.get('seed') === 'demo') {
  state.earned = new Set(DEMO_EARNED_IDS.map((id) => byId.get(id).name));
  state.spoilers = false;
}
if (params.get('spoilers') === 'on') state.spoilers = true;
if (params.get('spoilers') === 'off') state.spoilers = false;
spoilerToggle.checked = state.spoilers;

function save() {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...state.earned], spoilers: state.spoilers }));
}

function isConcealed(t) {
  return t.hidden && state.spoilers && !state.earned.has(t.name);
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function kindLabel(kind) {
  const labels = {
    story: 'Story', side: 'Side mission', activity: 'Activity', collectible: 'Collectible',
    crime: 'Crime', exploration: 'Exploration', money: 'Money', completion: '100% completion',
    misc: 'Secret', platinum: 'Platinum',
  };
  return labels[kind] ?? kind;
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function gradeBadge(t) {
  const span = el('span', 'grade grade-' + t.grade);
  const dot = el('span', 'grade-dot');
  span.append(dot, document.createTextNode(gradeLabel(t)));
  return span;
}

function renderProgress() {
  const earned = state.earned.size;
  document.getElementById('earnedCount').textContent = String(earned);
  document.getElementById('barFill').style.width = (earned / trophies.length) * 100 + '%';
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && state.earned.has(t.name)).length;
    return gradeLabel({ grade: g }) + ' ' + got + '/' + total;
  });
  document.getElementById('gradeCounts').textContent =
    '55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze · ' + parts.join(' · ');
}

function trophyRow(t) {
  const li = el('li', 'trophy' + (state.earned.has(t.name) ? ' earned' : ''));
  if (selectedId === t.id) li.classList.add('selected');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.name);
  box.setAttribute('aria-label', 'Mark ' + (isConcealed(t) ? 'hidden trophy' : t.name) + ' earned');
  box.addEventListener('change', (e) => {
    e.stopPropagation();
    if (box.checked) state.earned.add(t.name);
    else state.earned.delete(t.name);
    save();
    renderProgress();
    render();
  });
  li.append(box);
  const body = el('div');
  if (isConcealed(t)) {
    body.append(el('div', 'name', 'Hidden trophy'));
    body.append(el('div', 'hidden-note', 'Story or secret trophy — earn it to reveal its name and guide.'));
  } else {
    body.append(el('div', 'name', t.name));
    body.append(el('div', 'desc', t.description));
    const tags = el('div', 'tags');
    tags.append(el('span', 'tag', kindLabel(t.kind)));
    if (t.stage !== kindLabel(t.kind)) tags.append(el('span', 'tag', t.stage));
    if (t.missable) tags.append(el('span', 'tag missable', 'Missable'));
    if (t.target) tags.append(el('span', 'tag', 'Count: ' + t.target));
    body.append(tags);
  }
  li.append(body);
  li.append(gradeBadge(t));
  li.addEventListener('click', () => { location.hash = '#/trophy/' + t.id; });
  return li;
}

function filteredTrophies() {
  const q = searchInput.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kindFilter.value !== 'all' && t.kind !== kindFilter.value) return false;
    if (gradeFilter.value !== 'all' && t.grade !== gradeFilter.value) return false;
    if (statusFilter.value === 'earned' && !state.earned.has(t.name)) return false;
    if (statusFilter.value === 'unearned' && state.earned.has(t.name)) return false;
    if (missableOnly.checked && !t.missable) return false;
    if (q) {
      if (isConcealed(t)) return false;
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.stage).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderChecklist() {
  controls.style.display = '';
  view.replaceChildren();
  const list = filteredTrophies();
  const count = el('p', 'count-line', list.length + ' of 55 trophies shown · ' + state.earned.size + ' earned');
  view.append(count);
  const ul = el('ul', 'trophy-list');
  for (const t of list) ul.append(trophyRow(t));
  view.append(ul);
}

const ROADMAP_STEPS = [
  {
    title: 'Step 1 — Play the story',
    hours: '60–80 hours',
    text: 'Finish the five-chapter story and enjoy it. Any progress toward the 100% checklist already counts while you play, even though the checklist itself only becomes viewable after the story. There is no mission replay, so keep a separate save at the start and end of every chapter. Cheats disable trophies and saving, so keep them off the save you use for the platinum. (PowerPyx)',
    stages: ['Story — Opening', 'Story — Chapter 1', 'Story — Chapter 1 (do the first meditation early)', 'Story — Chapter 2', 'Story — Chapter 3', 'Story — Chapter 4', 'Story — Missions', 'Story — Finale'],
  },
  {
    title: 'Step 2 — The 100% checklist',
    hours: 'About 100 hours',
    text: 'After the ending, the 100% Completion checklist unlocks under Progress, then Stats, then 100% Completion. PowerPyx notes it is lenient — closer to 60% true completion: most side quests are not required, collectibles only partly, and you need 70 of the 80 challenges. What needs everything: robberies, underwater discoveries, shooting ranges, drone races and Bret’s quests. You only need 200 of 277 vehicles and 100 of 255 animals.',
    stages: ['Endgame — 100%', 'Endgame — Challenges', 'Endgame — Robberies', 'Open world — Shooting Range', 'Open world — Drone Races', 'Open world — Stunts', 'Open world — Races', 'Open world — Vehicles', 'Open world — Collectibles'],
  },
  {
    title: 'Step 3 — Strangers & cleanup',
    hours: 'About 10 hours',
    text: 'Finish the stranger mission strands, then sweep up the remaining activities, money, exploration and secret trophies. Most of these pop on the way to 100%; this step is the leftovers. One playthrough is enough, and everything here is still reachable in free-roam after the story. (PowerPyx)',
    stages: ['Side — Strangers & Freaks', 'Side — Bret’s quests', 'Open world — Activities', 'Open world — Fishing', 'Open world — Arcade', 'Open world — Bowling', 'Open world — Money', 'Open world — Exploration', 'Open world — Secrets', 'Open world — Criminal Profile', 'Open world — Combat', 'Open world — Wanted', 'Open world — VCIA', 'Open world — Robberies', 'Platinum'],
  },
];

function stageChips(stage) {
  const ul = el('ul', 'chips');
  for (const t of trophies.filter((x) => x.stage === stage)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#/trophy/' + t.id;
    a.textContent = isConcealed(t) ? 'Hidden trophy' : t.name;
    if (state.earned.has(t.name)) a.classList.add('done');
    li.append(a);
    ul.append(li);
  }
  return ul;
}

function renderRoadmap() {
  controls.style.display = 'none';
  view.replaceChildren();
  const intro = el('div', 'callout');
  intro.append(el('h2', null, 'Road to the platinum'));
  intro.append(el('p', null, 'About 200 hours, difficulty 4/10, one playthrough, no online trophies. The hardest trophy is A Long Road, the gold for 100% completion. (PowerPyx; Push Square puts the total closer to 300 hours.)'));
  view.append(intro);
  for (const step of ROADMAP_STEPS) {
    const card = el('section', 'step');
    card.append(el('p', 'hours', step.hours));
    card.append(el('h2', null, step.title));
    card.append(el('p', null, step.text));
    for (const stage of step.stages) {
      if (!trophies.some((t) => t.stage === stage)) continue;
      const block = el('div', 'stage');
      block.append(el('h3', null, stage));
      block.append(stageChips(stage));
      card.append(block);
    }
    view.append(card);
  }
}

function renderMissables() {
  controls.style.display = 'none';
  view.replaceChildren();
  const callout = el('div', 'callout');
  callout.append(el('h2', null, 'One trophy can be missed. Just one.'));
  callout.append(el('p', null, 'PowerPyx flags Positive Mental Attitude as the only potentially missable trophy: the first meditation, Lucia on the balcony at Jason’s house in Chapter 1, is reported gone after that chapter. Whether that spot is strictly required is unconfirmed — but doing it during Chapter 1 is the safe play.'));
  callout.append(el('p', null, 'Everything else is earnable in free-roam after the story, and with no mission replay the safety net is a separate save at the start and end of every chapter. Cheats disable trophies and saving, so keep them off your platinum save.'));
  view.append(callout);
  const missable = trophies.filter((t) => t.missable);
  for (const t of missable) {
    const card = el('section', 'step');
    card.append(el('p', 'hours', 'Missable'));
    card.append(el('h2', null, t.name));
    card.append(el('p', null, t.description));
    card.append(el('p', null, t.guide));
    view.append(card);
  }
  const safe = el('section', 'step');
  safe.append(el('h2', null, 'Everything else is safe'));
  safe.append(el('p', null, 'All 54 other trophies can still be earned after the story ends. Story trophies pop as you play, and every activity, collectible, robbery and exploration trophy stays open in free-roam.'));
  view.append(safe);
}

function renderDetail() {
  detail.replaceChildren();
  const card = el('div', 'detail-card');
  if (!selectedId || !byId.has(selectedId)) {
    card.append(el('h2', null, 'Pick a trophy'));
    card.append(el('p', 'pick', 'Click any trophy in the list to see its guide, its sources and when it can be missed. Tick the box to mark it earned — your progress is saved in this browser and can be exported below.'));
    card.append(el('h3', null, 'How the road runs'));
    card.append(el('p', 'pick', 'Story first (60–80 hours), then the 100% checklist (about 100 hours), then strangers and cleanup (about 10 hours). One trophy can be missed — see the Missables tab.'));
    detail.append(card);
    return;
  }
  const t = byId.get(selectedId);
  if (isConcealed(t)) {
    card.append(el('h2', null, 'Hidden trophy'));
    card.append(gradeBadge(t));
    card.append(el('p', 'official', 'A story or secret trophy. Its name, description and guide stay hidden until you earn it — turn the spoiler setting off to reveal it, or tick it earned.'));
    detail.append(card);
    return;
  }
  card.append(el('h2', null, t.name));
  card.append(gradeBadge(t));
  const meta = el('p', 'meta', kindLabel(t.kind) + ' · ' + t.stage + (t.target ? ' · PSN tracks a count: ' + t.target : ''));
  card.append(meta);
  const official = el('p', 'official', '“' + t.description + '” — the official description.');
  card.append(official);
  if (t.missable) {
    card.append(el('p', 'warn', 'Missable: do the first meditation at Jason’s house during Chapter 1 — see the guide.'));
  }
  card.append(el('p', 'guide-text', t.guide));
  card.append(el('h3', null, 'Sources'));
  const ul = el('ul', 'sources');
  for (const s of t.sources) {
    const li = document.createElement('li');
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      li.append(a);
    } else {
      li.textContent = s.name;
    }
    ul.append(li);
  }
  card.append(ul);
  detail.append(card);
}

let selectedId = null;

function route() {
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\/?/, '').split('/');
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.remove('active'));
  if (parts[0] === 'roadmap') {
    document.querySelector('[data-view="roadmap"]').classList.add('active');
    selectedId = null;
    renderRoadmap();
  } else if (parts[0] === 'missables') {
    document.querySelector('[data-view="missables"]').classList.add('active');
    selectedId = null;
    renderMissables();
  } else if (parts[0] === 'trophy' && byId.has(Number(parts[1]))) {
    document.querySelector('[data-view="checklist"]').classList.add('active');
    selectedId = Number(parts[1]);
    renderChecklist();
  } else {
    document.querySelector('[data-view="checklist"]').classList.add('active');
    selectedId = null;
    renderChecklist();
  }
  renderDetail();
  renderProgress();
}

function render() {
  route();
}

searchInput.addEventListener('input', () => { if (!location.hash.startsWith('#/roadmap') && !location.hash.startsWith('#/missables')) renderChecklist(); });
kindFilter.addEventListener('change', renderChecklist);
gradeFilter.addEventListener('change', renderChecklist);
statusFilter.addEventListener('change', renderChecklist);
missableOnly.addEventListener('change', renderChecklist);
spoilerToggle.addEventListener('change', () => {
  state.spoilers = spoilerToggle.checked;
  save();
  render();
});
document.getElementById('exportBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...state.earned] }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
});
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    state.earned = new Set(names.filter((n) => byName.has(n)));
    save();
    render();
  } catch {
    alert('That file is not a trophy progress export from this guide.');
  }
  e.target.value = '';
});

window.addEventListener('hashchange', route);
route();
