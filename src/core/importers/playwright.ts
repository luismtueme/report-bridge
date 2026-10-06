import {
  createRunId,
  type Step,
  type Suite,
  type TestCase,
  type TestRun,
  type TestStatus,
} from "../ir";

type PlaywrightError = {
  message?: string;
  stack?: string;
};

type PlaywrightAttachment = {
  name?: string;
  contentType?: string;
  path?: string;
};

type PlaywrightStep = {
  title?: string;
  category?: string;
  duration?: number;
  error?: PlaywrightError;
  steps?: PlaywrightStep[];
};

type PlaywrightResult = {
  status?: string;
  duration?: number;
  error?: PlaywrightError;
  errors?: PlaywrightError[];
  retry?: number;
  startTime?: string;
  attachments?: PlaywrightAttachment[];
  steps?: PlaywrightStep[];
};

type PlaywrightTest = {
  title?: string;
  results?: PlaywrightResult[];
};

type PlaywrightSpec = {
  title?: string;
  ok?: boolean;
  tags?: string[];
  tests?: PlaywrightTest[];
};

type PlaywrightSuite = {
  title?: string;
  file?: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
};

export type PlaywrightJsonReport = {
  config?: unknown;
  suites?: PlaywrightSuite[];
  errors?: PlaywrightError[];
  stats?: {
    startTime?: string;
    duration?: number;
    expected?: number;
    unexpected?: number;
    flaky?: number;
    skipped?: number;
  };
};

function mapStatus(status?: string): TestStatus {
  switch ((status ?? "").toLowerCase()) {
    case "passed":
    case "expected":
      return "passed";
    case "failed":
    case "unexpected":
      return "failed";
    case "timedout":
    case "interrupted":
      return "broken";
    case "skipped":
      return "skipped";
    case "flaky":
      // Prefer last result status below; treat alone as passed with note via tags.
      return "passed";
    default:
      return "unknown";
  }
}

function mapStep(step: PlaywrightStep): Step {
  return {
    name: step.title ?? step.category ?? "step",
    status: step.error ? "failed" : "passed",
    durationMs: step.duration,
    errorMessage: step.error?.message,
    steps: step.steps?.map(mapStep),
  };
}

function pickResult(results: PlaywrightResult[] | undefined): PlaywrightResult | undefined {
  if (!results?.length) return undefined;
  // Prefer the last attempt (Playwright retries append results).
  return results[results.length - 1];
}

function collectSpecs(
  suite: PlaywrightSuite,
  path: string[],
  into: Array<{ path: string[]; spec: PlaywrightSpec; file?: string }>,
) {
  const nextPath = suite.title ? [...path, suite.title] : path;
  for (const spec of suite.specs ?? []) {
    into.push({ path: nextPath, spec, file: suite.file });
  }
  for (const child of suite.suites ?? []) {
    collectSpecs(child, nextPath, into);
  }
}

function mapSpec(
  entry: { path: string[]; spec: PlaywrightSpec; file?: string },
  index: number,
): TestCase {
  const test = entry.spec.tests?.[0];
  const result = pickResult(test?.results);
  const errors = [
    ...(result?.errors ?? []),
    ...(result?.error ? [result.error] : []),
  ];
  const status = mapStatus(result?.status);
  const name = entry.spec.title ?? `Spec ${index + 1}`;

  return {
    id: `${entry.path.join("›")}::${name}::${index}`,
    name,
    fullName: [...entry.path, name].filter(Boolean).join(" › "),
    status,
    durationMs: result?.duration,
    tags: [
      ...(entry.spec.tags ?? []),
      ...(test?.results && test.results.length > 1 ? ["retried"] : []),
    ],
    errorMessage: errors[0]?.message,
    stackTrace: errors[0]?.stack,
    steps: (result?.steps ?? []).map(mapStep),
    attachments: (result?.attachments ?? []).map((attachment) => ({
      name: attachment.name ?? "attachment",
      type: attachment.contentType,
      source: attachment.path,
    })),
  };
}

export function isPlaywrightJson(value: unknown): value is PlaywrightJsonReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.suites)) return false;
  // Prefer Playwright over generic trees by looking for config/stats or nested specs.
  if ("config" in record || "stats" in record) return true;
  const first = (record.suites as unknown[])[0] as Record<string, unknown> | undefined;
  return Boolean(first && ("specs" in first || "suites" in first));
}

export function importPlaywrightJson(
  input: PlaywrightJsonReport,
  options?: { name?: string },
): TestRun {
  const collected: Array<{ path: string[]; spec: PlaywrightSpec; file?: string }> =
    [];
  for (const suite of input.suites ?? []) {
    collectSpecs(suite, [], collected);
  }

  const byRoot = new Map<string, TestCase[]>();
  collected.forEach((entry, index) => {
    const root = entry.path[0] ?? entry.file ?? "Playwright";
    const bucket = byRoot.get(root) ?? [];
    bucket.push(mapSpec(entry, index));
    byRoot.set(root, bucket);
  });

  const suites: Suite[] = [...byRoot.entries()].map(([name, tests]) => ({
    id: name,
    name,
    tags: [],
    tests,
    suites: [],
  }));

  return {
    meta: {
      id: createRunId("playwright"),
      name: options?.name ?? "Playwright import",
      sourceFormat: "playwright",
      importedAt: new Date().toISOString(),
    },
    suites,
  };
}

export function parsePlaywrightJsonText(
  text: string,
  options?: { name?: string },
): TestRun {
  return importPlaywrightJson(JSON.parse(text) as PlaywrightJsonReport, options);
}
