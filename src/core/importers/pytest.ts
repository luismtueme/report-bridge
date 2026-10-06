import {
  createRunId,
  type Suite,
  type TestCase,
  type TestRun,
  type TestStatus,
} from "../ir";

type PytestCall = {
  outcome?: string;
  longrepr?: string | { reprcrash?: { message?: string }; traceback?: unknown };
  duration?: number;
};

type PytestTestEntry = {
  nodeid?: string;
  lineno?: number;
  outcome?: string;
  keywords?: Record<string, unknown> | string[];
  setup?: PytestCall;
  call?: PytestCall;
  teardown?: PytestCall;
};

type PytestCollector = {
  nodeid?: string;
  outcome?: string;
  result?: PytestTestEntry[];
};

export type PytestJsonReport = {
  created?: number;
  duration?: number;
  exitcode?: number;
  root?: string;
  environment?: Record<string, string>;
  summary?: {
    passed?: number;
    failed?: number;
    skipped?: number;
    error?: number;
    xfailed?: number;
    xpassed?: number;
    total?: number;
  };
  collectors?: PytestCollector[];
  tests?: PytestTestEntry[];
};

function mapOutcome(outcome?: string): TestStatus {
  switch ((outcome ?? "").toLowerCase()) {
    case "passed":
    case "xpassed":
      return "passed";
    case "failed":
      return "failed";
    case "error":
      return "broken";
    case "skipped":
    case "xfailed":
      return "skipped";
    default:
      return "unknown";
  }
}

function longreprMessage(call?: PytestCall): string | undefined {
  if (!call?.longrepr) return undefined;
  if (typeof call.longrepr === "string") return call.longrepr;
  return call.longrepr.reprcrash?.message;
}

function splitNodeId(nodeid: string): { suite: string; name: string } {
  const [pathPart, ...rest] = nodeid.split("::");
  const suite = pathPart?.split(/[\\/]/).pop() ?? pathPart ?? "pytest";
  const name = rest.length ? rest.join("::") : suite;
  return { suite, name };
}

function keywordsToTags(keywords?: Record<string, unknown> | string[]): string[] {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords.map(String);
  return Object.keys(keywords).filter(
    (key) =>
      Boolean(key) &&
      key !== "pytestmark" &&
      !key.endsWith(".py") &&
      !key.startsWith("test_"),
  );
}

export function isPytestJson(value: unknown): value is PytestJsonReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.tests) &&
    (typeof record.created === "number" ||
      typeof record.exitcode === "number" ||
      typeof record.summary === "object")
  );
}

export function importPytestJson(
  input: PytestJsonReport,
  options?: { name?: string },
): TestRun {
  const grouped = new Map<string, TestCase[]>();

  (input.tests ?? []).forEach((entry, index) => {
    const nodeid = entry.nodeid ?? `test-${index}`;
    const { suite, name } = splitNodeId(nodeid);
    const call = entry.call;
    const setup = entry.setup;
    const outcome = entry.outcome ?? call?.outcome ?? setup?.outcome;
    const status = mapOutcome(outcome);
    const errorMessage =
      longreprMessage(call) ??
      longreprMessage(setup) ??
      longreprMessage(entry.teardown);

    const durationMs = Math.round(
      ((setup?.duration ?? 0) +
        (call?.duration ?? 0) +
        (entry.teardown?.duration ?? 0)) *
        1000,
    );

    const test: TestCase = {
      id: `${nodeid}::${index}`,
      name,
      fullName: nodeid,
      status,
      durationMs: durationMs || undefined,
      tags: keywordsToTags(entry.keywords),
      errorMessage,
      stackTrace: typeof call?.longrepr === "string" ? call.longrepr : undefined,
      steps: [],
      attachments: [],
    };

    const bucket = grouped.get(suite) ?? [];
    bucket.push(test);
    grouped.set(suite, bucket);
  });

  const suites: Suite[] = [...grouped.entries()].map(([name, tests]) => ({
    id: name,
    name,
    tags: [],
    tests,
    suites: [],
  }));

  return {
    meta: {
      id: createRunId("pytest"),
      name: options?.name ?? "pytest import",
      sourceFormat: "pytest",
      importedAt: new Date().toISOString(),
      environment: input.environment,
    },
    suites,
  };
}

export function parsePytestJsonText(
  text: string,
  options?: { name?: string },
): TestRun {
  return importPytestJson(JSON.parse(text) as PytestJsonReport, options);
}
