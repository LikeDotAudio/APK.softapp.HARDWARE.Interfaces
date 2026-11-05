// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/* app.js — the Interfaces app, drawn with the SDK.

   Every table is APKTable (cells are text; a pill, code or the Kick button is a
   Node built here). Every failure is APKSoftapp.showProblem — what happened, why,
   do this, Retry. The app says what it IS with APKSoftapp.describe (the ? button,
   F1). Inside the OS shell it wears the shell's tokens (inheritTheme). The data:
     GET  {engine}/api/status   everything, one read, every refresh_ms
     POST {engine}/api/kick     {service} — kick a stopped plugin alive
   {engine} is ?engine=<url>, else config/interfaces.json `engine_url`. */

import { TABS, GRAVE_COLS, tabCount, deathsFor, rowValues, engineLine, engineUrl } from './tabs.js';

const S = window.APKSoftapp;
const T = window.APKTable;
const C = window.APKContracts;
const $ = (id) => document.getElementById(id);
const CONFIG_URL = new URL('../config/interfaces.json', import.meta.url).href;

const state = { data: null, cfg: {}, engine: '', current: 'plugins', tables: {}, problemShown: false };

function ctx() {
  const d = state.data || {};
  return {
    now: Math.floor(Date.now() / 1000),
    serialLastScan: (d.serial || {}).last_scan || 0,
    presence: C && typeof C.discoveryPresenceActive === 'function' ? (p) => C.discoveryPresenceActive(p) : null,
  };
}

function node(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/* A column spec → an APKTable column. The value is text; `kind` dresses it. */
function column(spec, i) {
  const col = { key: `c${i}`, label: spec.label, editable: false };
  if (spec.kind === 'code') col.mono = true;
  if (spec.kind === 'pill') {
    col.render = (v, row) => {
      const s = node('span', 'pill', v);
      s.setAttribute('data-apk-state', spec.state ? spec.state(rawOf(row), ctx()) : 'kinda');
      return s;
    };
  } else if (spec.kind === 'strong' || spec.kind === 'dim') {
    col.render = (v) => node(spec.kind === 'strong' ? 'b' : 'span', spec.kind === 'dim' ? 'dim' : '', v);
  } else if (spec.kind === 'kick') {
    col.render = (v) => (v ? kickButton(v) : node('span', '', ''));
  }
  return col;
}

/* APKTable keeps our plain row; the original record rides along un-enumerated. */
const RAW = Symbol('raw');
const rawOf = (row) => (row && row[RAW]) || row;
function rowsFor(cols, records) {
  const c = ctx();
  return records.map((r) => Object.defineProperty(rowValues(cols, r, c), RAW, { value: r }));
}

function kickButton(service) {
  const b = node('button', 'kick', '👢 Kick alive');
  b.addEventListener('click', async () => {
    b.disabled = true; b.textContent = '…';
    const r = await S.fetchJson(`${state.engine}/api/kick`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }), timeoutMs: 8000, subject: service,
    });
    if (!r.ok) { b.textContent = '✗'; S.showProblem(r.problem, { onRetry: () => b.click() }); }
    else { b.textContent = r.data.kicked ? '✓' : '✗'; b.title = r.data.note || ''; }
    setTimeout(refresh, 1500);
  });
  return b;
}

function table(id, host, cols, records) {
  const columns = cols.map(column);
  const rows = rowsFor(cols, records);
  const prior = state.tables[id];
  if (prior && prior.cols === cols) { prior.handle.setRows(rows); return prior.handle; }
  host.textContent = '';
  const handle = T.create(host, { id, columns, rows });
  state.tables[id] = { cols, handle };
  return handle;
}

function renderTabs() {
  const nav = $('tabs');
  nav.textContent = '';
  for (const t of TABS) {
    const n = tabCount(t, state.data, ctx());
    const el = node('button', `tab${t.key === state.current ? ' on' : ''}`);
    el.type = 'button';
    el.dataset.tab = t.key;
    el.append(node('span', 'icon', t.icon), node('span', 'name', t.name));
    const c = node('span', 'n', n.text);
    c.setAttribute('data-apk-state', n.state === 'none' ? 'kinda' : n.state);
    if (n.state === 'none') c.classList.add('none');
    el.append(c);
    nav.append(el);
  }
}

function render() {
  const d = state.data;
  const e = d.engine || {};
  const up = e.status === 'online';
  $('engine-state').textContent = String(e.status || '—').toUpperCase();
  $('engine-state').setAttribute('data-apk-state', up ? 'good' : 'dead');
  $('engine-line').textContent = engineLine(e, ctx().now);
  renderTabs();

  const tab = TABS.find((t) => t.key === state.current) || TABS[0];
  const all = tab.rows(d);
  const live = all.filter((r) => tab.live(r, ctx())).length;
  $('title').textContent = `${tab.icon} ${tab.name.toUpperCase()}`;
  $('what').textContent = tab.what;
  $('count').textContent = tab.graveyard ? `${all.length} dead` : `${live} up of ${all.length}`;
  // APKTable's own search box filters it; nothing restated here.
  table(`interfaces-${tab.key}`, $('main-table'), tab.cols, all);

  const grave = $('grave');
  if (tab.graveyard) { grave.hidden = true; return; }
  const deaths = deathsFor(tab, d);
  grave.hidden = false;
  $('grave-count').textContent = String(deaths.length);
  table(`interfaces-${tab.key}-graveyard`, $('grave-table'), GRAVE_COLS, deaths);
}

async function refresh() {
  const r = await S.fetchJson(`${state.engine}/api/status`, { timeoutMs: 8000, subject: 'the discovery engine' });
  if (!r.ok) {
    $('engine-state').textContent = 'NO ANSWER';
    $('engine-state').setAttribute('data-apk-state', 'dead');
    $('engine-line').textContent = `${state.engine}/api/status did not answer — nothing below is current`;
    if (!state.problemShown) {
      state.problemShown = true;
      S.showProblem(r.problem, { into: $('problem'), subject: `the discovery engine at ${state.engine}`,
        onRetry: () => { state.problemShown = false; refresh(); } });
    }
    return;
  }
  if (state.problemShown) { $('problem').textContent = ''; state.problemShown = false; }
  state.data = r.data;
  render();
}

async function start() {
  if (!S || !T) {
    document.body.textContent = 'The SDK did not load (vendor/apk-softapp, vendor/apk-table). Re-vendor them or rebuild WEB.Frontend-Assets.';
    return;
  }
  S.inheritTheme();
  const cfg = await S.fetchJson(CONFIG_URL, { timeoutMs: 5000, subject: 'config/interfaces.json' });
  state.cfg = cfg.ok ? cfg.data : {};
  state.engine = engineUrl(location.search, state.cfg, location);
  $('source').textContent = `from ${state.engine} — the discovery engine, live`;
  try { const t = localStorage.getItem('interfaces.tab'); if (TABS.some((x) => x.key === t)) state.current = t; } catch (_) { /* no storage */ }

  S.describe({
    name: 'Interfaces',
    does: 'Every interface the discovery engine has found, and the state it is in now: plugins, instruments, network hosts, serial, USB, MIDI, Dante, PTP, AES67/RAVENNA, mDNS and the graveyard.',
    inputs: [{ name: 'Engine status', from: `${state.engine}/api/status`, kind: 'http' }],
    outputs: [{ name: 'Kick a stopped plugin', to: `${state.engine}/api/kick`, kind: 'http' }],
    controls: [
      { name: 'Tabs', how: 'pick a kind of interface on the left' },
      { name: 'Search', how: 'the table\'s own search box narrows it; headers sort; CSV and Copy export it' },
      { name: 'Kick alive', how: 'on a stopped plugin\'s row' },
      { name: 'Engine', how: '?engine=<url>, else config/interfaces.json engine_url' },
    ],
    problems: ['fetch_failed', 'timeout', 'http_server_error', 'bad_json'],
  });

  $('tabs').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-tab]');
    if (!b) return;
    state.current = b.dataset.tab;
    try { localStorage.setItem('interfaces.tab', state.current); } catch (_) { /* no storage */ }
    if (state.data) render();
  });

  await refresh();
  setInterval(refresh, Number(state.cfg.refresh_ms) || 5000);
}

start();
