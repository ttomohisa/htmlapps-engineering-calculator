# Changelog

## 1.0.1 - 2026-10-07

- Standardize the header language targets to EN / JA with localized target-language tooltips and accessible labels.
- Refresh quick-expression errors when switching language without changing the entered expression.

## Unreleased

- Add a user-named UTF-8 calculation-note download with current inputs, displayed results/precision, full localized formula/assumptions, and engineering caution; prevent invalid or detached stale exports and release temporary download resources.
- Fix thrown clipboard fallback failures so every copy action reports failure, removes its temporary textarea, preserves current focus, and can be retried.
- Exercise note downloads and clipboard recovery against source, readable, and restored self-extract runtimes without changing the 80 calculators or their numerical behavior.

- Reject blank numeric inputs instead of silently calculating with zero; preserve explicit zero/negative values permitted by each formula.
- Restore copy/share and sweep controls after correcting invalid saved inputs without replacing the active numeric field; suppress non-finite and stale results/exports.
- Preserve manual sweep edits through validation and reload, with a visible error and no graph/CSV for blank or equal bounds.
- Add dependency-free regressions across all 80 calculators and run them against source and generated HTML in the repository check.

## 1.0.0

Initial public release.

- Added 80 engineering calculators across mechanical basics, rotation and power, bolts, shafts, beams, gears, springs, bearings, fluids, thermal, electrical, tolerances/fits, and unit conversion.
- Added Japanese/English search, category browsing, favorites, recent history, keyboard-first search, and browser Back/Forward navigation.
- Added unit-aware inputs/results, representative material presets, section-property helpers, M3–M24 metric-coarse bolt helpers, and an ISO 286 H7/g6 helper preset for nominal sizes 1–500 mm.
- Added common parameter sweeps for all registered calculators, ±10% / ±20% / ±50% / 0.5–2× / manual ranges, 11 / 21 / 51 samples, native SVG graphs, and CSV copy.
- Added visible calculation assumptions, full formula/scope details, configurable significant-digit formatting, and restored-input disclosure with reset/Undo.
- Added condition sharing through URL fragments without a server, plus result/condition copy actions.
- Added smartphone Calculate / Find / Favorites page tabs and desktop category workbench navigation.
- Added standalone readable and self-extracting single-HTML builds with zero third-party runtime dependencies and `connect-src 'none'`.
- Added release documentation for formulas, limitations, privacy, architecture, GitHub Pages deployment, and contribution/security guidance.
- Fixed repository validation so it checks Engineering Calculator behavior instead of requiring the base template's unused text-output filename field.
