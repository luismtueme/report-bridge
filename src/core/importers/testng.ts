import { XMLParser } from "fast-xml-parser";
import {
  createRunId,
  type Suite,
  type TestCase,
  type TestRun,
  type TestStatus,
} from "../ir";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  isArray: (name) =>
    [
      "suite",
      "test",
      "class",
      "test-method",
      "group",
      "param",
      "exception",
      "line",
    ].includes(name),
});

type XmlNode = Record<string, unknown>;

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function attr(node: XmlNode | undefined, name: string): string | undefined {
  if (!node) return undefined;
  const value = node[`@_${name}`];
  return value == null ? undefined : String(value);
}

function textContent(node: unknown): string | undefined {
  if (node == null) return undefined;
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "object") {
    const record = node as XmlNode;
    if (record["#text"] != null) return String(record["#text"]);
    if (record.message != null) return textContent(record.message);
  }
  return undefined;
}

function mapStatus(status?: string): TestStatus {
  switch ((status ?? "").toUpperCase()) {
    case "PASS":
    case "PASSED":
    case "SUCCESS":
      return "passed";
    case "FAIL":
    case "FAILED":
    case "FAILURE":
      return "failed";
    case "SKIP":
    case "SKIPPED":
      return "skipped";
    case "IGNORE":
    case "IGNORED":
      return "pending";
    default:
      return "unknown";
  }
}

function mapReporterSteps(
  method: XmlNode,
  testStatus: TestStatus,
): import("../ir").Step[] {
  const output = method["reporter-output"] as XmlNode | undefined;
  const lines = asArray(output?.line as unknown)
    .map((line) => textContent(line)?.trim())
    .filter((line): line is string => Boolean(line));

  if (!lines.length) return [];

  return lines.map((line, index) => {
    const isLast = index === lines.length - 1;
    const looksLikeResult = /^RESULT:/i.test(line);
    let status: TestStatus = "passed";
    if (isLast || looksLikeResult) {
      status =
        testStatus === "failed" || testStatus === "broken"
          ? testStatus
          : testStatus === "skipped" || testStatus === "pending"
            ? testStatus
            : "passed";
    } else if (testStatus === "skipped" || testStatus === "pending") {
      status = testStatus;
    }
    return { name: line, status };
  });
}

function mapMethod(
  method: XmlNode,
  className: string,
  index: number,
): TestCase | null {
  const isConfig = (attr(method, "is-config") ?? "").toLowerCase() === "true";
  if (isConfig) return null;

  const name = attr(method, "name") ?? `method-${index + 1}`;
  const exception = asArray(
    method.exception as XmlNode | XmlNode[] | undefined,
  )[0];
  const status = mapStatus(attr(method, "status"));
  const params = asArray(method.params as XmlNode | XmlNode[] | undefined)
    .flatMap((paramsNode) =>
      asArray(paramsNode.param as XmlNode | XmlNode[] | undefined),
    )
    .map((param, paramIndex) => [
      attr(param, "index") ?? `arg${paramIndex}`,
      textContent(param.value) ?? attr(param, "value") ?? "",
    ]);

  const durationRaw = attr(method, "duration-ms");
  const durationMs = durationRaw != null ? Number(durationRaw) : undefined;
  const steps = mapReporterSteps(method, status);

  return {
    id: `${className}::${name}::${attr(method, "started-at") ?? index}`,
    name,
    fullName: `${className}.${name}`,
    status,
    durationMs: Number.isFinite(durationMs) ? durationMs : undefined,
    tags: [className],
    errorMessage: exception
      ? textContent(exception.message) ??
        attr(exception, "class") ??
        textContent(exception)
      : undefined,
    stackTrace: exception
      ? textContent(exception["full-stacktrace"])
      : undefined,
    steps,
    attachments: [],
    parameters: params.length ? Object.fromEntries(params) : undefined,
  };
}

function mapClass(classNode: XmlNode, index: number): Suite {
  const name = attr(classNode, "name") ?? `Class ${index + 1}`;
  const tests = asArray(
    classNode["test-method"] as XmlNode | XmlNode[] | undefined,
  )
    .map((method, methodIndex) => mapMethod(method, name, methodIndex))
    .filter((test): test is TestCase => test != null);

  return {
    id: name,
    name,
    tags: [],
    tests,
    suites: [],
  };
}

function mapTest(testNode: XmlNode, index: number): Suite {
  const name = attr(testNode, "name") ?? `Test ${index + 1}`;
  const classes = asArray(testNode.class as XmlNode | XmlNode[] | undefined).map(
    (classNode, classIndex) => mapClass(classNode, classIndex),
  );

  return {
    id: name,
    name,
    tags: [],
    tests: [],
    suites: classes,
  };
}

export function isTestNGXml(text: string): boolean {
  return /<testng-results[\s>]/i.test(text.trim());
}

export function importTestNGXml(
  xml: string,
  options?: { name?: string },
): TestRun {
  const doc = parser.parse(xml) as XmlNode;
  const root = doc["testng-results"] as XmlNode | undefined;
  if (!root) {
    throw new Error("No <testng-results> root found in TestNG XML.");
  }

  const suites = asArray(root.suite as XmlNode | XmlNode[] | undefined).map(
    (suiteNode, suiteIndex) => {
      const suiteName = attr(suiteNode, "name") ?? `Suite ${suiteIndex + 1}`;
      const tests = asArray(suiteNode.test as XmlNode | XmlNode[] | undefined).map(
        (testNode, testIndex) => mapTest(testNode, testIndex),
      );
      return {
        id: suiteName,
        name: suiteName,
        tags: [],
        tests: [] as TestCase[],
        suites: tests,
      } satisfies Suite;
    },
  );

  if (!suites.length) {
    throw new Error("No TestNG suites found.");
  }

  return {
    meta: {
      id: createRunId("testng"),
      name: options?.name ?? "TestNG import",
      sourceFormat: "testng",
      importedAt: new Date().toISOString(),
    },
    suites,
  };
}
