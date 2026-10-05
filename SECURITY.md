# Security Policy

## Supported version

Security fixes target the latest version on the default branch.

## Reporting a vulnerability

Do not publish sensitive vulnerability details in a public issue. Use the repository owner's private security reporting channel when available.

Include:

- Affected commit or version.
- Reproduction steps.
- Expected and actual behavior.
- Security impact.
- Browser and operating system when relevant.

## Engineering Calculator trust model

Engineering Calculator is a static, single-HTML browser application with no backend. Its primary security and privacy boundaries are:

- Runtime network access is blocked by Content Security Policy with `connect-src 'none'`.
- No analytics, telemetry, remote fonts, runtime CDN, API request, WebSocket, or silent update check is used.
- Entered calculation values, Favorites, Recent calculations, display settings, and saved calculator state remain in browser storage.
- **Copy condition link** is an explicit user action. It encodes the selected calculator, values, and units in the URL fragment; anyone receiving that URL can read those conditions.
- **Download calculation note** is an explicit local export of current inputs, displayed results, formula, and cautions. No file is uploaded. Download names are sanitized and remain session-only; temporary anchors and Blob URLs are released. Treat the downloaded file as containing the calculation data when sharing it.
- The release contains no bundled third-party runtime library in v1.0.0. Future dependencies must be exact, embedded, licensed, and recorded in `dependencies.json` and `THIRD_PARTY_NOTICES.md`.
- `dist/index.html` and `dist/index.self-extract.html` are generated artifacts and should be distributed through a trusted channel.

The application provides quick engineering calculations, not a security boundary for confidential design decisions. Do not put information into a shared condition URL unless it is appropriate to share with the recipient.

## Formula and helper-data integrity

Changes to formulas, unit conversions, material representative values, bolt helper data, or tolerance/fit helper data can change engineering results and therefore require the same care as code changes.

Before merging such a change:

- Document the intended formula, units, assumptions, and reference in `APP_SPEC.md` or `docs/FORMULA_REFERENCES.md` as appropriate.
- Add or update numerical regression checks.
- Confirm input and output unit conversions independently.
- Keep representative values and helper presets clearly labeled so they are not mistaken for certified material data, drawing requirements, or automatic design approval.

## Dependency review

Before adding or upgrading a package:

- Confirm the package identity and exact version.
- Review its license and required notices.
- Inspect the browser bundle and package scripts.
- Confirm every runtime support asset is embedded.
- Rebuild with a clean cache.
- Test with the network disabled.
