import { flattenTests, type TestRun, type TestStatus } from "./ir";
import { formatDuration, formatPassRate, summarizeRun } from "./summary";

export const REPORT_SKINS = [
  {
    id: "cucumber",
    name: "Cucumber-style",
    blurb: "BDD feature narrative with Given/When/Then steps.",
  },
  {
    id: "allure",
    name: "Allure-like",
    blurb: "Suites, severity-style tags, and failure detail panels.",
  },
  {
    id: "extent",
    name: "Extent-like",
    blurb: "Dashboard cards, category view, and timeline-feel rows.",
  },
] as const;

export type ReportSkinId = (typeof REPORT_SKINS)[number]["id"];

export function skinComparisonNotes(run: TestRun): Array<{
  skin: ReportSkinId;
  strengths: string[];
  watchouts: string[];
}> {
  const hasSteps = flattenTests(run.suites).some((test) => test.steps.length > 0);
  const hasTags = flattenTests(run.suites).some((test) => test.tags.length > 0);
  const hasFailures = flattenTests(run.suites).some(
    (test) => test.status === "failed" || test.status === "broken",
  );

  return [
    {
      skin: "cucumber",
      strengths: [
        hasSteps
          ? "Preserves scenario narration and step keywords."
          : "Still readable as feature/scenario lists.",
        "Best when stakeholders think in Gherkin.",
      ],
      watchouts: [
        "Less emphasis on trends, retries, or historical flakiness.",
        !hasSteps ? "Source had few/no steps — narrative value will be limited." : "",
      ].filter(Boolean),
    },
    {
      skin: "allure",
      strengths: [
        "Clear hierarchy and attachment-friendly failure view.",
        hasTags ? "Tags/labels surface well for filtering." : "Works even without rich labels.",
      ],
      watchouts: [
        "Native Allure history/categories need the Allure CLI ecosystem.",
        "This MVP skin approximates layout, not the full Allure server.",
      ],
    },
    {
      skin: "extent",
      strengths: [
        "Strong at-a-glance dashboard for managers and CI glances.",
        hasFailures
          ? "Failed rows stand out quickly in the category list."
          : "Clean green dashboard when the run is healthy.",
      ],
      watchouts: [
        "Native Extent is a runtime reporter; this is a static lookalike.",
        "Less BDD storytelling than Cucumber-style.",
      ],
    },
  ];
}

export function compareSkinsMarkdown(run: TestRun): string {
  const summary = summarizeRun(run);
  const notes = skinComparisonNotes(run);
  const lines = [
    `# ReportBridge skin comparison`,
    ``,
    `Run: **${summary.name}** (\`${summary.id}\`)`,
    `Source: ${summary.sourceFormat} · ${summary.total} tests · ${formatPassRate(summary.passRate)} pass · ${formatDuration(summary.durationMs)}`,
    ``,
  ];

  for (const note of notes) {
    const skin = REPORT_SKINS.find((item) => item.id === note.skin)!;
    lines.push(`## ${skin.name}`);
    lines.push(skin.blurb);
    lines.push(``);
    lines.push(`Strengths:`);
    note.strengths.forEach((item) => lines.push(`- ${item}`));
    lines.push(``);
    lines.push(`Watchouts:`);
    note.watchouts.forEach((item) => lines.push(`- ${item}`));
    lines.push(``);
  }

  return lines.join("\n");
}

export function statusLabel(status: TestStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
