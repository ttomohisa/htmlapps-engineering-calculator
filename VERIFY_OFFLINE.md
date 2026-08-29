# Offline Verification

Engineering Calculator is designed to keep calculation data in the browser and to work from the generated single HTML without runtime network access.

## Readable standalone build

1. Run `build-standalone.bat` on Windows.
2. Open `dist/index.html` directly with `file://`.
3. Open browser developer tools, clear the Network and Console panels, then enable offline mode or disconnect the device.
4. Reload the local HTML and confirm the application starts without an external resource error.
5. Verify search, category navigation, Favorites, Recent calculations, Japanese/English switching, display precision, and browser Back/Forward.
6. Open representative calculators from mechanical, bolt, beam, gear, spring, bearing, fluid, thermal, electrical, tolerance/fit, and unit-conversion categories and confirm results update when inputs and units change.
7. Verify the M3–M24 metric-coarse bolt helper and the ISO 286 H7/g6 helper can be switched back to manual input.
8. Open **Parameter sweep & graph**, confirm the default ±20% range, change a range preset, and copy sampled data as CSV.
9. Use **Copy condition link** and confirm the shared state is stored only in the URL fragment. Load that fragment locally and confirm the calculator conditions are restored without a network request.
10. Change a calculation value, reopen the calculator, and confirm restored inputs are visibly indicated and can be reset to defaults.
11. Check the 390 px smartphone layout: only one mobile page is active, the three bottom navigation items remain usable, and there is no horizontal page overflow.
12. Confirm the Network panel contains no runtime HTTP(S), WebSocket, analytics, telemetry, remote font, or CDN request and the Console contains no application error.

For GitHub Pages, one initial request downloads the HTML. After the page has loaded, clear the Network panel and repeat the relevant checks. Entered calculation values must not be transmitted by the application.

## Self-extracting variant

1. Open `dist/index.self-extract.html` directly.
2. Confirm the loading text and favicon render correctly and the loader expands to the same Engineering Calculator UI.
3. Repeat the offline checks above.
4. Confirm no decompression or CSP error appears in the Console.
5. Run `scripts/verify-self-extract.ps1`; it must confirm an ASCII-only loader and byte-for-byte restoration of `dist/index.html`.
