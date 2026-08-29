# Contributing

## Development principles

- Preserve a one-file release artifact and direct `file://` operation.
- Keep runtime network access disabled unless the product specification explicitly changes the trust model.
- Prefer understandable browser-native code and keep third-party dependencies exact, minimal, auditable, and license-compatible.
- Treat formula correctness, units, assumptions, and numerical regression checks as part of the product behavior, not implementation details.
- Keep calculator definitions searchable in Japanese and English and preserve desktop, smartphone, and keyboard access.
- Do not silently turn a representative material value, bolt helper, or fit helper into a certified design value.
- Keep destructive state actions reversible when practical and make restored calculation conditions visible to the user.

## Workflow

1. Read `APP_SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/FORMULA_REFERENCES.md` before changing engineering behavior.
2. Modify `src/index.template.html`, configuration, or build scripts. Do not edit generated `dist/index.html` or `dist/index.self-extract.html` directly.
3. When a formula, helper dataset, or default changes, document its assumptions/reference and add or update a numerical regression check.
4. Run `scripts/check-repository.ps1` on Windows.
5. Review `dist/build-size-report.json` for unexpected growth.
6. Test the affected calculator with its default inputs, changed units, all solve/select modes, and relevant presets.
7. Test search/category navigation, browser Back/Forward, keyboard operation, and the 390 px smartphone layout when UI behavior changes.
8. Verify the application with runtime networking disabled and confirm the self-extracting variant restores the readable HTML exactly.
9. Update README files, changelog, notices, and other product documentation in the same change.

## Pull requests

Describe:

- User-visible behavior changed.
- Formula/reference or helper-data changes, if any.
- Architecture or dependency changes.
- Numerical checks performed.
- Desktop, mobile, keyboard, and language checks performed.
- Build and no-network verification results.
- Known limitations or follow-up work.

A pull request should not add a remote runtime resource, unpinned package, generated-only fix, undocumented data flow, or unexplained engineering constant.
