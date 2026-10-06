# ReportBridge

Import automation results into a shared intermediate representation (IR), then preview them in three reporting styles so teams can evaluate fit before committing to one tool.

## What it does

- **IR** — common model for suites, tests, steps, statuses, tags, errors, attachments
- **Importers**
  - Cucumber JSON
  - Allure `*-result.json`
  - JUnit XML
  - TestNG XML
  - Playwright JSON reporter output
  - Jest `--json` output
  - pytest `pytest-json-report` output
- **Skins** — Cucumber-style, Allure-like, Extent-like static previews
- **Web UI** — load samples, upload reports, switch skins, or compare all three
- **MCP server** — tools for import, summarize, preview, and compare

These skins are evaluation lookalikes, not drop-in replacements for native Allure CLI, ExtentReports, ReportPortal, or Serenity BDD.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:4732](http://localhost:4732).

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Web preview UI on port `4732` |
| `npm run build` | Production build |
| `npm run test:imports` | Verify sample fixtures parse into IR |
| `npm run mcp` | Start the MCP server over stdio |

## Supported inputs

| Format | Example artifact | Notes |
| --- | --- | --- |
| Cucumber JSON | `cucumber-report.json` | Feature/scenario/step JSON |
| Allure results | `allure-results/*-result.json` | Upload one or many result files |
| JUnit XML | `TEST-*.xml` / CI junit export | Also covers many pytest `--junitxml` runs |
| TestNG XML | `testng-results.xml` | Skips `is-config="true"` methods |
| Playwright JSON | `playwright-report.json` | Uses last retry attempt |
| Jest JSON | `jest --json --outputFile=...` | Maps pending/todo |
| pytest JSON | `pytest --json-report` | `pytest-json-report` plugin output |

Sample fixtures live under `public/samples/`.

### Real framework artifacts

Hand-written fixtures are fine for demos, but importers should also be checked against outputs from real runners. This repo includes a generator:

```bash
npm run generate:real-reports
```

It writes authentic files to `public/samples/real/` (Jest, pytest, JUnit Surefire, Playwright JSON, Cucumber JSON, Allure results). UI e2e samples hit [Sauce Demo](https://www.saucedemo.com/) so you do not need your own application under test.

In the web UI, use the **Real …** buttons to load those artifacts.

## MCP

```json
{
  "mcpServers": {
    "reportbridge": {
      "command": "npx",
      "args": ["tsx", "src/mcp/server.ts"],
      "cwd": "/absolute/path/to/reportbridge"
    }
  }
}
```

### Tools

- `import_results` — ingest supported JSON/XML report text
- `list_runs` / `summarize_run` — inspect stored runs (in-memory for this process)
- `list_skins` / `preview_skin` / `compare_skins` — evaluate reporting styles

## Project layout

```text
src/core/           IR, importers, summary, compare helpers
src/components/     Report skin renderers
src/mcp/server.ts   MCP stdio server
public/samples/     Example report payloads
```

## Scope notes

MVP focuses on import → IR → multi-skin preview. Native live reporters, ReportPortal/Serenity parity, and historical trend servers remain out of scope.
