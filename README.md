# ReportBridge

MVP that imports automation results into a shared intermediate representation (IR), then previews them in three reporting styles so teams can evaluate fit before committing to one tool.

## What it does

- **IR** — common model for suites, tests, steps, statuses, tags, errors, attachments
- **Importers** — Cucumber JSON and Allure `*-result.json`
- **Skins** — Cucumber-style, Allure-like, Extent-like static previews
- **Web UI** — load samples, upload JSON, switch skins, or compare all three
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
| `npm run test:imports` | Verify sample Cucumber/Allure fixtures parse into IR |
| `npm run mcp` | Start the MCP server over stdio |

## MCP

Add to your MCP client config:

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

- `import_results` — ingest Cucumber JSON or Allure result JSON
- `list_runs` / `summarize_run` — inspect stored runs (in-memory for this process)
- `list_skins` / `preview_skin` / `compare_skins` — evaluate reporting styles

## Sample fixtures

- `public/samples/cucumber-report.json`
- `public/samples/allure/*-result.json`

## Project layout

```text
src/core/           IR, importers, summary, compare helpers
src/components/     Report skin renderers
src/mcp/server.ts   MCP stdio server
public/samples/     Example Cucumber + Allure payloads
```

## Scope notes

MVP intentionally stops at import → IR → multi-skin preview. Native live reporters, ReportPortal/Serenity parity, and historical trend servers are out of scope for this slice.
