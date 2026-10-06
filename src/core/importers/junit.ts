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
    ["testsuite", "testcase", "property", "failure", "error", "skipped"].includes(
      name,
    ),
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
  }
  return undefined;
}

function secondsToMs(value?: string): number | undefined {
  if (value == null || value === "") return undefined;
  const seconds = Number(value);
  if (Number.isNaN(seconds)) return undefined;
  return Math.round(seconds * 1000);
}

function mapCase(node: XmlNode, index: number, suiteName: string): TestCase {
  const failures = asArray(node.failure as XmlNode | XmlNode[] | undefined);
  const errors = asArray(node.error as XmlNode | XmlNode[] | undefined);
  const skipped = asArray(node.skipped as XmlNode | XmlNode[] | undefined);

  let status: TestStatus = "passed";
  let errorMessage: string | undefined;
  let stackTrace: string | undefined;

  if (failures.length) {
    status = "failed";
    const failure = failures[0];
    errorMessage = attr(failure, "message") ?? textContent(failure);
    stackTrace = textContent(failure);
  } else if (errors.length) {
    status = "broken";
    const error = errors[0];
    errorMessage = attr(error, "message") ?? textContent(error);
    stackTrace = textContent(error);
  } else if (skipped.length || attr(node, "status") === "skipped") {
    status = "skipped";
    errorMessage = attr(skipped[0], "message") ?? textContent(skipped[0]);
  }

  const className = attr(node, "classname");
  const name = attr(node, "name") ?? `Test ${index + 1}`;

  return {
    id: `${suiteName}::${className ?? "case"}::${name}::${index}`,
    name,
    fullName: className ? `${className}.${name}` : name,
    status,
    durationMs: secondsToMs(attr(node, "time")),
    tags: className ? [className] : [],
    errorMessage,
    stackTrace:
      stackTrace && stackTrace !== errorMessage ? stackTrace : undefined,
    steps: [],
    attachments: [],
  };
}

function mapSuite(node: XmlNode, index: number): Suite {
  const name = attr(node, "name") ?? `Suite ${index + 1}`;
  const nested = asArray(node.testsuite as XmlNode | XmlNode[] | undefined).map(
    (child, childIndex) => mapSuite(child, childIndex),
  );
  const tests = asArray(node.testcase as XmlNode | XmlNode[] | undefined).map(
    (testCase, caseIndex) => mapCase(testCase, caseIndex, name),
  );

  return {
    id: attr(node, "id") ?? `${name}-${index}`,
    name,
    tags: [],
    tests,
    suites: nested,
  };
}

function extractSuites(doc: XmlNode): Suite[] {
  if (doc.testsuites) {
    const root = doc.testsuites as XmlNode;
    const suites = asArray(root.testsuite as XmlNode | XmlNode[] | undefined);
    if (suites.length) return suites.map((suite, index) => mapSuite(suite, index));
    return [mapSuite(root, 0)];
  }
  if (doc.testsuite) {
    return asArray(doc.testsuite as XmlNode | XmlNode[] | undefined).map(
      (suite, index) => mapSuite(suite, index),
    );
  }
  return [];
}

export function isJUnitXml(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith("<")) return false;
  return (
    /<testsuites[\s>]/i.test(trimmed) ||
    /<testsuite[\s>]/i.test(trimmed)
  ) && !/<testng-results[\s>]/i.test(trimmed);
}

export function importJUnitXml(
  xml: string,
  options?: { name?: string },
): TestRun {
  const doc = parser.parse(xml) as XmlNode;
  const suites = extractSuites(doc);
  if (!suites.length) {
    throw new Error("No <testsuite> / <testcase> elements found in JUnit XML.");
  }

  return {
    meta: {
      id: createRunId("junit"),
      name: options?.name ?? "JUnit import",
      sourceFormat: "junit",
      importedAt: new Date().toISOString(),
    },
    suites,
  };
}
