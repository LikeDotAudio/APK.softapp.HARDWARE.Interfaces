# HARDWARE.Interfaces

**Wiki:** [Documentation/README.md](Documentation/README.md) — principles, architecture, delivery.

Every interface the discovery engine has found, and the state it is in now — plugins, instruments, network hosts, serial ports, USB, MIDI, Dante, PTP clocks, AES67/RAVENNA, mDNS services and the graveyard — as an app on the softapp SDK.

| | |
|---|---|
| **Opens** | the OS shell's **Interfaces** window (Pipeline → 06b · Interfaces), or `index.html` on its own |
| **Reads** | `GET {engine}/api/status` (POD.THICK/DISCOVERY.Engine), every `refresh_ms` |
| **Writes** | `POST {engine}/api/kick` — kick a stopped plugin alive |
| **SDK** | `vendor/apk-softapp` (fetchJson, showProblem, describe, inheritTheme), `vendor/apk-table` (every table), `vendor/apk-contracts` (the presence rule, the state tokens) |
| **Tunables** | `config/interfaces.json` — `engine_url`, `refresh_ms`; `?engine=<url>` overrides |
| **Build** | none — plain ES modules; `npm test` (node's own runner) |

<!-- wiki:smoke -->
<!-- /wiki:smoke -->
