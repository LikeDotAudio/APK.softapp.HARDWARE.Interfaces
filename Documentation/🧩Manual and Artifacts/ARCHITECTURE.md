# Architecture — HARDWARE.Interfaces

← [Manual and Artifacts](INDEX.md)

| File | What |
|---|---|
| `index.html` | the frame: header, engine line, the tab list, the table, the per-tab graveyard; loads the SDK then `js/app.js` |
| `js/tabs.js` | pure: the ten tabs and their columns (`TABS`, `GRAVE_COLS`), counts, the deaths that belong to a tab, the engine line, where the engine is |
| `js/app.js` | the DOM: draws the tabs and tables with APKTable, reads `/api/status`, kicks a plugin, says problems, describes itself |
| `css/interfaces.css` | layout only; colours from the SDK tokens (`--apk-accent`, `--apk-state-*`) |
| `config/interfaces.json` | `engine_url` (`{proto}://{host}:8120`), `refresh_ms` |
| `vendor/` | `apk-contracts`, `apk-softapp`, `apk-table` — vendored copies of the SDK |
| `tests/tabs.test.mjs` | the tabs against a recorded `/api/status` shape, and the MIDI presence rule against the contract's vectors |

## Data

```
GET  {engine}/api/status   engine, plugins, roster, ping_hosts, serial{ports,usb,last_scan},
                           midi.ports, dante.devices, ptp_clocks, sdp_sessions, mdns_services, deaths
POST {engine}/api/kick     {service} → {kicked, note}
```

## In the OS

`PODS/POD.THIN/OS/Interfaces/display.json` keeps the window (id `Interfaces`, its menu place and topic) and points it here with `app` + `launcher`. The hand-run `APK-Shop/` frames stay in that OS folder: the Clock pane, the drawing build and BIG PICTURE's SHOP_NIC Terminals pairing read them by path.
