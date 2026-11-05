# Smoke test — HARDWARE.Interfaces

Is `HARDWARE.Interfaces` deployed? Written by `.apk.scripts/smoke.py` from the module's own shape; what each check means is in that script's header.

← [Wiki home](../README.md)

**❌ FAIL** — 1/3 checks, since 2026-11-04 22:10 EST

| Check | Target | Result | Detail |
|---|---|---|---|
| pushed | origin | ❌ | no upstream branch |
| web | [index.html](https://apk.audio/APK%3ASoftapps/HARDWARE_AND_NETWORK/HARDWARE.Interfaces/index.html) | ❌ | HTTPError: HTTP Error 404: Not Found |
| app | `OS/Interfaces` → `PODS/POD.THIN/Softapps/HARDWARE_AND_NETWORK/HARDWARE.Interfaces/index.html` | ✅ | present |

Re-run: `python3 .apk.scripts/smoke.py PODS/POD.THIN/Softapps/HARDWARE_AND_NETWORK/HARDWARE.Interfaces`

<!-- smoke:sig 2f0272ae9500 since 2026-11-04 22:10 EST -->
