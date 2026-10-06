import {
  createRunId,
  type Step,
  type Suite,
  type TestCase,
  type TestRun,
  type TestStatus,
} from "../ir";

type CucumberTag = { name: string };
type CucumberResult = {
  status?: string;
  duration?: number;
  error_message?: string;
};
type CucumberStep = {
  keyword?: string;
  name?: string;
  result?: CucumberResult;
  embeddings?: Array<{ mime_type?: string; data?: string; name?: string }>;
  rows?: Array<{ cells: string[] }>;
};
type CucumberElement = {
  id?: string;
  name?: string;
  description?: string;
  type?: string;
  tags?: CucumberTag[];
  steps?: CucumberStep[];
  before?: Array<{ result?: CucumberResult }>;
  after?: Array<{ result?: CucumberResult }>;
};
type CucumberFeature = {
  id?: string;
  name?: string;
  description?: string;
  uri?: string;
  tags?: CucumberTag[];
  elements?: CucumberElement[];
};

function mapStatus(status?: string): TestStatus {
  switch ((status ?? "").toLowerCase()) {
    case "passed":
      return "passed";
    case "failed":
      return "failed";
    case "skipped":
      return "skipped";
    case "pending":
    case "undefined":
      return "pending";
    case "ambiguous":
      return "broken";
    default:
      return status ? "unknown" : "unknown";
  }
}

function nsToMs(duration?: number): number | undefined {
  if (duration == null) return undefined;
  // Cucumber JSON often stores nanoseconds; some emitters use ms.
  return duration > 10_000_000 ? duration / 1_000_000 : duration;
}

function mapStep(step: CucumberStep): Step {
  const keyword = step.keyword?.trim() ?? "";
  const name = `${keyword} ${step.name ?? ""}`.trim() || "step";
  const attachments =
    step.embeddings?.map((embedding, index) => ({
      name: embedding.name ?? `embedding-${index + 1}`,
      type: embedding.mime_type,
      content: embedding.data,
    })) ?? [];

  return {
    name,
    status: mapStatus(step.result?.status),
    durationMs: nsToMs(step.result?.duration),
    errorMessage: step.result?.error_message,
    attachments: attachments.length ? attachments : undefined,
  };
}

function worstStatus(statuses: TestStatus[]): TestStatus {
  const order: TestStatus[] = [
    "failed",
    "broken",
    "pending",
    "skipped",
    "unknown",
    "passed",
  ];
  for (const status of order) {
    if (statuses.includes(status)) return status;
  }
  return "unknown";
}

function mapScenario(
  featureName: string,
  element: CucumberElement,
  index: number,
): TestCase {
  const steps = (element.steps ?? []).map(mapStep);
  const hookStatuses = [...(element.before ?? []), ...(element.after ?? [])].map(
    (hook) => mapStatus(hook.result?.status),
  );
  const status = worstStatus([
    ...steps.map((step) => step.status),
    ...hookStatuses,
  ]);
  const failedStep = steps.find(
    (step) => step.status === "failed" || step.status === "broken",
  );
  const tags = (element.tags ?? []).map((tag) => tag.name.replace(/^@/, ""));
  const name = element.name ?? `Scenario ${index + 1}`;

  return {
    id: element.id ?? `${featureName}::${name}::${index}`,
    name,
    fullName: `${featureName} › ${name}`,
    status,
    durationMs: steps.reduce((sum, step) => sum + (step.durationMs ?? 0), 0),
    tags,
    description: element.description?.trim() || undefined,
    errorMessage: failedStep?.errorMessage,
    steps,
    attachments: [],
  };
}

export function importCucumberJson(
  input: unknown,
  options?: { name?: string },
): TestRun {
  const features = (
    Array.isArray(input) ? input : [input]
  ) as CucumberFeature[];

  const suites: Suite[] = features.map((feature, featureIndex) => {
    const featureName = feature.name ?? `Feature ${featureIndex + 1}`;
    const scenarios = (feature.elements ?? []).filter(
      (element) => !element.type || element.type === "scenario",
    );

    return {
      id: feature.id ?? feature.uri ?? `feature-${featureIndex}`,
      name: featureName,
      description: feature.description?.trim() || undefined,
      tags: (feature.tags ?? []).map((tag) => tag.name.replace(/^@/, "")),
      tests: scenarios.map((scenario, index) =>
        mapScenario(featureName, scenario, index),
      ),
      suites: [],
    };
  });

  return {
    meta: {
      id: createRunId("cucumber"),
      name: options?.name ?? "Cucumber import",
      sourceFormat: "cucumber",
      importedAt: new Date().toISOString(),
    },
    suites,
  };
}

export function parseCucumberJsonText(
  text: string,
  options?: { name?: string },
): TestRun {
  return importCucumberJson(JSON.parse(text) as unknown, options);
}
