import { importAllureResults, isAllureResult, type AllureResult } from "./allure";
import { importCucumberJson } from "./cucumber";
import { importJestJson, isJestJson } from "./jest";
import { importJUnitXml, isJUnitXml } from "./junit";
import { importPlaywrightJson, isPlaywrightJson } from "./playwright";
import { importPytestJson, isPytestJson } from "./pytest";
import { importTestNGXml, isTestNGXml } from "./testng";
import type { TestRun } from "../ir";

export type DetectedFormat =
  | "cucumber"
  | "allure"
  | "junit"
  | "testng"
  | "playwright"
  | "jest"
  | "pytest"
  | "unknown";

export function detectFormatFromText(text: string): DetectedFormat {
  const trimmed = text.trim();
  if (!trimmed) return "unknown";

  if (trimmed.startsWith("<")) {
    if (isTestNGXml(trimmed)) return "testng";
    if (isJUnitXml(trimmed)) return "junit";
    return "unknown";
  }

  try {
    return detectFormat(JSON.parse(trimmed) as unknown);
  } catch {
    return "unknown";
  }
}

export function detectFormat(input: unknown): DetectedFormat {
  if (Array.isArray(input)) {
    if (input.length === 0) return "unknown";
    const first = input[0] as Record<string, unknown> | undefined;
    if (first && (first.elements || first.uri || first.keyword === "Feature")) {
      return "cucumber";
    }
    if (input.every((item) => isAllureResult(item))) return "allure";
    if (first && isAllureResult(first)) return "allure";
  }

  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (record.elements || record.uri || record.keyword === "Feature") {
      return "cucumber";
    }
    if (isJestJson(input)) return "jest";
    if (isPytestJson(input)) return "pytest";
    if (isPlaywrightJson(input)) return "playwright";
    if (isAllureResult(input)) return "allure";
  }

  return "unknown";
}

export function importAuto(
  input: unknown,
  options?: { name?: string; format?: DetectedFormat },
): TestRun {
  const format = options?.format ?? detectFormat(input);

  switch (format) {
    case "cucumber":
      return importCucumberJson(input, options);
    case "allure":
      return importAllureResults(
        (Array.isArray(input) ? input : [input]) as AllureResult[],
        options,
      );
    case "jest":
      return importJestJson(input as Parameters<typeof importJestJson>[0], options);
    case "playwright":
      return importPlaywrightJson(
        input as Parameters<typeof importPlaywrightJson>[0],
        options,
      );
    case "pytest":
      return importPytestJson(
        input as Parameters<typeof importPytestJson>[0],
        options,
      );
    default:
      throw new Error(
        "Unrecognized JSON report format. Supported: Cucumber, Allure, Playwright, Jest, pytest-json-report.",
      );
  }
}

export function importFromText(
  text: string,
  options?: { name?: string; format?: DetectedFormat },
): TestRun {
  const format = options?.format ?? detectFormatFromText(text);

  if (format === "junit") {
    return importJUnitXml(text, options);
  }
  if (format === "testng") {
    return importTestNGXml(text, options);
  }

  const trimmed = text.trim();
  if (trimmed.startsWith("<")) {
    throw new Error(
      "Unrecognized XML report format. Supported: JUnit XML, TestNG XML.",
    );
  }

  const parsed = JSON.parse(text) as unknown;
  return importAuto(parsed, { ...options, format });
}
