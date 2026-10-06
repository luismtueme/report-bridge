// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Sauce Demo login", () => {
  test("signs in with valid credentials @smoke", async ({ page }) => {
    await page.goto("https://www.saucedemo.com/");
    await page.locator("[data-test=username]").fill("standard_user");
    await page.locator("[data-test=password]").fill("secret_sauce");
    await page.locator("[data-test=login-button]").click();
    await expect(page.locator(".title")).toHaveText("Products");
  });

  test("shows error for locked out user @auth", async ({ page }) => {
    await page.goto("https://www.saucedemo.com/");
    await page.locator("[data-test=username]").fill("locked_out_user");
    await page.locator("[data-test=password]").fill("secret_sauce");
    await page.locator("[data-test=login-button]").click();
    await expect(page.locator("[data-test=error]")).toHaveText(
      "Epic sadface: Sorry, this user has been locked out.",
    );
  });

  test("intentionally wrong assertion for failure sample", async ({ page }) => {
    await page.goto("https://www.saucedemo.com/");
    await page.locator("[data-test=username]").fill("standard_user");
    await page.locator("[data-test=password]").fill("secret_sauce");
    await page.locator("[data-test=login-button]").click();
    // Real failure for importer testing
    await expect(page.locator(".title")).toHaveText("Inventory");
  });

  test.skip("checkout flow not covered in smoke pack", async () => {
    // skipped on purpose
  });
});
