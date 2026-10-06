import {
  createRunId,
  type Suite,
  type TestCase,
  type TestRun,
  type TestStatus,
} from "../ir";

type JestAssertionResult = {
  ancestorTitles?: string[];
  fullName?: string;
  title?: string;
  status?: string;
  duration?: number | null;
  failureMessages?: string[];
  location?: { line?: number } | null;
};

type JestTestResult = {
  name?: string;
  status?: string;
  message?: string;
  assertionResults?: JestAssertionResult[];
};

export type JestJsonReport = {
  numFailedTests?: number;
  numPassedTests?: number;
  numPendingTests?: number;
  numTodoTests?: number;
  numTotalTests?: number;
  startTime?: number;
  success?: boolean;
  testResults?: JestTestResult[];
};

function mapStatus(status?: string): TestStatus {
  switch ((status ?? "").toLowerCase()) {
    case "passed":
      return "passed";
    case "failed":
      return "failed";
    case "pending":
    case "todo":
      return "pending";
    case "skipped":
    case "disabled":
      return "skipped";
    default:
      return "unknown";
  }
}

function fileName(pathName?: string): string {
  if (!pathName) return "Jest suite";
  const parts = pathName.split(/[\\/]/);
  return parts[parts.length - 1] || pathName;
}

export function isJestJson(value: unknown): value is JestJsonReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.testResults) && "numTotalTests" in record;
}

export function importJestJson(
  input: JestJsonReport,
  options?: { name?: string },
): TestRun {
  const suites: Suite[] = (input.testResults ?? []).map((file, fileIndex) => {
    const suiteName = fileName(file.name);
    const tests: TestCase[] = (file.assertionResults ?? []).map(
      (assertion, index) => {
        const ancestors = assertion.ancestorTitles ?? [];
        const name = assertion.title ?? `Test ${index + 1}`;
        return {
          id: `${suiteName}::${assertion.fullName ?? name}::${index}`,
          name,
          fullName: assertion.fullName ?? [...ancestors, name].join(" › "),
          status: mapStatus(assertion.status),
          durationMs: assertion.duration ?? undefined,
          tags: ancestors,
          errorMessage: assertion.failureMessages?.[0],
          stackTrace: assertion.failureMessages?.join("\n\n"),
          steps: [],
          attachments: [],
        };
      },
    );

    return {
      id: file.name ?? `jest-file-${fileIndex}`,
      name: suiteName,
      description: file.name,
      tags: [],
      tests,
      suites: [],
    };
  });

  return {
    meta: {
      id: createRunId("jest"),
      name: options?.name ?? "Jest import",
      sourceFormat: "jest",
      importedAt: new Date().toISOString(),
    },
    suites,
  };
}

export function parseJestJsonText(
  text: string,
  options?: { name?: string },
): TestRun {
  return importJestJson(JSON.parse(text) as JestJsonReport, options);
}
