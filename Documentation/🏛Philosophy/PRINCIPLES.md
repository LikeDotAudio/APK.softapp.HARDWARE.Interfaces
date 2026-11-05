# Principles — HARDWARE.Interfaces

The rules this app keeps, each with the code that keeps it. Ecosystem rules live in the APK.audio root `Documentation/🏛Philosophy/`; cited here, not copied.

← [Philosophy](INDEX.md)

| Principle | Kept by |
|---|---|
| **An app, on the SDK — not a page in the shell.** It carries its own copy of the shared client, table and contracts and runs alone or framed; inside the OS it wears the shell's tokens. | `index.html` (the SDK scripts, in the order `apk-softapp.js` states); `vendor/` held byte-identical by `.apk.scripts/vendor_shared_web.py --check` and `vendor_contract_web.py`; `APKSoftapp.inheritTheme()` in `js/app.js` |
| **Thin over the thick engine.** Nothing is hand-built and nothing is a snapshot: every row is the discovery engine's own answer to `/api/status`, re-read every `refresh_ms`. | `refresh()` in `js/app.js`; `TABS[].rows` in `js/tabs.js` |
| **What it shows is data.** Each tab is where its rows are in the answer, which count as up, its columns and its dead. | `TABS`, `GRAVE_COLS`, `tabCount`, `deathsFor` in `js/tabs.js`; `tests/tabs.test.mjs` |
| **Every table is the one table.** Cells are text; a pill, code or the Kick button is a Node the app builds; sort, search, CSV and Copy come with it. | `APKTable.create` in `table()` (`js/app.js`) |
| **Three states, the contract's words.** good / kinda / dead, coloured by the SDK's state tokens; a MIDI port's word is the contract's presence rule, and `unknown` — never online — without one. | `ttlState`, `midiWord` (`js/tabs.js`); `[data-apk-state]` in `css/interfaces.css`; every vector of `contracts/vectors/discovery_presence.json` in `tests/tabs.test.mjs` |
| **A failure is said: what happened, why, do this.** No engine answer is a problem card with Retry, and the header says nothing below is current. | `APKSoftapp.fetchJson` + `showProblem` in `refresh()` and the Kick button |
| **The app says what it is.** Its inputs, outputs, controls and the problems it can hit are on its ? button (F1). | `APKSoftapp.describe` in `start()` |
| **Tunables are data.** Where the engine answers and how often it is read live in `config/interfaces.json`, never a port in source. | `engineUrl()` (`js/tabs.js`) |
