import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  REPORT_SKINS,
  compareSkinsMarkdown,
  getRun,
  importFromText,
  listRuns,
  saveRun,
  summarizeRun,
  type ReportSkinId,
} from "../core/index.ts";

const server = new McpServer({
  name: "reportbridge",
  version: "0.1.0",
});

function requireRun(runId: string) {
  const run = getRun(runId);
  if (!run) {
    throw new Error(`Unknown run id: ${runId}. Import results first.`);
  }
  return run;
}

server.registerTool(
  "import_results",
  {
    title: "Import test results",
    description:
      "Import test report text into ReportBridge IR. Supports Cucumber JSON, Allure *-result.json, JUnit XML, TestNG XML, Playwright JSON, Jest JSON, and pytest-json-report.",
    inputSchema: {
      content: z
        .string()
        .describe(
          "Raw report text (JSON or XML). For multiple Allure result files, pass a JSON array of result objects.",
        ),
      name: z.string().optional().describe("Optional display name for the run"),
      format: z
        .enum([
          "auto",
          "cucumber",
          "allure",
          "junit",
          "testng",
          "playwright",
          "jest",
          "pytest",
        ])
        .optional()
        .describe("Force a format, or auto-detect (default)"),
    },
  },
  async ({ content, name, format }) => {
    const run = importFromText(content, {
      name,
      format: format && format !== "auto" ? format : undefined,
    });
    saveRun(run);
    const summary = summarizeRun(run);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ runId: run.meta.id, summary }, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "list_runs",
  {
    title: "List imported runs",
    description: "List runs currently held in the ReportBridge MCP process memory.",
    inputSchema: {},
  },
  async () => {
    const runs = listRuns().map((run) => summarizeRun(run));
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(runs, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "summarize_run",
  {
    title: "Summarize a run",
    description: "Return pass/fail counts, duration, and failing tests for an imported run.",
    inputSchema: {
      runId: z.string(),
    },
  },
  async ({ runId }) => {
    const summary = summarizeRun(requireRun(runId));
    return {
      content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
    };
  },
);

server.registerTool(
  "preview_skin",
  {
    title: "Preview a report skin",
    description:
      "Describe how a run would look in one of the MVP skins: cucumber, allure, or extent.",
    inputSchema: {
      runId: z.string(),
      skin: z.enum(["cucumber", "allure", "extent"]),
    },
  },
  async ({ runId, skin }) => {
    const run = requireRun(runId);
    const summary = summarizeRun(run);
    const meta = REPORT_SKINS.find((item) => item.id === skin)!;
    const text = [
      `# ${meta.name}`,
      meta.blurb,
      ``,
      `Run: ${summary.name} (${summary.id})`,
      `Source: ${summary.sourceFormat}`,
      `Totals: ${summary.total} tests, ${(summary.passRate * 100).toFixed(1)}% pass`,
      `Failures: ${summary.counts.failed} failed, ${summary.counts.broken} broken, ${summary.counts.skipped} skipped`,
      ``,
      skin === "cucumber"
        ? "Layout focus: Feature → Scenario → step keywords with inline errors."
        : skin === "allure"
          ? "Layout focus: suite sidebar, expandable tests, tags, stacks, attachments."
          : "Layout focus: dashboard status cards plus a compact category/status table.",
      ``,
      "Open the ReportBridge web UI to see the rendered skin.",
    ].join("\n");

    return { content: [{ type: "text" as const, text }] };
  },
);

server.registerTool(
  "compare_skins",
  {
    title: "Compare report skins",
    description:
      "Compare Cucumber-style, Allure-like, and Extent-like skins for an imported run and suggest fit.",
    inputSchema: {
      runId: z.string(),
    },
  },
  async ({ runId }) => {
    const run = requireRun(runId);
    return {
      content: [{ type: "text" as const, text: compareSkinsMarkdown(run) }],
    };
  },
);

server.registerTool(
  "list_skins",
  {
    title: "List available skins",
    description: "List the report skins available in this MVP.",
    inputSchema: {},
  },
  async () => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(REPORT_SKINS satisfies Array<{ id: ReportSkinId; name: string; blurb: string }>, null, 2),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
