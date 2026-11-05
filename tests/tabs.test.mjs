// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  TABS, GRAVE_COLS, tabCount, deathsFor, rowValues, engineLine, engineUrl, midiWord, ttlState, dur, ago,
} from '../js/tabs.js';
import { discoveryPresenceActive } from '../vendor/apk-contracts/apk-contracts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const NOW = 1_800_000_000;
const ctx = { now: NOW, serialLastScan: NOW - 10, presence: discoveryPresenceActive };
const tab = (k) => TABS.find((t) => t.key === k);

const STATUS = {
  engine: { status: 'online', uptime_secs: 1258, last_sweep_at: NOW - 27, sweep_count: 42, host_ips: ['44.44.44.44', '44.44.44.168'] },
  plugins: [
    { service_name: 'ping', container_name: 'Plugin-PING', is_active: true, docker_status: 'running', health: 'healthy', uptime_secs: 90, deaths: 0 },
    { service_name: 'snmp', container_name: 'Plugin-SNMP', is_active: false, docker_status: 'exited', exit_code: 0, deaths: 2, last_death_reason: 'idle' },
  ],
  ping_hosts: [
    { host: { ip: '44.44.44.1', mac: '7C:8B:CA:31:3F:18', vendor: 'TP-LINK', rtt_ms: 0.26 }, alive: true, last_seen: NOW - 10 },
    { host: { ip: '44.44.44.151', mac: '06:1C:93:71:58:7B' }, alive: true, dying: true, expires_in_secs: 25, last_seen: NOW - 70 },
  ],
  serial: { last_scan: NOW - 10, ports: [{ dev_path: '/dev/ttyUSB2', last_seen: NOW - 9 }, { dev_path: '/dev/ttyUSB9', last_seen: NOW - 300 }], usb: [{ key: 'hub', is_hub: true }, { key: 'x', product: 'Adapter', last_seen: NOW - 8 }] },
  deaths: [
    { id: 'h1', kind: 'ping', ip: '44.44.44.99', reason: 'silent 120 s', died_at: NOW - 60 },
    { id: 'p1', kind: 'plugin', reason: 'idle', died_at: NOW - 30 },
  ],
};

test('every tab reads its rows out of /api/status and counts what is up', () => {
  assert.deepEqual(tabCount(tab('plugins'), STATUS, ctx), { up: 1, total: 2, text: '1/2', state: 'good' });
  assert.equal(tabCount(tab('network'), STATUS, ctx).text, '1/2');           // dying is not up
  assert.equal(tabCount(tab('serial'), STATUS, ctx).text, '1/2');            // not seen at the last scan is gone
  assert.equal(tabCount(tab('usb'), STATUS, ctx).text, '1/1');               // hubs left out
  assert.deepEqual(tabCount(tab('graveyard'), STATUS, ctx), { up: 0, total: 2, text: '2', state: 'dead' });
  assert.equal(tabCount(tab('dante'), STATUS, ctx).state, 'none');           // nothing heard
});

test('cells are text, never HTML — and a broken record is a dash, not a crash', () => {
  const r = rowValues(tab('network').cols, STATUS.ping_hosts[1], ctx);
  assert.equal(r.c0, '44.44.44.151');
  assert.equal(r.c1, 'dying · 25s');
  assert.equal(r.c4, '—');
  assert.equal(r.c6, '1m 10s ago');
  for (const v of Object.values(rowValues(tab('plugins').cols, STATUS.plugins[1], ctx))) assert.equal(typeof v, 'string');
  assert.equal(rowValues(tab('instruments').cols, {}, ctx).c2, '—');         // identity missing
});

test('a stopped plugin carries its kick; a running one does not', () => {
  const kick = tab('plugins').cols.findIndex((c) => c.kind === 'kick');
  assert.equal(rowValues(tab('plugins').cols, STATUS.plugins[0], ctx)[`c${kick}`], '');
  assert.equal(rowValues(tab('plugins').cols, STATUS.plugins[1], ctx)[`c${kick}`], 'snmp');
});

test('each tab shows only its own dead below it', () => {
  assert.deepEqual(deathsFor(tab('network'), STATUS).map((d) => d.id), ['h1']);
  assert.deepEqual(deathsFor(tab('plugins'), STATUS).map((d) => d.id), ['p1']);
  assert.deepEqual(deathsFor(tab('graveyard'), STATUS), []);
  assert.equal(GRAVE_COLS.length, 6);
});

test('the three states are the contract\'s words', () => {
  assert.equal(ttlState({ alive: true }), 'good');
  assert.equal(ttlState({ alive: true, dying: true }), 'kinda');
  assert.equal(ttlState({ alive: false }), 'dead');
  for (const t of TABS) for (const c of t.cols) if (c.kind === 'pill') {
    for (const row of [{}, { is_active: true, alive: true }]) assert.ok(['good', 'kinda', 'dead'].includes(c.state(row, ctx)), `${t.key}/${c.label}`);
  }
});

test('the engine line and where the engine is', () => {
  assert.equal(engineLine(STATUS.engine, NOW), 'up 20m 58s · last sweep 27s ago · sweep #42 · host 44.44.44.44, 44.44.44.168');
  const loc = { hostname: 'bench.local', protocol: 'http:' };
  assert.equal(engineUrl('', { engine_url: '{proto}://{host}:8120' }, loc), 'http://bench.local:8120');
  assert.equal(engineUrl('?engine=http://x:1/', { engine_url: '{proto}://{host}:8120' }, loc), 'http://x:1');
  assert.equal(engineUrl('', { engine_url: '{proto}://{host}:8120' }, { hostname: 'b', protocol: 'https:' }), 'https://b:8120');
  assert.equal(dur(3725), '1h 2m');
  assert.equal(ago(0, NOW), '—');
});

test('MIDI presence is the contract\'s rule, every vector, and unknown — never online — without one', () => {
  const vectors = JSON.parse(fs.readFileSync(path.join(HERE, '../../../../../../contracts/vectors/discovery_presence.json'), 'utf8'));
  for (const c of vectors.cases) {
    const word = c.active === true ? 'online' : c.active === false ? 'offline' : 'unknown';
    assert.equal(midiWord({ presence: c.doc }, ctx), word, JSON.stringify(c));
  }
  assert.equal(midiWord({}, ctx), 'unknown');
  assert.equal(midiWord({ presence: { lastOnline: null, lastOffline: null, lastDiscovered: null } }, ctx) === 'online', false);
  assert.equal(midiWord({ presence: { lastOnline: '2026-10-30T10:00:00.5Z', lastOffline: '2026-10-30T10:00:00.25Z', lastDiscovered: null } }, ctx), 'online');
  assert.equal(midiWord({ presence: { lastOnline: '2026-10-30T10:00:00Z', lastOffline: null, lastDiscovered: null } }, { ...ctx, presence: null }), 'unknown');
});
