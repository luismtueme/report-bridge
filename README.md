# ReportBridge

**One test run. Three reporting styles.**

ReportBridge imports automation results into a shared intermediate representation (IR), then previews them as Cucumber-style, Allure-like, and Extent-like reports so teams can evaluate fit before committing to a stack.

> **MVP / prototype.** Skins are evaluation lookalikes — not drop-in replacements for native Allure CLI, ExtentReports, ReportPortal, or Serenity BDD.

## Try it in 60 seconds

**Requirements:** Node.js 20+ (22 recommended)

```bash
git clone https://github.com/luismtueme/report-bridge.git
cd report-bridge
npm install
npm run dev
```

Open [http://localhost:4732](http://localhost:4732).

1. Click a **synthetic** sample (Cucumber, JUnit, Playwright, …), or  
2. Click a **Real …** sample (artifacts generated from real runners / Sauce Demo), or  
3. **Upload report** with your own `.json` / `.xml` file(s).

Then switch skins or use **Compare all**.

### Smoke-check the importers

```bash
npm run test:imports
npm run build
```

## What it does

| Piece | Details |
| --- | --- |
| **IR** | Suites → tests → steps → status, tags, errors, attachments |
| **Importers** | Cucumber JSON, Allure `*-result.json`, JUnit XML, TestNG XML, Playwright JSON, Jest JSON, pytest-json-report |
| **Skins** | Cucumber-style, Allure-like, Extent-like (+ side-by-side compare) |
| **Web UI** | Samples, upload, skin switcher |
| **MCP** | Agent tools for import / summarize / preview / compare |

```text
Framework JSON/XML  →  IR  →  Cucumber | Allure-like | Extent-like
```

## Supported inputs

| Format | Typical artifact | Notes |
| --- | --- | --- |
| Cucumber JSON | `cucumber-report.json` | Feature / scenario / step JSON |
| Allure results | `allure-results/*-result.json` | Upload one or many files |
| JUnit XML | `TEST-*.xml`, CI junit export | Also covers many `pytest --junitxml` runs |
| TestNG XML | `testng-results.xml` | Skips `is-config="true"` methods |
| Playwright JSON | JSON reporter output | Uses last retry attempt |
| Jest JSON | `jest --json --outputFile=…` | Maps pending / todo |
| pytest JSON | `pytest --json-report` | `pytest-json-report` plugin |

Hand-written demos: `public/samples/`  
Real runner outputs: `public/samples/real/`

### Regenerate real artifacts (optional)

Needs Node, Python (`pytest` + `pytest-json-report`), Maven/JDK, and Playwright browsers:

```bash
npm run generate:real-reports
```

UI e2e samples hit [Sauce Demo](https://www.saucedemo.com/) so you do not need your own app under test. See [`tools/real-reports/README.md`](tools/real-reports/README.md).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Web UI on port **4732** |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build |
| `npm run test:imports` | Parse bundled fixtures into IR |
| `npm run mcp` | MCP server over stdio |
| `npm run generate:real-reports` | Rebuild `public/samples/real/` |

## MCP (optional)

Add to your MCP client config (Cursor, Claude Desktop, etc.):

```json
{
  "mcpServers": {
    "reportbridge": {
      "command": "npx",
      "args": ["tsx", "src/mcp/server.ts"],
      "cwd": "/absolute/path/to/report-bridge"
    }
  }
}
```

**Tools:** `import_results`, `list_runs`, `summarize_run`, `list_skins`, `preview_skin`, `compare_skins`  

Runs are stored **in memory** for that MCP process only.

## Project layout

```text
src/core/              IR, importers, summary, compare
src/components/        Report skin renderers
src/mcp/server.ts      MCP stdio server
public/samples/        Synthetic + real fixtures
tools/real-reports/    Generators for authentic artifacts
```

## Known limits (on purpose for MVP)

- Skins approximate layout/feel; they are not native Allure / Extent / Serenity
- Attachment metadata is imported; full screenshot galleries are limited
- Real CI dumps vary by vendor — odd schemas may need importer tweaks
- No hosted demo yet (local `npm run dev` only)

## License

[MIT](LICENSE)
