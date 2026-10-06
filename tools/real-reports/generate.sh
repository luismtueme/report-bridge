#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/public/samples/real"
TOOLS="$ROOT/tools/real-reports"
export PATH="$HOME/.local/bin:$PATH"
export CUCUMBER_PUBLISH_ENABLED=false

mkdir -p "$OUT/allure-results"
cd "$TOOLS"

echo "==> Jest JSON"
./node_modules/.bin/jest --config=./jest.config.js --json --outputFile="$OUT/jest-report.json" || true

echo "==> pytest JSON + JUnit XML"
python3 -m pytest pytest/test_pricing.py --json-report --json-report-file="$OUT/pytest-report.json" --junitxml="$OUT/junit-from-pytest.xml" || true

echo "==> Playwright browsers (chromium)"
./node_modules/.bin/playwright install chromium
echo "==> Playwright JSON + Allure results"
./node_modules/.bin/playwright test -c playwright.config.js || true

echo "==> Cucumber JSON"
./node_modules/.bin/cucumber-js --require cucumber/steps.js --format "json:$OUT/cucumber-report.json" cucumber/features || true

echo "==> JUnit Surefire XML"
(cd junit && mvn -q -DskipTests=false test) || true
if ls junit/target/surefire-reports/TEST-*.xml >/dev/null 2>&1; then
  cp junit/target/surefire-reports/TEST-*.xml "$OUT/junit-report.xml"
fi

echo "Generated:"
find "$OUT" -maxdepth 2 -type f | sort

# Keep a stable manifest for the web UI (no directory listing in Vite).
python3 - <<PY
from pathlib import Path
import json
root = Path("$OUT") / "allure-results"
files = sorted(p.name for p in root.glob("*-result.json"))
(Path("$OUT") / "allure-index.json").write_text(json.dumps(files, indent=2) + "\n")
print(f"Wrote allure-index.json ({len(files)} results)")
PY
