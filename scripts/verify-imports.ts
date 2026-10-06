import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  importAllureResults,
  importFromText,
  parseCucumberJsonText,
  summarizeRun,
  type AllureResult,
} from "../src/core/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) =>
  readFileSync(join(root, relative), "utf8");

const cucumber = summarizeRun(
  parseCucumberJsonText(read("public/samples/cucumber-report.json"), {
    name: "Cucumber fixture",
  }),
);

const allure = summarizeRun(
  importAllureResults(
    [
      "login-passed-result.json",
      "login-failed-result.json",
      "inventory-broken-result.json",
      "inventory-skipped-result.json",
    ].map(
      (file) =>
        JSON.parse(read(`public/samples/allure/${file}`)) as AllureResult,
    ),
    { name: "Allure fixture" },
  ),
);

const junit = summarizeRun(
  importFromText(read("public/samples/junit-report.xml"), {
    name: "JUnit fixture",
  }),
);
const testng = summarizeRun(
  importFromText(read("public/samples/testng-report.xml"), {
    name: "TestNG fixture",
  }),
);
const jest = summarizeRun(
  importFromText(read("public/samples/jest-report.json"), {
    name: "Jest fixture",
  }),
);
const playwright = summarizeRun(
  importFromText(read("public/samples/playwright-report.json"), {
    name: "Playwright fixture",
  }),
);
const pytest = summarizeRun(
  importFromText(read("public/samples/pytest-report.json"), {
    name: "pytest fixture",
  }),
);

const checks = [
  cucumber.total === 4 && cucumber.counts.failed === 1,
  allure.total === 4 && allure.counts.broken === 1,
  junit.sourceFormat === "junit" &&
    junit.total === 4 &&
    junit.counts.failed === 1 &&
    junit.counts.broken === 1 &&
    junit.counts.skipped === 1,
  testng.sourceFormat === "testng" &&
    testng.total === 3 &&
    testng.counts.passed === 1 &&
    testng.counts.failed === 1 &&
    testng.counts.skipped === 1,
  jest.sourceFormat === "jest" &&
    jest.total === 4 &&
    jest.counts.failed === 1 &&
    jest.counts.pending === 1,
  playwright.sourceFormat === "playwright" &&
    playwright.total === 4 &&
    playwright.counts.failed === 1 &&
    playwright.counts.broken === 1,
  pytest.sourceFormat === "pytest" &&
    pytest.total === 4 &&
    pytest.counts.failed === 1 &&
    pytest.counts.skipped === 1,
];

if (checks.some((ok) => !ok)) {
  console.error("Fixture import checks failed", {
    cucumber,
    allure,
    junit,
    testng,
    jest,
    playwright,
    pytest,
  });
  process.exit(1);
}

console.log("Fixture import checks passed");
console.log(
  JSON.stringify(
    { cucumber, allure, junit, testng, jest, playwright, pytest },
    null,
    2,
  ),
);
