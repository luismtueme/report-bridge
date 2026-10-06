# Sample fixtures

This folder holds inputs used to demo and regression-test ReportBridge importers.

## Layout

| Path | Shown in UI? | Description |
| --- | --- | --- |
| Top-level `*.json` / `*.xml` and `allure/` | Yes — first button row | **Synthetic** hand-written demos |
| `real/` | Yes — **Real …** button row | Outputs from real runners (`npm run generate:real-reports`) |
| `user-all-formats/` | No | Same 8-case story in every supported format; for `scripts/validate-user-samples.ts` |

## Synthetic vs Real

- **Synthetic** files are edited by hand so each format looks clean and predictable in the skins.
- **Real** files are produced by actually executing Jest, pytest, JUnit/Maven, Playwright, Cucumber, and Allure (browser cases use [Sauce Demo](https://www.saucedemo.com/)).

Use synthetic for a fast UI walkthrough. Use Real (or upload your own CI artifacts) when you want confidence against runner-shaped data.

## Validation pack

`user-all-formats/` is intentionally **not** wired to UI buttons. To exercise it:

```bash
npx tsx scripts/validate-user-samples.ts
```

Or upload individual files via **Upload report** in the web UI.
