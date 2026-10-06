import { z } from "zod";

export const TestStatusSchema = z.enum([
  "passed",
  "failed",
  "broken",
  "skipped",
  "pending",
  "unknown",
]);
export type TestStatus = z.infer<typeof TestStatusSchema>;

export const AttachmentSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  source: z.string().optional(),
  content: z.string().optional(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export type Step = {
  name: string;
  status: TestStatus;
  durationMs?: number;
  errorMessage?: string;
  steps?: Step[];
  attachments?: Attachment[];
};

export const StepSchema: z.ZodType<Step> = z.lazy(() =>
  z.object({
    name: z.string(),
    status: TestStatusSchema,
    durationMs: z.number().optional(),
    errorMessage: z.string().optional(),
    steps: z.array(StepSchema).optional(),
    attachments: z.array(AttachmentSchema).optional(),
  }),
);

export type TestCase = {
  id: string;
  name: string;
  fullName?: string;
  status: TestStatus;
  durationMs?: number;
  startTime?: number;
  stopTime?: number;
  tags: string[];
  description?: string;
  errorMessage?: string;
  stackTrace?: string;
  steps: Step[];
  attachments: Attachment[];
  parameters?: Record<string, string>;
  historyId?: string;
};

export const TestCaseSchema: z.ZodType<TestCase> = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string().optional(),
  status: TestStatusSchema,
  durationMs: z.number().optional(),
  startTime: z.number().optional(),
  stopTime: z.number().optional(),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
  errorMessage: z.string().optional(),
  stackTrace: z.string().optional(),
  steps: z.array(StepSchema).default([]),
  attachments: z.array(AttachmentSchema).default([]),
  parameters: z.record(z.string(), z.string()).optional(),
  historyId: z.string().optional(),
});

export type Suite = {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  tests: TestCase[];
  suites: Suite[];
};

export const SuiteSchema: z.ZodType<Suite> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    tests: z.array(TestCaseSchema).default([]),
    suites: z.array(SuiteSchema).default([]),
  }),
);

export const RunMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  sourceFormat: z.enum([
    "cucumber",
    "allure",
    "junit",
    "testng",
    "playwright",
    "jest",
    "pytest",
    "unknown",
  ]),
  importedAt: z.string(),
  environment: z.record(z.string(), z.string()).optional(),
});
export type RunMeta = z.infer<typeof RunMetaSchema>;

export type TestRun = {
  meta: RunMeta;
  suites: Suite[];
};

export const TestRunSchema: z.ZodType<TestRun> = z.object({
  meta: RunMetaSchema,
  suites: z.array(SuiteSchema),
});

export type StatusCounts = Record<TestStatus, number>;

export function emptyStatusCounts(): StatusCounts {
  return {
    passed: 0,
    failed: 0,
    broken: 0,
    skipped: 0,
    pending: 0,
    unknown: 0,
  };
}

export function flattenTests(suites: Suite[]): TestCase[] {
  const out: TestCase[] = [];
  const walk = (suite: Suite) => {
    out.push(...suite.tests);
    suite.suites.forEach(walk);
  };
  suites.forEach(walk);
  return out;
}

export function countStatuses(run: TestRun): StatusCounts {
  const counts = emptyStatusCounts();
  for (const test of flattenTests(run.suites)) {
    counts[test.status] += 1;
  }
  return counts;
}

export function totalDurationMs(run: TestRun): number {
  return flattenTests(run.suites).reduce(
    (sum, test) => sum + (test.durationMs ?? 0),
    0,
  );
}

export function createRunId(prefix = "run"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
