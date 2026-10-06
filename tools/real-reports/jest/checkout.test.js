const { add, applyDiscount } = require("./math");

describe("checkout math", () => {
  test("adds line items", () => {
    expect(add(12, 8)).toBe(20);
  });

  test("applies member discount", () => {
    expect(applyDiscount(100, true)).toBe(90);
  });

  test("rejects empty cart total", () => {
    // Intentionally failing — real failure artifact for ReportBridge
    expect(applyDiscount(0, false)).toBe(1);
  });

  test.todo("supports gift notes");
});
