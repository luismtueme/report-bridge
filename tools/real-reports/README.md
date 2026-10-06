# Real report generator

Tiny runners that produce **authentic** framework artifacts against:

- unit code (Jest, pytest, JUnit)
- [Sauce Demo](https://www.saucedemo.com/) (Playwright, Cucumber, Allure)

## Generate

From the repo root (requires Node, Python/`pytest`+`pytest-json-report`, Maven/JDK, Playwright browsers):

```bash
npm run generate:real-reports
```

Outputs land in `public/samples/real/` and show up in the UI as **Real …** buttons.

## Why Sauce Demo

You do not need your own app. Sauce Demo is a public practice site with stable selectors (`data-test=…`), which is enough to produce real pass/fail/skip artifacts quickly.
