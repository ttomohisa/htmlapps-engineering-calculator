# Engineering Calculator

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-engineering-calculator/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-engineering-calculator/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-engineering-calculator/)

[日本語版 README](README.ja.md)

A privacy-focused, single-HTML engineering calculator for common mechanical design, manufacturing, fluid, thermal, electrical, tolerance, and unit-conversion work.

## 🚀 Live demo

### [Open Engineering Calculator on GitHub Pages](https://ttomohisa.github.io/htmlapps-engineering-calculator/)

GitHub Pages delivers the initial HTML. After it loads, calculations, favorites, history, parameter sweeps, graphing, and CSV generation are processed locally in your browser. The app does not send entered values to a server during runtime.

[![Engineering Calculator screenshot](assets/screenshot.png)](https://ttomohisa.github.io/htmlapps-engineering-calculator/)

## Features

- **80 engineering calculations in one workbench** — Mechanical basics, rotation and power, bolts, shafts, beams, gears, springs, bearings, fluids, thermal, electrical, tolerances and fits, and unit conversion.
- **Find a calculation quickly** — Search by Japanese/English terms, browse categories, or jump from favorites and recent history. `Ctrl / ⌘ + K` or `/` focuses search, and `↑` / `↓` / `Enter` selects results.
- **Work directly in practical units** — Change input and output units without running a separate conversion step.
- **Keep assumptions close to the result** — A short assumption/note stays visible under results, with the full formula and scope available on demand.
- **Use representative material presets** — Insert typical steel, stainless steel, aluminum alloy, copper, and brass properties into supported calculations.
- **Check sections, fits, and bolts** — Includes section-property helpers, tolerance/fit analysis, M3–M24 metric-coarse bolt helpers, and an ISO 286 H7/g6 helper preset for 1–500 mm.
- **Sweep a condition and graph the result** — Vary one numeric input over 11, 21, or 51 points using ±10%, ±20%, ±50%, 0.5–2×, or manual ranges and plot a selected result with a native SVG graph.
- **Copy results or sampled data** — Copy an individual result, full calculation conditions, or parameter-sweep data as CSV.
- **Share conditions explicitly** — Copy a URL-fragment link containing the current calculator, values, and units without uploading them to a server. Normal category/calculator navigation also works with browser Back/Forward.
- **Control display precision** — Choose automatic formatting or 3 / 4 / 6 significant digits without changing internal calculation precision.
- **Make restored inputs visible** — When saved inputs are restored for the first time in a session, the app says so and offers an immediate reset to defaults.
- **Private, single-HTML operation** — No third-party runtime dependency, Japanese/English UI, direct `file://` support, and no runtime network requests.

Numeric fields must contain a valid number; a blank field is never treated as zero. Results, copying, sharing, and graphs resume automatically when invalid inputs are corrected, including after reload. Zero and negative values remain supported where the calculation allows them.

Manual sweep start/end values are preserved while typing. Blank or equal bounds show a range error and suspend both graph and CSV until corrected; selecting a preset explicitly replaces the range.

## Quick start

### Use the web demo

Just [open the demo](https://ttomohisa.github.io/htmlapps-engineering-calculator/). No installation or account is required.

### Use the standalone HTML

1. Download [`dist/index.html`](https://github.com/ttomohisa/htmlapps-engineering-calculator/blob/main/dist/index.html).
2. Open it directly in a current browser.
3. Search for a calculation or choose a category and start entering values.

### Build the standalone files locally

1. Download or clone this repository.
2. Double-click `build-standalone.bat` on Windows.
3. Use `dist/index.html` for the readable standalone build, or `dist/index.self-extract.html` for the smaller self-extracting build.

Python, Node.js, and a local web server are not required for the build.

## Usage

1. Search by calculation name, engineering term, or unit, or choose a category from the left sidebar on desktop / the Find tab on mobile. On desktop, `Ctrl / ⌘ + K` or `/` focuses search.
2. Open a calculator and enter the required values. Results update immediately.
3. Change units from the selectors beside inputs or results when necessary.
4. Read the short **Assumption / note** under the results, then open **Formula & assumptions** when you need the full equation and scope.
5. Star frequently used calculators to keep them in Favorites.
6. Use **Copy conditions** when you want the inputs and results together.
7. Use **Copy condition link** when you intentionally want to share the current values and units with someone else.
8. Open **Parameter sweep & graph** to vary one numeric input over a range and inspect the trend. The default range is ±20% around the current value, with other presets and manual entry available. Sampled values can be copied as CSV.
9. Use the header display settings to change significant digits. Browser Back/Forward returns to prior categories and calculators.

### Materials

Material presets insert representative values only. They are intended to reduce repetitive typing, not to replace material certificates, applicable standards, or manufacturer data.

### Tolerances and fits

The tolerance/fit tools calculate limits, clearance/interference, and fit classification from nominal dimensions and upper/lower deviations. Deviations can be entered manually, or the **ISO 286 H7 hole / g6 shaft** helper can fill them for nominal sizes from 1 to 500 mm. Always confirm the drawing and applicable standard before final use.

### Bolt size presets

Bolt calculators can select M3–M24 metric-coarse sizes. Calculators that use nominal diameter receive the diameter; calculators that use stress area receive a tensile stress area `As` calculated from nominal diameter and pitch. If a shear plane crosses the plain shank or another effective area applies, switch back to manual entry.

### Parameter sweeps

A parameter sweep keeps all inputs except one at their current values. The initial range is **±20%** around the current input. Choose ±10%, ±20%, ±50%, 0.5–2×, or manual start/end values, plus 11 / 21 / 51 samples and the result to plot. Axis units follow the currently selected input/output units.

## Publish with GitHub Pages

The repository includes a workflow that builds the standalone HTML and deploys `dist/` to GitHub Pages automatically.

1. Push the repository to GitHub as `htmlapps-engineering-calculator`.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Push to `main`, or manually run **Deploy standalone app to GitHub Pages** from the Actions tab.
4. After a successful deployment, the demo is available at `https://ttomohisa.github.io/htmlapps-engineering-calculator/`.

The workflow runs the repository checks, rebuilds the standalone HTML, verifies the generated artifacts, and publishes the result.

## Regression checks

Node.js 18+ is required for `scripts/check-repository.ps1`, which runs dependency-free calculator regressions against source and the rebuilt readable HTML. To run only the behavioral tests: `node --test tests/calculator-input-recovery.test.mjs`. After rebuilding, refresh the root download with `Copy-Item dist/index.html engineering-calculator.html`; it must match the generated readable release byte-for-byte.

## Development and build layout

```text
.
├─ src/index.template.html        # Application source template
├─ app.config.json                # App metadata and build settings
├─ dependencies.json              # Pinned runtime dependencies (currently none)
├─ build-standalone.bat           # Windows build entry point
├─ build-standalone.ps1           # Standalone HTML builder
├─ scripts/                       # Validation and self-extract build scripts
├─ docs/FORMULA_REFERENCES.md     # Formula references and notes
├─ dist/index.html                # Readable standalone artifact
└─ dist/index.self-extract.html   # Self-extracting standalone artifact
```

Edit `src/index.template.html`; do not edit generated files under `dist/` manually.

## Privacy and runtime network protection

The generated HTML includes a Content Security Policy with `connect-src 'none'`. During normal use:

- Entered values are calculated in the browser.
- Favorites, recent calculators, and saved input states are stored locally in browser storage.
- Parameter sweeps and graphs are generated locally.
- No analytics or telemetry is included.
- A condition-sharing link is created only when you explicitly request it. Its URL fragment contains the current values and units, so anyone receiving that link can inspect those conditions.

The GitHub Pages version requires the initial HTML request. For use with the network disconnected, open `dist/index.html` locally.

## Limitations

- Results are general engineering calculations and are not a substitute for applicable standards, certified design procedures, safety reviews, or legal requirements.
- Material presets are representative values and may not match a specific grade, heat treatment, temperature, or supplier specification.
- The H7/g6 helper covers ISO 286 H7 hole / g6 shaft input for nominal sizes from 1 to 500 mm. It does not choose other fit classes, tolerance grades, or standards for you.
- Bolt size presets cover M3–M24 metric-coarse sizes and tensile stress area assistance. They do not determine property class, complete thread geometry/tolerance, joint stiffness, or interface conditions.
- Bearing factors, allowable stresses, friction coefficients, pipe roughness, and similar application-specific values may require manufacturer or project data.
- Beam, spring, bolt, fluid, and thermal calculations use the assumptions described in each calculator. Confirm that those assumptions fit the actual design.
- Parameter sweeps show numerical trends for the selected formula; they do not perform optimization, uncertainty analysis, FEA, CFD, fatigue assessment, or automatic code compliance checks.

## Dependencies

The application currently uses **no third-party runtime libraries**. Calculation logic, SVG diagrams, SVG graphs, search, storage, sharing, and CSV generation are implemented in the standalone HTML.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [docs/FORMULA_REFERENCES.md](docs/FORMULA_REFERENCES.md) for additional notices and formula references.

## Contributing

Bug reports and feature proposals are welcome through GitHub Issues. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance.

## License

Copyright © 2026 ttomohisa

Licensed under the [MIT License](LICENSE).
