# Osrawy Clinical Navigator - Project Guidelines & Invariants

## 1. Architectural & DOM ID Invariants
- **Never rename or remove established DOM IDs**: The full integration simulation (`run_full_simulation.js`) and cross-tab synchronizers bind directly to element IDs.
  - Critical IDs that must remain intact: `#sticky-vitals-summary`, `#patient-summary-bar`, `#bar-egfr`, `#bar-k`, `#bar-bp`, `#osrawy-soap-fab`, `#osrawy-soap-count`, `#quick-jump-rx-btn`, `#top-more-btn`, `#top-more-menu`, `#market-toggle-btn`, `#btn-open-ldl-modal`, `#save-pt-btn`, `#theme-toggle-btn`, `#open-settings-btn`, `#clinical-guardrail-banner`, `#osrawy-vitals-quick-drawer`.
- When introducing modern layout wrappers (e.g., `.patient-cockpit`, `.osrawy-docked-command-bar`), place the original IDs inside the wrapper rather than inventing new IDs.

## 2. Smartphone Layout & Chrome Math (< 680px)
- **Single-Row Top Navigation Bar**:
  - Keep only 3–4 primary controls on the top row: `.app-brand`, `#lang-toggle-btn` (`🌐 English`/`🌐 عربي`), `#open-drugs-btn` (💊), `#open-recent-btn` (📋), and `#top-more-btn` (`⋮`).
  - Tuck secondary controls (`Market`, `LDL Matrix`, `Save Draft`, `Theme`, `Settings`) into the `#top-more-menu` popover.
  - The top bar must never wrap into a second row on phones (`360px–412px`).
- **Unified Patient Cockpit (`<= 44px`)**:
  - Merge patient identity and vitals into a 2-zone sticky cockpit.
  - Zone 1 (`#patient-summary-bar`): Patient identity must have `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` to accommodate long names without pushing vitals off-screen.
  - Zone 2 (`#sticky-vitals-summary`): Vital chips (`eGFR`, `K+`, `BP`) must not wrap. Tapping must open the Vitals Quick Drawer directly beneath the cockpit.
- **Docked Command Bar (`<= 40px`)**:
  - Wrap bottom floating pills (`#osrawy-soap-fab`, `#quick-jump-rx-btn`) inside `#osrawy-docked-command-bar` pinned directly above the bottom nav.
  - Container must use `pointer-events: none` with `pointer-events: auto` on child buttons to allow click-through on empty central space.
  - Must auto-hide on non-engine tabs (`tab-drugs`, `tab-recent`, `tab-leaflets`), soft-keyboard open (`body.osrawy-keyboard-open`), and patient handoff mode (`body.osrawy-patient-mode`).

## 3. 100% Offline Asset Invariant
- **Zero External CDNs**: The application must run completely offline in hospital/clinic environments.
- All fonts must be bundled locally in `www/fonts/` (`IBM Plex Sans Arabic` and `IBM Plex Mono` in `.woff2` format) and declared via `www/css/fonts.css`.
- Never reintroduce Google Fonts `<link>` tags or external script/font CDN URLs.

## 4. Dark Mode & Contrast Safety
- **QR Code Shield**: Any patient-facing QR code container (`.qr-svg-box`) must be forced to background `#FFFFFF !important` with black SVG fill in all themes (including Dark Mode) so smartphone cameras can scan them.
- **Semantic Variables**: Avoid hardcoded light-mode hex colors (`#FEF2F2`, `#FFFBEB`, `#FDF2F8`). Use semantic theme tokens (`var(--danger-bg)`, `var(--warn-bg)`, `var(--surface2)`, `var(--line)`).

## 5. Verification & Quality Gates
- **Translation Parity**: Every `data-i18n*` attribute in `www/index.html` must have exact matching entries in both Arabic (`ar`) and English (`en`) dictionaries in `www/js/i18n.js`.
- **Pre-Commit Checks**: Always execute and verify:
  1. `node check_js_syntax.js` (13/13 JS files must pass syntax check).
  2. `node run_full_simulation.js` (all 203 clinical simulation assertions must pass).
  3. `npx cap sync android` (Capacitor assets must be kept in sync with `www/`).
- **Version Alignment**: When releasing, ensure version strings in `package.json`, `www/js/updater.js` (`currentVersion`), and `android/app/build.gradle` (`versionName`) match exactly.
