import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  detectFormatFromText,
  flattenTests,
  importAllureResults,
  importFromText,
  summarizeRun,
} from "../src/core/index.ts";

const root = "public/samples/user-all-formats";
const files = [
  "cucumber-report.json",
  "jest-report.json",
  "playwright-report.json",
  "pytest-report.json",
  "testng-results.xml",
  "TEST-sample.xml",
];

type Row = Record<string, unknown>;
const rows: Row[] = [];

for (const file of files) {
  const text = readFileSync(join(root, file), "utf8");
  const detected = detectFormatFromText(text);
  try {
    const run = importFromText(text, { name: file });
    const summary = summarizeRun(run);
    const flat = flattenTests(run.suites);
    rows.push({
      file,
      detected,
      sourceFormat: summary.sourceFormat,
      total: summary.total,
      counts: summary.counts,
      failed: summary.failedTests.map((item) => item.name),
      withSteps: flat.filter((test) => test.steps.length > 0).length,
      sampleNames: flat.slice(0, 6).map((test) => test.name),
      ok: summary.total > 0,
    });
  } catch (error) {
    rows.push({
      file,
      detected,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const allureDir = join(root, "allure-results");
const allureFiles = readdirSync(allureDir).filter((name) =>
  name.endsWith("-result.json"),
);
const results = allureFiles.map((name) =>
  JSON.parse(readFileSync(join(allureDir, name), "utf8")),
);
const allureRun = importAllureResults(results, { name: "user allure" });
const allureSummary = summarizeRun(allureRun);
rows.push({
  file: "allure-results/*",
  detected: "allure",
  sourceFormat: allureSummary.sourceFormat,
  total: allureSummary.total,
  counts: allureSummary.counts,
  failed: allureSummary.failedTests.map((item) => item.name),
  withSteps: flattenTests(allureRun.suites).filter((test) => test.steps.length > 0)
    .length,
  sampleNames: flattenTests(allureRun.suites)
    .slice(0, 8)
    .map((test) => test.name),
  ok: allureSummary.total > 0,
});

writeFileSync(
  "/tmp/user-samples-report.json",
  JSON.stringify(rows, null, 2),
);
console.log(JSON.stringify(rows, null, 2));
const failed = rows.filter((row) => !row.ok);
if (failed.length) {
  console.error("FAILED", failed);
  process.exit(1);
}
