import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  importAllureResults,
  parseCucumberJsonText,
  summarizeRun,
  type AllureResult,
} from "../src/core/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const cucumber = parseCucumberJsonText(
  readFileSync(join(root, "public/samples/cucumber-report.json"), "utf8"),
  { name: "Cucumber fixture" },
);
const cucumberSummary = summarizeRun(cucumber);

const allureFiles = [
  "login-passed-result.json",
  "login-failed-result.json",
  "inventory-broken-result.json",
  "inventory-skipped-result.json",
];
const allure = importAllureResults(
  allureFiles.map(
    (file) =>
      JSON.parse(
        readFileSync(join(root, "public/samples/allure", file), "utf8"),
      ) as AllureResult,
  ),
  { name: "Allure fixture" },
);
const allureSummary = summarizeRun(allure);

const checks = [
  cucumberSummary.total === 4,
  cucumberSummary.counts.passed === 2,
  cucumberSummary.counts.failed === 1,
  cucumberSummary.counts.skipped === 1,
  allureSummary.total === 4,
  allureSummary.counts.passed === 1,
  allureSummary.counts.failed === 1,
  allureSummary.counts.broken === 1,
  allureSummary.counts.skipped === 1,
];

if (checks.some((ok) => !ok)) {
  console.error("Fixture import checks failed", { cucumberSummary, allureSummary });
  process.exit(1);
}

console.log("Fixture import checks passed");
console.log(JSON.stringify({ cucumberSummary, allureSummary }, null, 2));
