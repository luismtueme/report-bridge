import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  REPORT_SKINS,
  skinComparisonNotes,
  type ReportSkinId,
} from "./core/compare";
import { importAllureResults, type AllureResult } from "./core/importers/allure";
import { parseCucumberJsonText } from "./core/importers/cucumber";
import { importFromText } from "./core/importers/detect";
import type { TestRun } from "./core/ir";
import { formatDuration, formatPassRate, summarizeRun } from "./core/summary";
import {
  AllureSkin,
  CucumberSkin,
  ExtentSkin,
} from "./components/ReportSkins";

type SampleId = "cucumber" | "allure";

async function loadCucumberSample(): Promise<TestRun> {
  const response = await fetch("/samples/cucumber-report.json");
  const text = await response.text();
  return parseCucumberJsonText(text, { name: "Sample Cucumber run" });
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

  useEffect(() => {
    void (async () => {
      try {
        const sample = await loadCucumberSample();
        setRun(sample);
        setSourceLabel("Sample Cucumber JSON");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sample");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = useMemo(() => (run ? summarizeRun(run) : null), [run]);
  const notes = useMemo(() => (run ? skinComparisonNotes(run) : []), [run]);

  async function loadSample(id: SampleId) {
    setLoading(true);
    setError(null);
    try {
      const next = id === "cucumber" ? await loadCucumberSample() : await loadAllureSample();
      setRun(next);
      setSourceLabel(id === "cucumber" ? "Sample Cucumber JSON" : "Sample Allure results");
      setActiveSkin(id === "cucumber" ? "cucumber" : "allure");
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
          : "Could not import that file. Use Cucumber JSON or Allure *-result.json.",
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
            Import Cucumber JSON or Allure results into a shared IR, then preview
            Cucumber-style, Allure-like, and Extent-like reports before you commit
            to a stack.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn primary" onClick={() => void loadSample("cucumber")}>
              Load Cucumber sample
            </button>
            <button type="button" className="btn" onClick={() => void loadSample("allure")}>
              Load Allure sample
            </button>
            <label className="btn file-btn">
              Upload JSON
              <input
                type="file"
                accept="application/json,.json"
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
          <p>Load a sample or upload Cucumber JSON / Allure result files to begin.</p>
        </section>
      ) : null}

      <footer className="site-footer">
        <p>
          ReportBridge MVP · IR + Cucumber/Allure import · three preview skins · MCP tools in{" "}
          <code>src/mcp/server.ts</code>
        </p>
      </footer>
    </div>
  );
}
