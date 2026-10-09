# APP_SPEC.md — Engineering Calculator

## 1. Product identity

- **Name:** Engineering Calculator
- **Version:** 1.0.3
- **Purpose:** Mechanical design and manufacturing calculations that are too small to justify opening a spreadsheet, gathered into one fast local browser workbench.
- **Primary users:** Mechanical designers, manufacturing engineers, technicians, students, researchers, and anyone doing quick engineering checks.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. Problem and outcome

Engineering work repeatedly requires small calculations such as shaft torque, beam deflection, Reynolds number, gear ratio, three-phase power, or unit conversion. These are often scattered across old spreadsheets, desktop utilities, handbooks, and web pages. The app provides a searchable, consistent workbench that runs locally without sending entered values outside the browser.

A successful session is: search or browse → choose a calculation → enter values with units → inspect results and formula → copy the result or conditions, or download a calculation note.

## 3. v1.0.0 scope

- 80 calculators across mechanical basics, rotation, bolts, shafts, beams, gears, springs, bearings, fluids, thermal, electrical, tolerances/fits, and units.
- Common parameter sweeps for all registered calculators with numeric inputs/results: choose one input, ±10% / ±20% / ±50% / 0.5–2× / manual range, 11/21/51 samples, and one result to plot. The initial range is ±20% around the current input.
- Native inline SVG graphs with unit-aware axes, current-condition marker, minimum/maximum/current summaries, and CSV copy.
- Japanese/English search aliases and category browsing, with `Ctrl/Cmd + K` or `/` focus plus arrow-key/Enter result selection.
- Favorites and recent calculators stored locally.
- Per-calculator input persistence stored locally, with an explicit restoration notice on first open in a session and a one-click reset to defaults.
- Unit-aware inputs and unit-selectable results.
- A concise main assumption/note visible beside results plus full formula and variable definitions for every calculation.
- Simple diagrams for beam, section, gear, spring, bearing, pipe, and thermal calculations where useful.
- Representative material presets for Young modulus, shear modulus, density, and thermal expansion where relevant.
- Section-shape helpers for solid round, hollow round, rectangular tube, and symmetric I-sections.
- Tolerance/fit tools based on user-entered deviations plus a compact ISO 286 H7/g6 helper table for nominal sizes 1–500 mm; manual entry remains available.
- Stronger bolt tools for shear, combined stress, elastic elongation, and preload variation, plus M3–M24 metric-coarse diameter / tensile stress-area helper presets.
- Standard spur-gear geometry, contact-ratio, and rack-travel helpers.
- Compression-spring rate, force/deflection, Wahl-stress, solid-height, and energy calculations.
- Bearing L10 life, required dynamic rating, equivalent dynamic load, and static load ratio calculations.
- Darcy–Weisbach pipe pressure loss and inverse flow-from-pressure-loss tools with regime-aware friction-factor handling.
- Bidirectional flat-wall Fourier conduction plus composite-wall and cylindrical-wall conduction.
- Explicit condition-sharing links that encode only the selected calculator state, including sweep settings, in the URL fragment.
- Copy a single result or the full calculation conditions.
- Download the current valid calculation as a UTF-8 plain-text `.txt` note with an editable filename, active inputs/units, exactly displayed results, display precision, localized formula/full assumptions, and the existing engineering caution. No sweep attachment, new calculation, import, or history is added.
- Safe localized quick expression calculator without `eval()`.
- User-selectable automatic / 3 / 4 / 6 significant-digit display formatting.
- Browser Back/Forward navigation across home, categories, and calculators.
- Smartphone bottom navigation with three destinations: Calculate / Find / Favorites.

## 4. Core user flow

1. Open the app through `file://` or static hosting.
2. Search by name, synonym, symbol, or category, or browse categories.
3. Open a calculator.
4. Enter values and choose units; valid results update immediately.
5. Change result units as needed.
6. Optionally open the parameter-sweep panel, use the default ±20% range or another range preset/manual range, choose an output, and inspect the graph or copy the sampled CSV.
7. Inspect the formula/assumptions and copy a result or all conditions, or edit the calculation-note filename and download the current note.
8. Favorite calculators for repeated use; recently used calculators appear automatically.

## 5. Data and privacy

- No runtime network request, analytics, telemetry, account, or server-side storage.
- Entered values, favorites, history, and language preference remain in browser storage.
- Clipboard write and calculation-note file download occur only after a user action. Downloaded notes contain the current inputs and results; share the file only with intended recipients.
- Filename drafts are session-only per calculator, survive redraw and calculator switching, and are not stored or included in condition links. The extension is always `.txt`; unsafe names are sanitized with a nonempty default.
- Download feedback means initiation only. The browser controls completion and destination; temporary anchors and Blob URLs are released.
- Normal navigation stores only the selected calculator ID in the URL hash.
- When the user explicitly chooses condition sharing, the copied URL fragment contains the selected calculator inputs, units, output units, material/helper metadata, and parameter-sweep settings. No server is involved.
- Anyone who receives a condition-sharing URL can inspect the encoded calculation values, so the UI discloses this before/alongside sharing.

## 6. Safety and interpretation

- Results are engineering calculations, not a substitute for applicable standards, certified design review, manufacturer limits, material certificates, safety factors, or statutory requirements.
- Default sample values are examples, not recommended design values.
- Formula notes explicitly identify simplified models such as ideal beams, incompressible flow, or estimated bolt torque/preload.
- v1.0.0 includes only a narrow ISO 286 H7/g6 helper dataset for 1–500 mm. It is an input aid, not a complete tolerance-grade database or substitute for the applicable standard/drawing.
- Bolt size presets use common metric-coarse nominal diameter/pitch and tensile stress-area assistance; they do not select property class or validate joint design.
- Material presets are representative broad-family values and are never presented as certified grade data.

## 7. UX and accessibility

- The supplied 64×64 rounded green SVG in `assets/favicon.svg` is shared exactly by the header and embedded favicons in every generated release variant.

- Light-only Browser Kitty visual language with accent `#16624F`.
- Desktop: browse/sidebar + calculator workbench.
- Smartphone: true page tabs for Calculate / Find / Favorites; no long desktop sidebar stacked above the calculator.
- SVG icons only for primary interface iconography.
- Visible focus, labels, keyboard access, sufficient contrast, `aria-live` result status, reduced-motion support, keyboard-first search, and browser history navigation.
- Invalid or impossible values show inline messages without modal interruption. Blank/whitespace numeric fields are invalid, not zero; an explicitly entered zero or negative value remains valid where the formula permits it. Hidden solve-target fields are not required. Non-finite results are unavailable.
- Result copy, condition copy/share, calculation-note download, and sweeps are available only for the current valid calculation. They recover immediately after correction, including after reload with invalid saved inputs, without replacing the edited numeric input.
- Manual sweep bounds remain exactly as entered, including intermediate blank/equal values. These invalid bounds show an error and suppress the graph and CSV; initialization only supplies missing bounds, and explicit presets can replace them.
- Clipboard fallback failures (including exceptions) remove temporary textareas and show localized failure feedback. Retrying remains possible; fallback restores the still-connected control focused immediately before fallback without reverting newer user focus.
- The header shows the target language as EN / JA, with localized title and accessible label (`英語に切り替え` / `Switch to Japanese`). Privacy and Help remain available in both languages.
- Changing language preserves quick-expression input and refreshes its result/error text, including invalid-to-valid recovery.
- Resetting a calculator is reversible with the canonical Toast + Undo pattern.

## 8. Browser target

Current stable Chromium, Firefox, and Safari on desktop and smartphone. Direct `file://` opening is required. Clipboard fallback is provided where possible.

## 9. Performance

- No third-party runtime dependency.
- Calculator switching and input updates should be immediate on ordinary smartphones.
- A 51-point parameter sweep should update without noticeable lag for the included calculator formulas.
- Search should filter the full calculator registry on every keystroke without noticeable lag.

## 10. Acceptance criteria

- Both release HTML files are generated and fully self-contained.
- No unresolved build placeholder or external runtime resource remains.
- CSP contains `connect-src 'none'`.
- Exactly 80 registered calculator entries are searchable in the planned initial release.
- Every registered calculator exposes the common parameter-sweep panel when its default state yields at least one numeric result.
- Sweep controls retain focus while range values are edited, and the graph updates without replacing the active range input. Equal/blank bounds remain unchanged through redraw/reload; corrected bounds drive both graph and CSV.
- Temperature blank → 0 → negative → blank transitions never expose stale results; explicit 0°C gives 32°F and 273.15K.
- Saved blank RPM → reload → 60 RPM with 1 kW restores torque (159.15494309189535 N·m), copy/share, and sweep actions. 1000 W yields the same result.
- Every calculator can render, accept inputs, validate, calculate, and show a formula without a JavaScript exception.
- Favorites, recent history, language, and per-calculator values survive reload when localStorage is available.
- Search works with Japanese and English aliases, `Ctrl/Cmd + K`, `/`, arrow-key result selection, and Enter.
- Mobile navigation has exactly three concise destinations and only one active mobile page at a time.
- Saved input restoration is visibly disclosed on first calculator open per page session when prior local state exists.
- H7/g6 helper values and M3–M24 bolt presets match their documented reference checks.
- Japanese/English notes include every displayed numeric or descriptive result and full existing formula/assumption/caution text for all 80 calculators. Selected output units and auto/3/4/6 precision match the result display exactly. Hidden solve-target inputs are omitted.
- Blank/non-finite/overflow states and detached old download actions produce no file; correction restores the download without replacing the active numeric input. Repeat downloads use the current state.
- Edited Unicode filenames survive redraw, settings changes, and calculator switching, normalize repeated `.txt` suffixes, and never leak into persisted/share state. Failed download initiation cleans temporary resources and remains retryable.
- Modern clipboard success, denied/absent API, fallback success/false/throw, and every copy action report the correct outcome without leaked nodes or unhandled rejections.
- Help content describes the actual engineering workflow, privacy boundary, and calculation limitations.

## 11. Initial release milestone

v1.0.0 is the first public release. It consolidates the staged pre-release development work into one release: the 80-calculator registry, material/section/fit/bolt helpers, gear/spring/bearing/fluid/thermal expansions, parameter sweeps and SVG graphs, plus the final usability and safety polish.
