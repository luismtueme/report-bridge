import {
  createRunId,
  type Step,
  type Suite,
  type TestCase,
  type TestRun,
  type TestStatus,
} from "../ir";

type AllureStatus =
  | "passed"
  | "failed"
  | "broken"
  | "skipped"
  | "unknown"
  | string;

type AllureStep = {
  name?: string;
  status?: AllureStatus;
  start?: number;
  stop?: number;
  statusDetails?: { message?: string; trace?: string };
  steps?: AllureStep[];
  attachments?: Array<{ name?: string; source?: string; type?: string }>;
};

type AllureLabel = { name?: string; value?: string };
type AllureParameter = { name?: string; value?: string };

export type AllureResult = {
  uuid?: string;
  historyId?: string;
  name?: string;
  fullName?: string;
  description?: string;
  status?: AllureStatus;
  stage?: string;
  start?: number;
  stop?: number;
  statusDetails?: { message?: string; trace?: string };
  steps?: AllureStep[];
  labels?: AllureLabel[];
  parameters?: AllureParameter[];
  attachments?: Array<{ name?: string; source?: string; type?: string }>;
};

function mapStatus(status?: AllureStatus): TestStatus {
  switch ((status ?? "").toLowerCase()) {
    case "passed":
      return "passed";
    case "failed":
      return "failed";
    case "broken":
      return "broken";
    case "skipped":
      return "skipped";
    case "pending":
      return "pending";
    default:
      return "unknown";
  }
}

function duration(start?: number, stop?: number): number | undefined {
  if (start == null || stop == null) return undefined;
  return Math.max(0, stop - start);
}

function mapStep(step: AllureStep): Step {
  return {
    name: step.name ?? "step",
    status: mapStatus(step.status),
    durationMs: duration(step.start, step.stop),
    errorMessage: step.statusDetails?.message,
    steps: step.steps?.map(mapStep),
    attachments: step.attachments?.map((attachment) => ({
      name: attachment.name ?? "attachment",
      type: attachment.type,
      source: attachment.source,
    })),
  };
}

function labelValue(labels: AllureLabel[] | undefined, name: string): string | undefined {
  return labels?.find((label) => label.name === name)?.value;
}

function mapResult(result: AllureResult, index: number): TestCase {
  const tags =
    result.labels
      ?.filter((label) => label.name === "tag" && label.value)
      .map((label) => label.value as string) ?? [];

  const parameters = Object.fromEntries(
    (result.parameters ?? [])
      .filter((parameter) => parameter.name)
      .map((parameter) => [parameter.name as string, parameter.value ?? ""]),
  );

  return {
    id: result.uuid ?? result.historyId ?? `allure-${index}`,
    name: result.name ?? `Test ${index + 1}`,
    fullName: result.fullName,
    status: mapStatus(result.status),
    durationMs: duration(result.start, result.stop),
    startTime: result.start,
    stopTime: result.stop,
    tags,
    description: result.description,
    errorMessage: result.statusDetails?.message,
    stackTrace: result.statusDetails?.trace,
    steps: (result.steps ?? []).map(mapStep),
    attachments: (result.attachments ?? []).map((attachment) => ({
      name: attachment.name ?? "attachment",
      type: attachment.type,
      source: attachment.source,
    })),
    parameters: Object.keys(parameters).length ? parameters : undefined,
    historyId: result.historyId,
  };
}

function suiteKey(result: AllureResult): { id: string; name: string } {
  const parentSuite = labelValue(result.labels, "parentSuite");
  const suite = labelValue(result.labels, "suite");
  const feature = labelValue(result.labels, "feature");
  const packageName = labelValue(result.labels, "package");
  const name =
    parentSuite || suite || feature || packageName || "Allure results";
  return { id: name, name };
}

export function importAllureResults(
  results: AllureResult[],
  options?: { name?: string },
): TestRun {
  const grouped = new Map<string, { name: string; tests: TestCase[] }>();

  results.forEach((result, index) => {
    const key = suiteKey(result);
    const bucket = grouped.get(key.id) ?? { name: key.name, tests: [] };
    bucket.tests.push(mapResult(result, index));
    grouped.set(key.id, bucket);
  });

  const suites: Suite[] = [...grouped.entries()].map(([id, bucket]) => ({
    id,
    name: bucket.name,
    tags: [],
    tests: bucket.tests,
    suites: [],
  }));

  return {
    meta: {
      id: createRunId("allure"),
      name: options?.name ?? "Allure import",
      sourceFormat: "allure",
      importedAt: new Date().toISOString(),
    },
    suites,
  };
}

export function parseAllureResultsText(
  texts: string[],
  options?: { name?: string },
): TestRun {
  const results = texts.map((text) => JSON.parse(text) as AllureResult);
  return importAllureResults(results, options);
}

export function isAllureResult(value: unknown): value is AllureResult {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    (typeof record.status === "string" || record.status == null) &&
    !Array.isArray(value)
  );
}
