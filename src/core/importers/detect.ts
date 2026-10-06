import { importAllureResults, isAllureResult, type AllureResult } from "./allure";
import { importCucumberJson } from "./cucumber";
import type { TestRun } from "../ir";

export type DetectedFormat = "cucumber" | "allure" | "unknown";

export function detectFormat(input: unknown): DetectedFormat {
  if (Array.isArray(input)) {
    if (input.length === 0) return "unknown";
    if (input.every((item) => isAllureResult(item))) return "allure";
    const first = input[0] as Record<string, unknown> | undefined;
    if (first && (first.elements || first.uri || first.keyword === "Feature")) {
      return "cucumber";
    }
    if (first && isAllureResult(first)) return "allure";
  }

  if (input && typeof input === "object") {
    if (isAllureResult(input)) return "allure";
    const record = input as Record<string, unknown>;
    if (record.elements || record.uri) return "cucumber";
  }

  return "unknown";
}

export function importAuto(
  input: unknown,
  options?: { name?: string; format?: DetectedFormat },
): TestRun {
  const format = options?.format ?? detectFormat(input);

  if (format === "cucumber") {
    return importCucumberJson(input, options);
  }

  if (format === "allure") {
    const results = (
      Array.isArray(input) ? input : [input]
    ) as AllureResult[];
    return importAllureResults(results, options);
  }

  throw new Error(
    "Unrecognized report format. Provide Cucumber JSON or Allure *-result.json content.",
  );
}

export function importFromText(
  text: string,
  options?: { name?: string; format?: DetectedFormat },
): TestRun {
  const parsed = JSON.parse(text) as unknown;
  return importAuto(parsed, options);
}
