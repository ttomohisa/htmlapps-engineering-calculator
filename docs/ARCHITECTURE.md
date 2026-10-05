# Architecture

## Overview

The repository separates editable source from the release artifact:

```text
app.config.json              Product metadata
APP_SPEC.md                  Product behavior and acceptance contract
dependencies.json            Exact npm packages and files to embed
components/                   Reusable source snippets copied/adapted into apps
src/index.template.html      Editable application source
build-standalone.ps1         Dependency fetch, hash, embed, and build
scripts/verify-standalone.ps1 Static release checks
dist/index.html              Generated readable release artifact
dist/index.self-extract.html Generated gzip self-extracting artifact
dist/build-size-report.json    Generated size and embedded-asset storage report
```

`dist/index.html` and `dist/index.self-extract.html` are generated and must not be edited manually.


## Reusable component layer

`components/` contains reusable source snippets for common UI and connection patterns. These files are not loaded at runtime and are not a separate bundle layer. An app copies or adapts the needed CSS, HTML, and JavaScript into `src/index.template.html`, preserving the one-file runtime model. Most components are dependency-free; dependency-aware components use the same pinned embedded-asset pipeline as the rest of the app.

The repository retains the reusable component library supplied by the Browser Kitty template. Engineering Calculator adapts the toast/status patterns and mobile bottom navigation directly into its single source HTML; unused component snippets are not loaded at runtime. See `docs/COMPONENTS.md` / `docs/COMPONENTS.ja.md` for the shared component maintenance rules.

## Build pipeline

1. Read `app.config.json` and `dependencies.json`.
2. Resolve each exact npm version through the npm registry.
3. Cache and extract each tarball.
4. Validate the package's own version.
5. Read only the explicitly listed asset files.
6. Calculate SHA-256 hashes for the package tarball and every original embedded asset.
7. Optionally gzip each declared asset (`gzip` / `auto`), then Base64-encode the stored bytes exactly once.
8. Embed the asset bundle JSON directly, avoiding a second Base64 wrapper around the whole bundle.
9. Replace the three source placeholders exactly once.
10. Write and verify `dist/index.html`.
11. Gzip that HTML, embed it into a small ASCII-only native `DecompressionStream` loader, inherit the readable HTML favicon, and write `dist/index.self-extract.html`.
12. Verify that the loader stays ASCII-only and embedded-only, the favicon matches the readable HTML, and the gzip payload restores byte-for-byte.
13. Write manifests, `build-size-report.json`, and `dist/.nojekyll`; emit warning-only size-budget messages when configured thresholds are exceeded.
14. Reject the declared unresolved build placeholders and common external runtime resource references.

## Build placeholders

The source template contains exactly one of each:

- `__APP_CONFIG_JSON__`
- `__BUILD_MANIFEST_JSON__`
- `__EMBEDDED_ASSET_BUNDLE_JSON__`

Do not rename or duplicate them without changing the builder and verifier. Other runtime identifiers that happen to use a `__NAME__` convention are allowed and must not be rejected as build placeholders.

## Embedded asset API

The generated page exposes `window.StandaloneAssets`:

```js
StandaloneAssets.list();
StandaloneAssets.has('library-id', 'asset-key');
StandaloneAssets.bytes('library-id', 'asset-key'); // uncompressed only
await StandaloneAssets.bytesAsync('library-id', 'asset-key'); // compressed or uncompressed
StandaloneAssets.text('library-id', 'asset-key'); // uncompressed only
await StandaloneAssets.textAsync('library-id', 'asset-key');
StandaloneAssets.blobUrl('library-id', 'asset-key'); // uncompressed only
await StandaloneAssets.blobUrlAsync('library-id', 'asset-key');
await StandaloneAssets.loadClassicScript('library-id', 'main', 'ExpectedGlobal');
const module = await StandaloneAssets.importModule('library-id', 'main');
```

Blob URLs are revoked after script/module loading and on page exit. Gzip assets are expanded with native `DecompressionStream` and cached in memory after first use.

### Important limitation

`importModule` does not rewrite relative imports inside a module. Choose a self-contained browser bundle, list every required file and implement a package-specific loader, or bundle the library before embedding.

## Engineering Calculator state extensions

The v1.0.0 app keeps material presets, metric-coarse bolt helper data, the narrow ISO 286 H7/g6 helper dataset, and calculator definitions directly in the single source HTML. Material values are broad representative values, not grade-certified data. Calculators opt into material properties through explicit `materialTargets` mappings. Bolt and fit helpers remain optional: users can always return to manual entry.

Condition sharing is explicit and local: a compact JSON payload for one calculator is Base64URL-encoded into the URL fragment only when the user presses the share action. Normal navigation uses compact `#calc=…`, `#category=…`, and `#home` routes so browser Back/Forward works without storing calculation values in navigation history. Incoming shared state is imported into local calculator state, then normal navigation resumes. No network request is used for encoding, decoding, or loading a shared condition.

Parameter sweeps are implemented as a common runtime layer over the calculator registry rather than as calculator-specific chart code. A shared range preset layer derives ±10%, ±20% (default), ±50%, or 0.5–2× bounds from the active input before falling back to manual start/end entry. The sweep layer clones the active calculator state, varies one raw input value in its currently selected unit, runs the existing calculator function for each sample, converts the selected numeric output into the currently selected result unit, and renders the points as inline SVG. It never mutates the live calculation inputs while sampling. Sweep settings live under the calculator state metadata and therefore persist locally and participate in explicit condition sharing.

## Numeric validity and result recovery

A shared calculation outcome validates active numeric inputs and finite outputs before initial rendering, recomputation, or condition export. Blank text is distinct from explicit zero. Solve-target fields remain exempt while hidden. Result-action and sweep containers exist even when a saved calculation is invalid, so recomputation can restore them without replacing input fields.

Sweep initialization fills absent bounds only. Manual blank/equal bounds are retained in state and validated by the sampling layer; invalid ranges clear the graph and CSV. Range edits update the graph region only, keeping the active input and its focus intact. The Node regression harness executes the application runtime with a small DOM boundary; browser QA covers native number input behavior and clipboard/layout.

## Calculation-note output

Calculation notes reuse the current `calculationOutcome`, common input-condition labels, and `displayResult`; no parallel numeric formatter or calculator is introduced. The note is assembled at click time, and detached download controls cannot export an old render. A per-calculator session-only filename map is separate from persisted calculator metadata and the condition-sharing schema. Names are sanitized to a bounded UTF-8 filename ending in one `.txt` extension.

Download URLs are kept only until the browser has had time to consume them (or until page exit), with immediate cleanup on initiation failure. Temporary anchors are always removed. Clipboard fallback protects selection/copy with cleanup and failure feedback, restoring the still-connected control focused just before fallback. The shared regression harness executes the actual source/readable/restored self-extract application runtime at stubbed browser boundaries; it does not claim native browser coverage.

## Runtime security boundary

Engineering Calculator's Content Security Policy blocks fetch/XHR/WebSocket-style runtime connections with `connect-src 'none'`. It also blocks frames, objects, forms, and external base URLs. Inline CSS and JavaScript are allowed because the release is intentionally one HTML document. v1.0.0 has no runtime third-party asset and no intentional peer-to-peer connection.

Static scanning is a guardrail, not a proof. Browser developer tools should still be used to verify that the generated app makes no unexpected request.

## Large applications

Keep source in one HTML while it remains understandable. When an app grows substantially, development files may be split under `src/` and assembled by the build script. Preserve these properties:

- Two generated one-file release variants.
- Pinned and auditable dependencies.
- No runtime external resource.
- Clear state ownership.
- A build that fails on missing input.
