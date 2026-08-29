## Summary

Describe the user-visible change.

## Specification and engineering checks

- [ ] `APP_SPEC.md` matches the implemented behavior.
- [ ] Formula / unit / helper-data changes have a documented reference or rationale.
- [ ] Numerical regression checks cover affected calculations.
- [ ] README and changelog are updated where needed.
- [ ] Third-party notices are updated where needed.

## Verification

- [ ] `scripts/check-repository.ps1` passes.
- [ ] `dist/index.html` opens directly with `file://`.
- [ ] `dist/index.self-extract.html` expands and restores the readable HTML correctly.
- [ ] Main flow tested on desktop.
- [ ] 390 px smartphone behavior and horizontal overflow checked.
- [ ] Keyboard search and browser Back/Forward checked where relevant.
- [ ] Japanese and English checked where applicable.
- [ ] Browser console checked for errors.
- [ ] Runtime Network panel checked after initial load; no unexpected request is present.
- [ ] Relevant presets, unit changes, and parameter sweeps checked.

## Notes

List unverified items, limitations, or follow-up work. Do not mark checks complete unless performed.
