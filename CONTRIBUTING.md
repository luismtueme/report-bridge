# Contributing to ReportBridge

Thanks for trying the MVP. This project is early — small, focused PRs help most.

## Local setup

```bash
npm install
npm run dev
npm run test:imports
```

## Guidelines

- Keep changes scoped (one importer, one skin tweak, or docs — not all at once)
- Add or update a fixture under `public/samples/` when you change an importer
- Run `npm run test:imports` and `npm run build` before opening a PR
- Skins are lookalikes for evaluation; do not claim native Allure/Extent parity

## Reporting issues

Include:

1. Framework + artifact type (e.g. Playwright JSON, JUnit XML)
2. Whether you used a bundled sample or your own file
3. Expected vs actual behavior (and a redacted sample file if possible)
