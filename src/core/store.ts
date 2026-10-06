import type { TestRun } from "./ir";

const runs = new Map<string, TestRun>();

export function saveRun(run: TestRun): TestRun {
  runs.set(run.meta.id, run);
  return run;
}

export function getRun(id: string): TestRun | undefined {
  return runs.get(id);
}

export function listRuns(): TestRun[] {
  return [...runs.values()].sort((a, b) =>
    b.meta.importedAt.localeCompare(a.meta.importedAt),
  );
}

export function clearRuns(): void {
  runs.clear();
}
