# Delivery — HARDWARE.Interfaces

← [Publishing](INDEX.md)

A submodule of the APK.audio monorepo at `PODS/POD.THIN/Softapps/HARDWARE_AND_NETWORK/HARDWARE.Interfaces`. Static, no build. WEB.Frontend-Assets bakes `Softapps/` into its image: after a change, `npm test`, commit and push here, bump the parent, then `PODS/POD.manager/MANAGER.Docktor/K8/up-stack.sh WEB.Frontend-Assets`. Served at `http://<bench>:8080/Softapps/HARDWARE_AND_NETWORK/HARDWARE.Interfaces/index.html`; the OS window frames the same. Refresh the vendored SDK with `python3 .apk.scripts/vendor_contract_web.py <app>/vendor/apk-contracts` and `python3 .apk.scripts/vendor_shared_web.py <app>/vendor/apk-softapp` (and `apk-table`).
