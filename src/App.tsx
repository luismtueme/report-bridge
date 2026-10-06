import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  REPORT_SKINS,
  skinComparisonNotes,
  type ReportSkinId,
} from "./core/compare";
import { importAllureResults, type AllureResult } from "./core/importers/allure";
import { importFromText } from "./core/importers/detect";
import type { TestRun } from "./core/ir";
import { formatDuration, formatPassRate, summarizeRun } from "./core/summary";
import {
  AllureSkin,
  CucumberSkin,
  ExtentSkin,
} from "./components/ReportSkins";

type SampleId =
  | "cucumber"
  | "allure"
  | "junit"
  | "testng"
  | "jest"
  | "playwright"
  | "pytest";

const SAMPLE_BUTTONS: Array<{ id: SampleId; label: string }> = [
  { id: "cucumber", label: "Cucumber" },
  { id: "allure", label: "Allure" },
  { id: "junit", label: "JUnit XML" },
  { id: "testng", label: "TestNG XML" },
  { id: "jest", label: "Jest" },
  { id: "playwright", label: "Playwright" },
  { id: "pytest", label: "pytest" },
];

type RealSampleId =
  | "real-cucumber"
  | "real-allure"
  | "real-junit"
  | "real-jest"
  | "real-playwright"
  | "real-pytest";

const REAL_SAMPLE_BUTTONS: Array<{ id: RealSampleId; label: string }> = [
  { id: "real-cucumber", label: "Real Cucumber" },
  { id: "real-allure", label: "Real Allure" },
  { id: "real-junit", label: "Real JUnit" },
  { id: "real-jest", label: "Real Jest" },
  { id: "real-playwright", label: "Real Playwright" },
  { id: "real-pytest", label: "Real pytest" },
];

type UserSampleId =
  | "user-cucumber"
  | "user-allure"
  | "user-junit"
  | "user-testng"
  | "user-jest"
  | "user-playwright"
  | "user-pytest";

const USER_SAMPLE_BUTTONS: Array<{ id: UserSampleId; label: string }> = [
  { id: "user-cucumber", label: "Yours: Cucumber" },
  { id: "user-allure", label: "Yours: Allure" },
  { id: "user-junit", label: "Yours: JUnit" },
  { id: "user-testng", label: "Yours: TestNG" },
  { id: "user-jest", label: "Yours: Jest" },
  { id: "user-playwright", label: "Yours: Playwright" },
  { id: "user-pytest", label: "Yours: pytest" },
];

async function loadTextSample(
  path: string,
  name: string,
): Promise<TestRun> {
  const response = await fetch(path);
  const text = await response.text();
  return importFromText(text, { name });
}

async function loadAllureSample(): Promise<TestRun> {
  const files = [
    "login-passed-result.json",
    "login-failed-result.json",
    "inventory-broken-result.json",
    "inventory-skipped-result.json",
  ];
  const results: AllureResult[] = [];
  for (const file of files) {
    const response = await fetch(`/samples/allure/${file}`);
    results.push((await response.json()) as AllureResult);
  }
  return importAllureResults(results, { name: "Sample Allure run" });
}

async function loadRealAllureSample(): Promise<TestRun> {
  const index = await fetch("/samples/real/allure-index.json");
  const files = (await index.json()) as string[];
  const results: AllureResult[] = [];
  for (const file of files) {
    const fileResponse = await fetch(`/samples/real/allure-results/${file}`);
    results.push((await fileResponse.json()) as AllureResult);
  }
  return importAllureResults(results, { name: "Real Allure run (Sauce Demo)" });
}

async function loadUserAllureSample(): Promise<TestRun> {
  const index = await fetch("/samples/user-all-formats/allure-index.json");
  const files = (await index.json()) as string[];
  const results: AllureResult[] = [];
  for (const file of files) {
    const fileResponse = await fetch(
      `/samples/user-all-formats/allure-results/${file}`,
    );
    results.push((await fileResponse.json()) as AllureResult);
  }
  return importAllureResults(results, {
    name: "Your Allure pack",
  });
}

async function loadSampleRun(
  id: SampleId | RealSampleId | UserSampleId,
): Promise<{ run: TestRun; label: string }> {
  switch (id) {
    case "cucumber":
      return {
        run: await loadTextSample(
          "/samples/cucumber-report.json",
          "Sample Cucumber run",
        ),
        label: "Sample Cucumber JSON",
      };
    case "allure":
      return { run: await loadAllureSample(), label: "Sample Allure results" };
    case "junit":
      return {
        run: await loadTextSample("/samples/junit-report.xml", "Sample JUnit run"),
        label: "Sample JUnit XML",
      };
    case "testng":
      return {
        run: await loadTextSample(
          "/samples/testng-report.xml",
          "Sample TestNG run",
        ),
        label: "Sample TestNG XML",
      };
    case "jest":
      return {
        run: await loadTextSample("/samples/jest-report.json", "Sample Jest run"),
        label: "Sample Jest JSON",
      };
    case "playwright":
      return {
        run: await loadTextSample(
          "/samples/playwright-report.json",
          "Sample Playwright run",
        ),
        label: "Sample Playwright JSON",
      };
    case "pytest":
      return {
        run: await loadTextSample(
          "/samples/pytest-report.json",
          "Sample pytest run",
        ),
        label: "Sample pytest-json-report",
      };
    case "real-cucumber":
      return {
        run: await loadTextSample(
          "/samples/real/cucumber-report.json",
          "Real Cucumber run (Sauce Demo)",
        ),
        label: "Real Cucumber JSON · Sauce Demo",
      };
    case "real-allure":
      return {
        run: await loadRealAllureSample(),
        label: "Real Allure results · Sauce Demo",
      };
    case "real-junit":
      return {
        run: await loadTextSample(
          "/samples/real/junit-report.xml",
          "Real JUnit Surefire run",
        ),
        label: "Real JUnit XML · Maven Surefire",
      };
    case "real-jest":
      return {
        run: await loadTextSample(
          "/samples/real/jest-report.json",
          "Real Jest run",
        ),
        label: "Real Jest JSON",
      };
    case "real-playwright":
      return {
        run: await loadTextSample(
          "/samples/real/playwright-report.json",
          "Real Playwright run (Sauce Demo)",
        ),
        label: "Real Playwright JSON · Sauce Demo",
      };
    case "real-pytest":
      return {
        run: await loadTextSample(
          "/samples/real/pytest-report.json",
          "Real pytest run",
        ),
        label: "Real pytest-json-report",
      };
    case "user-cucumber":
      return {
        run: await loadTextSample(
          "/samples/user-all-formats/cucumber-report.json",
          "Your Cucumber pack",
        ),
        label: "Your pack · Cucumber JSON",
      };
    case "user-allure":
      return {
        run: await loadUserAllureSample(),
        label: "Your pack · Allure results",
      };
    case "user-junit":
      return {
        run: await loadTextSample(
          "/samples/user-all-formats/TEST-sample.xml",
          "Your JUnit pack",
        ),
        label: "Your pack · JUnit XML",
      };
    case "user-testng":
      return {
        run: await loadTextSample(
          "/samples/user-all-formats/testng-results.xml",
          "Your TestNG pack",
        ),
        label: "Your pack · TestNG XML",
      };
    case "user-jest":
      return {
        run: await loadTextSample(
          "/samples/user-all-formats/jest-report.json",
          "Your Jest pack",
        ),
        label: "Your pack · Jest JSON",
      };
    case "user-playwright":
      return {
        run: await loadTextSample(
          "/samples/user-all-formats/playwright-report.json",
          "Your Playwright pack",
        ),
        label: "Your pack · Playwright JSON",
      };
    case "user-pytest":
      return {
        run: await loadTextSample(
          "/samples/user-all-formats/pytest-report.json",
          "Your pytest pack",
        ),
        label: "Your pack · pytest JSON",
      };
  }
}

function SkinView({ skin, run }: { skin: ReportSkinId; run: TestRun }) {
  if (skin === "cucumber") return <CucumberSkin run={run} />;
  if (skin === "allure") return <AllureSkin run={run} />;
  return <ExtentSkin run={run} />;
}

export default function App() {
  const [run, setRun] = useState<TestRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSkin, setActiveSkin] = useState<ReportSkinId>("cucumber");
  const [compareMode, setCompareMode] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("Sample Cucumber JSON");
  const [activeSample, setActiveSample] = useState<
    SampleId | RealSampleId | UserSampleId
  >("cucumber");

  useEffect(() => {
    void (async () => {
      try {
        const sample = await loadSampleRun("cucumber");
        setRun(sample.run);
        setSourceLabel(sample.label);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sample");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = useMemo(() => (run ? summarizeRun(run) : null), [run]);
  const notes = useMemo(() => (run ? skinComparisonNotes(run) : []), [run]);

  async function loadSample(id: SampleId | RealSampleId | UserSampleId) {
    setLoading(true);
    setError(null);
    try {
      const sample = await loadSampleRun(id);
      setRun(sample.run);
      setSourceLabel(sample.label);
      setActiveSample(id);
      setActiveSkin(
        id.includes("cucumber")
          ? "cucumber"
          : id.includes("allure")
            ? "allure"
            : "extent",
      );
      setCompareMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sample");
    } finally {
      setLoading(false);
    }
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;
    setLoading(true);
    setError(null);
    try {
      if (files.length === 1) {
        const text = await files[0].text();
        const next = importFromText(text, { name: files[0].name });
        setRun(next);
        setSourceLabel(files[0].name);
      } else {
        const texts = await Promise.all([...files].map((file) => file.text()));
        const results = texts.map((text) => JSON.parse(text) as AllureResult);
        const next = importAllureResults(results, {
          name: `${files.length} Allure result files`,
        });
        setRun(next);
        setSourceLabel(`${files.length} uploaded Allure files`);
        setActiveSkin("allure");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not import that file. Supported: Cucumber, Allure, JUnit/TestNG XML, Playwright, Jest, pytest JSON.",
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden="true" />
      <header className="hero">
        <div className="hero-copy">
          <p className="brand">ReportBridge</p>
          <h1>One test run. Three reporting styles.</h1>
          <p className="lede">
            Import Cucumber, Allure, JUnit/TestNG XML, Playwright, Jest, or pytest
            results into a shared IR, then preview Cucumber-style, Allure-like, and
            Extent-like reports before you commit to a stack.
          </p>
          <div className="hero-actions">
            <div className="sample-row" role="group" aria-label="Synthetic sample formats">
              {SAMPLE_BUTTONS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className={
                    activeSample === sample.id ? "btn primary" : "btn"
                  }
                  onClick={() => void loadSample(sample.id)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
            <div className="sample-row" role="group" aria-label="Real framework artifacts">
              {REAL_SAMPLE_BUTTONS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className={
                    activeSample === sample.id ? "btn primary" : "btn"
                  }
                  onClick={() => void loadSample(sample.id)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
            <div className="sample-row" role="group" aria-label="Your all-format sample pack">
              {USER_SAMPLE_BUTTONS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className={
                    activeSample === sample.id ? "btn primary" : "btn"
                  }
                  onClick={() => void loadSample(sample.id)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
            <label className="btn file-btn">
              Upload report
              <input
                type="file"
                accept="application/json,.json,text/xml,application/xml,.xml"
                multiple
                onChange={(event) => void onUpload(event)}
              />
            </label>
          </div>
        </div>
        <div className="hero-panel">
          <p className="panel-label">Current run</p>
          {loading && !run ? <p>Loading sample…</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {summary ? (
            <>
              <h2>{summary.name}</h2>
              <p className="muted">{sourceLabel}</p>
              <dl className="stat-list">
                <div>
                  <dt>Source</dt>
                  <dd>{summary.sourceFormat}</dd>
                </div>
                <div>
                  <dt>Tests</dt>
                  <dd>{summary.total}</dd>
                </div>
                <div>
                  <dt>Pass rate</dt>
                  <dd>{formatPassRate(summary.passRate)}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{formatDuration(summary.durationMs)}</dd>
                </div>
              </dl>
            </>
          ) : null}
        </div>
      </header>

      <section className="controls">
        <div className="skin-tabs" role="tablist" aria-label="Report skins">
          {REPORT_SKINS.map((skin) => (
            <button
              key={skin.id}
              type="button"
              role="tab"
              aria-selected={!compareMode && activeSkin === skin.id}
              className={!compareMode && activeSkin === skin.id ? "tab active" : "tab"}
              onClick={() => {
                setCompareMode(false);
                setActiveSkin(skin.id);
              }}
            >
              {skin.name}
            </button>
          ))}
          <button
            type="button"
            className={compareMode ? "tab active" : "tab"}
            onClick={() => setCompareMode(true)}
          >
            Compare all
          </button>
        </div>
        <p className="controls-note">
          Skins are visual approximations for evaluation — not drop-in replacements for
          native Allure CLI, ExtentReports, or Serenity.
        </p>
      </section>

      {run && !compareMode ? (
        <section className="preview-stage">
          <SkinView skin={activeSkin} run={run} />
          <aside className="advice">
            <h3>Why this skin</h3>
            {notes
              .filter((note) => note.skin === activeSkin)
              .map((note) => (
                <div key={note.skin}>
                  <p className="advice-blurb">
                    {REPORT_SKINS.find((skin) => skin.id === note.skin)?.blurb}
                  </p>
                  <h4>Strengths</h4>
                  <ul>
                    {note.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <h4>Watchouts</h4>
                  <ul>
                    {note.watchouts.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </aside>
        </section>
      ) : null}

      {run && compareMode ? (
        <section className="compare-stage">
          {REPORT_SKINS.map((skin) => (
            <div key={skin.id} className="compare-column">
              <SkinView skin={skin.id} run={run} />
            </div>
          ))}
        </section>
      ) : null}

      {!run && !loading ? (
        <section className="empty-state">
          <h2>No run loaded</h2>
          <p>
            Load a sample or upload Cucumber, Allure, JUnit/TestNG XML, Playwright,
            Jest, or pytest JSON to begin.
          </p>
        </section>
      ) : null}

      <footer className="site-footer">
        <p>
          ReportBridge · IR importers for common CI artifacts · three preview skins ·
          MCP tools in <code>src/mcp/server.ts</code>
        </p>
      </footer>
    </div>
  );
}
