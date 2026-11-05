// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/* tabs.js — WHAT THE INTERFACES APP SHOWS, as data.

   One tab per kind of interface the discovery engine (POD.THICK/DISCOVERY.Engine)
   reports in one read of GET {engine}/api/status. Each tab says where its rows
   are in that answer, which of them count as up, and its columns. A column is
   { label, value(row, ctx) → text, kind?, state?(row, ctx) }: the value is always
   TEXT (APKTable draws text, never HTML); `kind` is how app.js dresses it —
   'strong', 'code', 'dim', 'pill' (with `state`: good | kinda | dead, the
   contract's three words) or 'kick' (the one action: kick a stopped plugin).

   Pure: no DOM, no fetch. ctx = { now, serialLastScan, presence(p) } — presence
   is the contract's rule (APKContracts.discoveryPresenceActive), handed in so
   the tests can run it from the vendored bundle. */

export const dur = (s) => (s == null || !Number.isFinite(Number(s))) ? '—'
  : s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s`
    : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
export const ago = (t, now) => (t ? `${dur(Math.max(0, now - t))} ago` : '—');
const or = (v) => (v === undefined || v === null || v === '' ? '—' : String(v));

/** The engine's own verdict on anything with a TTL: good (alive), kinda (dying), dead. */
export const ttlState = (x) => (x.alive === false ? 'dead' : x.dying ? 'kinda' : 'good');
const ttlCol = { label: 'Status', kind: 'pill', state: (x) => ttlState(x),
  value: (x) => (x.alive === false ? 'dead' : x.dying ? `dying · ${x.expires_in_secs}s` : 'live') };

/** A serial port or USB device is present when the last sysfs scan saw it. */
export const present = (x, ctx) => !ctx.serialLastScan || (x.last_seen || 0) >= ctx.serialLastScan - 5;

/** A MIDI port's word: the contract's presence rule, and `unknown` (never online) without one. */
export function midiWord(p, ctx) {
  const a = p && p.presence && ctx.presence ? ctx.presence(p.presence) : null;
  return a === true ? 'online' : a === false ? 'offline' : 'unknown';
}

export const TABS = [
  { key: 'plugins', icon: '🧩', name: 'Plugins',
    what: "The supervised plugin containers — each one is the driver for an interface family. Status is Docker's plus the traffic the engine last saw from it.",
    rows: (d) => d.plugins || [], live: (p) => !!p.is_active,
    dead: (g) => !!g.orphaned_service || g.kind === 'plugin',
    cols: [
      { label: 'Service', kind: 'strong', value: (p) => String(p.service_name || '').toUpperCase() },
      { label: 'Container', value: (p) => or(p.container_name) },
      { label: 'Status', kind: 'pill', state: (p) => (p.is_active ? 'good' : p.grave_secs_remaining != null ? 'kinda' : 'kinda'),
        value: (p) => (p.is_active ? 'running' : 'stopped / idle') },
      { label: 'Docker says', kind: 'pill', state: (p) => (p.docker_status === 'running' ? 'good' : 'kinda'),
        value: (p) => `${or(p.docker_status)}${p.docker_status === 'exited' ? ` (${p.exit_code})` : ''}${p.health && p.health !== 'none' ? ` · ${p.health}` : ''}` },
      { label: 'Last traffic', value: (p) => (p.last_seen_secs_ago == null ? 'none yet' : `${dur(p.last_seen_secs_ago)} ago`) },
      { label: 'Uptime', value: (p) => dur(p.uptime_secs) },
      { label: 'Deaths', value: (p) => (p.deaths ? `${p.deaths}${p.last_death_reason ? ` — ${p.last_death_reason}` : ''}` : 'none') },
      { label: '', kind: 'kick', value: (p) => (p.is_active ? '' : String(p.service_name || '')) },
    ] },
  { key: 'instruments', icon: '🔬', name: 'Instruments',
    what: 'Devices that answered an identity query (VISA *IDN? over LAN, GPIB gateways and serial).',
    rows: (d) => (d.roster || []).filter((r) => r.identity), live: (r) => !!r.is_online,
    dead: (g) => g.kind === 'visa-serial' || g.protocol === 'visa' || (g.kind === 'device' && ['scpi', 'lxi'].includes(g.protocol)),
    cols: [
      { label: 'Device', kind: 'strong', value: (r) => or(r.name) },
      { label: 'Status', kind: 'pill', state: (r) => (r.is_online ? 'good' : 'dead'), value: (r) => (r.is_online ? 'online' : 'offline') },
      { label: 'Family', value: (r) => or(r.identity.family) },
      { label: 'Serial', value: (r) => or(r.identity.serial) },
      { label: 'Firmware', value: (r) => or(r.identity.firmware) },
      { label: 'Resource', kind: 'code', value: (r) => or(r.identity.resource) },
      { label: 'Address', kind: 'code', value: (r) => or(r.address) },
      { label: 'MAC', kind: 'code', value: (r) => or(r.mac) },
      { label: 'Last seen', value: (r, c) => ago(r.last_seen, c.now) },
    ] },
  { key: 'network', icon: '🌐', name: 'Network hosts',
    what: 'Every host on the subnet that answers Plugin-PING, with the vendor its MAC names.',
    rows: (d) => d.ping_hosts || [], live: (h) => h.alive && !h.dying,
    dead: (g) => g.kind === 'ping' || g.protocol === 'ping',
    cols: [
      { label: 'IP', kind: 'code', value: (h) => or(h.host && h.host.ip) },
      ttlCol,
      { label: 'Hostname', value: (h) => or(h.host && h.host.hostname) },
      { label: 'MAC', kind: 'code', value: (h) => or(h.host && h.host.mac) },
      { label: 'Vendor', value: (h) => or(h.host && h.host.vendor) },
      { label: 'RTT', value: (h) => (h.host && h.host.rtt_ms != null ? `${h.host.rtt_ms} ms` : '—') },
      { label: 'Last seen', value: (h, c) => ago(h.last_seen, c.now) },
    ] },
  { key: 'serial', icon: '🔌', name: 'Serial ports',
    what: "Every tty the engine's sysfs watch finds — onboard UARTs and USB adapters. Listed, never opened.",
    rows: (d) => (d.serial || {}).ports || [], live: (p, c) => present(p, c),
    dead: (g) => g.kind === 'serial-port' || g.protocol === 'serial',
    cols: [
      { label: 'Port', kind: 'code', value: (p) => or(p.dev_path) },
      { label: 'Status', kind: 'pill', state: (p, c) => (present(p, c) ? 'good' : 'dead'), value: (p, c) => (present(p, c) ? 'present' : 'gone') },
      { label: 'Kind', value: (p) => or(p.kind) },
      { label: 'Driver', value: (p) => or(p.driver) },
      { label: 'Maker', value: (p) => or(p.manufacturer) },
      { label: 'Product', value: (p) => or(p.product) },
      { label: 'Serial', value: (p) => or(p.serial) },
      { label: 'USB id', kind: 'code', value: (p) => (p.vendor_id ? `${p.vendor_id}:${p.product_id}` : '—') },
    ] },
  { key: 'usb', icon: '🧷', name: 'USB devices',
    what: 'Everything on the USB buses, hubs left out.',
    rows: (d) => ((d.serial || {}).usb || []).filter((u) => !u.is_hub), live: (u, c) => present(u, c),
    dead: (g) => g.kind === 'usb-device' || g.protocol === 'usb',
    cols: [
      { label: 'Device', kind: 'strong', value: (u) => or(u.product || u.key) },
      { label: 'Status', kind: 'pill', state: (u, c) => (present(u, c) ? 'good' : 'dead'), value: (u, c) => (present(u, c) ? 'present' : 'gone') },
      { label: 'Maker', value: (u) => or(u.manufacturer) },
      { label: 'Class', value: (u) => or(u.class_name) },
      { label: 'USB id', kind: 'code', value: (u) => `${or(u.vendor_id)}:${or(u.product_id)}` },
      { label: 'Where', kind: 'code', value: (u) => `bus ${or(u.bus)} · ${or(u.sysfs_id)}` },
      { label: 'Speed', value: (u) => (u.speed_mbps ? `${u.speed_mbps} Mb/s` : '—') },
      { label: 'Drivers', value: (u) => or([...new Set((u.interfaces || []).map((i) => i.driver).filter(Boolean))].join(', ')) },
      { label: 'TTY', value: (u) => or((u.tty_ports || []).join(', ')) },
    ] },
  { key: 'midi', icon: '🎹', name: 'MIDI ports',
    what: 'ALSA sequencer ports Plugin-MIDI publishes.',
    rows: (d) => ((d.midi || {}).ports || []).filter((p) => !p.through), live: (p, c) => midiWord(p, c) === 'online',
    dead: (g) => g.kind === 'midi-port' || g.protocol === 'midi',
    cols: [
      { label: 'Port', kind: 'strong', value: (p) => or(p.name) },
      { label: 'Status', kind: 'pill', value: (p, c) => midiWord(p, c),
        state: (p, c) => ({ online: 'good', offline: 'dead' }[midiWord(p, c)] || 'kinda') },
      { label: 'Direction', value: (p) => or(p.direction) },
      { label: 'Key', kind: 'code', value: (p) => or(p.key) },
      { label: 'Online since', value: (p) => or(p.presence && p.presence.lastOnline) },
    ] },
  { key: 'dante', icon: '🎛', name: 'Dante',
    what: 'Dante devices Plugin-DANTE heard, with their channel counts.',
    rows: (d) => (d.dante || {}).devices || [], live: (x) => x.alive && !x.dying,
    dead: (g) => g.kind === 'dante' || g.protocol === 'dante',
    cols: [
      { label: 'Device', kind: 'strong', value: (x) => or(x.name) },
      ttlCol,
      { label: 'Model', value: (x) => or([x.manufacturer, x.model].filter(Boolean).join(' ')) },
      { label: 'Address', kind: 'code', value: (x) => or(x.address) },
      { label: 'MAC', kind: 'code', value: (x) => or(x.mac) },
      { label: 'Tx / Rx', value: (x) => `${or(x.tx_count ?? x.tx_channels)} / ${or(x.rx_count ?? x.rx_channels)}` },
      { label: 'Rate', value: (x) => (x.sample_rate ? `${x.sample_rate} Hz` : '—') },
      { label: 'Clock', value: (x) => or(x.clock_role) },
      { label: 'Flows', value: (x) => String(x.flow_count ?? 0) },
    ] },
  { key: 'ptp', icon: '⏱', name: 'PTP clocks',
    what: 'Clocks heard on the wire (319/320), leaders first.',
    rows: (d) => (d.ptp_clocks || []).slice().sort((a, b) => (a.role === 'leader' ? 0 : 1) - (b.role === 'leader' ? 0 : 1)),
    live: (c) => c.alive && !c.dying,
    dead: (g) => g.kind === 'ptp' || g.kind === 'ptp-plugin' || g.protocol === 'ptp',
    cols: [
      { label: 'Clock identity', kind: 'code', value: (c) => or(c.clock_identity) },
      ttlCol,
      { label: 'Role', value: (c) => or(c.role) },
      { label: 'Domain', value: (c) => or(c.domain) },
      { label: 'Profile', value: (c) => or((c.detail && c.detail.profile) || (c.version != null ? `v${c.version}` : '')) },
      { label: 'From', kind: 'code', value: (c) => or(c.source_ip) },
      { label: 'Last announce', value: (c, x) => ago(c.last_announced, x.now) },
    ] },
  { key: 'aoip', icon: '📻', name: 'AES67 / RAVENNA',
    what: 'Audio-over-IP streams — SAP announcements and RAVENNA RTSP descriptions.',
    rows: (d) => d.sdp_sessions || [], live: (s) => !!s.live,
    dead: (g) => ['ravenna', 'sap'].includes(g.kind) || ['ravenna', 'sap'].includes(g.protocol),
    cols: [
      { label: 'Session', kind: 'strong', value: (s) => or(s.session) },
      { label: 'Status', kind: 'pill', state: (s) => (s.live ? 'good' : 'dead'), value: (s) => (s.live ? 'live' : 'silent') },
      { label: 'Host', value: (s) => or(s.host) },
      { label: 'Format', value: (s) => or(s.format) },
      { label: 'Destination', kind: 'code', value: (s) => `${or(s.destination)}:${or(s.rtp_port)}` },
      { label: 'Clock', value: (s) => or(s.clock) },
      { label: 'Via', value: (s) => or(s.via) },
      { label: 'Last seen', value: (s, c) => ago(s.last_seen, c.now) },
    ] },
  { key: 'mdns', icon: '📡', name: 'mDNS services',
    what: 'Services announced over mDNS, and which plugin claims them.',
    rows: (d) => d.mdns_services || [], live: (s) => s.alive && !s.dying,
    dead: (g) => g.kind === 'mdns',
    cols: [
      { label: 'Service', kind: 'strong', value: (s) => or(s.device_name) },
      ttlCol,
      { label: 'Type', kind: 'code', value: (s) => or(s.service_type) },
      { label: 'Plugin', value: (s) => or(s.plugin_token) },
      { label: 'From', kind: 'code', value: (s) => or(s.source_ip) },
      { label: 'Last seen', value: (s, c) => ago(s.last_seen, c.now) },
    ] },
  { key: 'graveyard', icon: '💀', name: 'Graveyard', graveyard: true,
    what: 'What went silent past its TTL, most recent first.',
    rows: (d) => d.deaths || [], live: () => false,
    cols: null,   // GRAVE_COLS
  },
];

/** The graveyard's columns, for its own tab and for each tab's dead below it. */
export const GRAVE_COLS = [
  { label: 'What', kind: 'strong', value: (x) => or(x.label || x.id) },
  { label: 'Status', kind: 'pill', state: () => 'dead', value: () => 'dead' },
  { label: 'Protocol', value: (x) => or(x.protocol || x.kind) },
  { label: 'Address', kind: 'code', value: (x) => or(x.ip) },
  { label: 'Why', kind: 'dim', value: (x) => or(x.reason) },
  { label: 'Died', value: (x, c) => ago(x.died_at, c.now) },
];
TABS.find((t) => t.graveyard).cols = GRAVE_COLS;

/** A tab's count line for the side list: up of total, or the dead. */
export function tabCount(tab, data, ctx) {
  const rows = tab.rows(data);
  if (tab.graveyard) return { up: 0, total: rows.length, text: String(rows.length), state: rows.length ? 'dead' : 'none' };
  const up = rows.filter((r) => tab.live(r, ctx)).length;
  return { up, total: rows.length, text: `${up}/${rows.length}`, state: up ? 'good' : 'none' };
}

/** The deaths that belong to one tab (shown under it). */
export function deathsFor(tab, data) {
  return tab.dead ? (data.deaths || []).filter(tab.dead) : [];
}

/** One table row as plain values, column by column — what APKTable sorts, filters and copies. */
export function rowValues(cols, row, ctx) {
  const out = {};
  cols.forEach((c, i) => {
    let v = '—';
    try { v = c.value(row, ctx); } catch (_) { v = '—'; }
    out[`c${i}`] = v;
  });
  return out;
}

/** The engine's one-line summary: up, last sweep, sweep number, host IPs. */
export function engineLine(e, now) {
  return [
    `up ${dur(e.uptime_secs)}`,
    e.last_sweep_at ? `last sweep ${ago(e.last_sweep_at, now)}` : null,
    e.sweep_count != null ? `sweep #${e.sweep_count}` : null,
    (e.host_ips || []).length ? `host ${e.host_ips.join(', ')}` : null,
  ].filter(Boolean).join(' · ');
}

/** Where the engine answers: ?engine=<url>, else config `engine_url` with {host} = this page's host. */
export function engineUrl(search, cfg, loc) {
  const asked = new URLSearchParams(search || '').get('engine');
  const host = (loc && loc.hostname) || '127.0.0.1';
  const proto = loc && loc.protocol === 'https:' ? 'https' : 'http';
  const url = asked || String((cfg && cfg.engine_url) || '').replace('{host}', host).replace('{proto}', proto);
  return url.replace(/\/$/, '');
}
