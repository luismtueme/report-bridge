import type { TestCase, TestRun, TestStatus } from "../core/ir";
import { flattenTests } from "../core/ir";
import { formatDuration, formatPassRate, summarizeRun } from "../core/summary";

const statusClass: Record<TestStatus, string> = {
  passed: "status-passed",
  failed: "status-failed",
  broken: "status-broken",
  skipped: "status-skipped",
  pending: "status-pending",
  unknown: "status-unknown",
};

function StatusPill({ status }: { status: TestStatus }) {
  return <span className={`status-pill ${statusClass[status]}`}>{status}</span>;
}

function SummaryStrip({ run }: { run: TestRun }) {
  const summary = summarizeRun(run);
  return (
    <div className="summary-strip">
      <div>
        <strong>{summary.total}</strong>
        <span>tests</span>
      </div>
      <div>
        <strong>{formatPassRate(summary.passRate)}</strong>
        <span>pass rate</span>
      </div>
      <div>
        <strong>{formatDuration(summary.durationMs)}</strong>
        <span>duration</span>
      </div>
      <div>
        <strong>{summary.counts.failed + summary.counts.broken}</strong>
        <span>failures</span>
      </div>
    </div>
  );
}

export function CucumberSkin({ run }: { run: TestRun }) {
  return (
    <article className="skin skin-cucumber">
      <header className="skin-header">
        <p className="skin-kicker">Cucumber-style</p>
        <h3>{run.meta.name}</h3>
        <SummaryStrip run={run} />
      </header>
      <div className="skin-body">
        {run.suites.map((suite) => (
          <section key={suite.id} className="feature-block">
            <h4>
              <span className="gherkin-kw">Feature:</span> {suite.name}
            </h4>
            {suite.description ? (
              <p className="feature-desc">{suite.description}</p>
            ) : null}
            {suite.tests.map((test) => (
              <div key={test.id} className="scenario-block">
                <div className="scenario-title">
                  <StatusPill status={test.status} />
                  <h5>
                    <span className="gherkin-kw">Scenario:</span> {test.name}
                  </h5>
                  <span className="muted">{formatDuration(test.durationMs)}</span>
                </div>
                <ul className="step-list">
                  {test.steps.map((step, index) => (
                    <li key={`${test.id}-${index}`} className={statusClass[step.status]}>
                      <code>{step.name}</code>
                      {step.errorMessage ? (
                        <pre className="error-block">{step.errorMessage}</pre>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}

function TestDetail({ test }: { test: TestCase }) {
  return (
    <details className="allure-test" open={test.status === "failed" || test.status === "broken"}>
      <summary>
        <StatusPill status={test.status} />
        <span className="test-name">{test.name}</span>
        <span className="muted">{formatDuration(test.durationMs)}</span>
      </summary>
      {test.tags.length ? (
        <div className="tag-row">
          {test.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {test.errorMessage ? <pre className="error-block">{test.errorMessage}</pre> : null}
      {test.stackTrace ? <pre className="stack-block">{test.stackTrace}</pre> : null}
      {test.steps.length ? (
        <ol className="allure-steps">
          {test.steps.map((step, index) => (
            <li key={`${test.id}-step-${index}`}>
              <StatusPill status={step.status} />
              <span>{step.name}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {test.attachments.length ? (
        <p className="muted">
          Attachments: {test.attachments.map((item) => item.name).join(", ")}
        </p>
      ) : null}
    </details>
  );
}

export function AllureSkin({ run }: { run: TestRun }) {
  return (
    <article className="skin skin-allure">
      <header className="skin-header">
        <p className="skin-kicker">Allure-like</p>
        <h3>{run.meta.name}</h3>
        <SummaryStrip run={run} />
      </header>
      <div className="skin-body allure-grid">
        <aside className="allure-suites">
          <h4>Suites</h4>
          <ul>
            {run.suites.map((suite) => (
              <li key={suite.id}>
                <strong>{suite.name}</strong>
                <span className="muted">{suite.tests.length}</span>
              </li>
            ))}
          </ul>
        </aside>
        <div className="allure-main">
          {run.suites.map((suite) => (
            <section key={suite.id}>
              <h4>{suite.name}</h4>
              {suite.tests.map((test) => (
                <TestDetail key={test.id} test={test} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

export function ExtentSkin({ run }: { run: TestRun }) {
  const summary = summarizeRun(run);
  const tests = flattenTests(run.suites);

  return (
    <article className="skin skin-extent">
      <header className="skin-header">
        <p className="skin-kicker">Extent-like</p>
        <h3>{run.meta.name}</h3>
      </header>
      <div className="extent-cards">
        <div className="extent-card">
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="extent-card passed">
          <span>Passed</span>
          <strong>{summary.counts.passed}</strong>
        </div>
        <div className="extent-card failed">
          <span>Failed</span>
          <strong>{summary.counts.failed}</strong>
        </div>
        <div className="extent-card broken">
          <span>Broken</span>
          <strong>{summary.counts.broken}</strong>
        </div>
        <div className="extent-card skipped">
          <span>Skipped</span>
          <strong>{summary.counts.skipped}</strong>
        </div>
      </div>
      <div className="skin-body">
        <table className="extent-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Test</th>
              <th>Suite</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => {
              const suite = run.suites.find((item) =>
                item.tests.some((candidate) => candidate.id === test.id),
              );
              return (
                <tr key={test.id} className={statusClass[test.status]}>
                  <td>
                    <StatusPill status={test.status} />
                  </td>
                  <td>
                    <div className="test-name">{test.name}</div>
                    {test.errorMessage ? (
                      <div className="table-error">{test.errorMessage}</div>
                    ) : null}
                  </td>
                  <td>{suite?.name ?? "—"}</td>
                  <td>{formatDuration(test.durationMs)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
