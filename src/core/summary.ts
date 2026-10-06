import {
  countStatuses,
  flattenTests,
  totalDurationMs,
  type TestRun,
  type TestStatus,
} from "./ir";

export type RunSummary = {
  id: string;
  name: string;
  sourceFormat: string;
  total: number;
  counts: Record<TestStatus, number>;
  passRate: number;
  durationMs: number;
  failedTests: Array<{ name: string; status: TestStatus; errorMessage?: string }>;
  suites: number;
};

export function summarizeRun(run: TestRun): RunSummary {
  const tests = flattenTests(run.suites);
  const counts = countStatuses(run);
  const total = tests.length;
  const passRate = total === 0 ? 0 : counts.passed / total;

  return {
    id: run.meta.id,
    name: run.meta.name,
    sourceFormat: run.meta.sourceFormat,
    total,
    counts,
    passRate,
    durationMs: totalDurationMs(run),
    failedTests: tests
      .filter((t) => t.status === "failed" || t.status === "broken")
      .map((t) => ({
        name: t.name,
        status: t.status,
        errorMessage: t.errorMessage,
      })),
    suites: run.suites.length,
  };
}

export function formatDuration(ms?: number): string {
  if (ms == null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = ((ms % 60_000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

export function formatPassRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
