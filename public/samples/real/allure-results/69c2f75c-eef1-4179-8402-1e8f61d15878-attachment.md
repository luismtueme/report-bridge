# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: saucedemo.spec.js >> Sauce Demo login >> intentionally wrong assertion for failure sample
- Location: playwright/saucedemo.spec.js:23:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('.title')
Expected: "Inventory"
Received: "Products"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('.title') with timeout 5000ms
  - waiting for locator('.title')
    13 × locator resolved to <span class="title" data-test="title">Products</span>
       - unexpected value "Products"

```

```yaml
- text: Products
```

# Test source

```ts
  1  | // @ts-check
  2  | const { test, expect } = require("@playwright/test");
  3  | 
  4  | test.describe("Sauce Demo login", () => {
  5  |   test("signs in with valid credentials @smoke", async ({ page }) => {
  6  |     await page.goto("https://www.saucedemo.com/");
  7  |     await page.locator("[data-test=username]").fill("standard_user");
  8  |     await page.locator("[data-test=password]").fill("secret_sauce");
  9  |     await page.locator("[data-test=login-button]").click();
  10 |     await expect(page.locator(".title")).toHaveText("Products");
  11 |   });
  12 | 
  13 |   test("shows error for locked out user @auth", async ({ page }) => {
  14 |     await page.goto("https://www.saucedemo.com/");
  15 |     await page.locator("[data-test=username]").fill("locked_out_user");
  16 |     await page.locator("[data-test=password]").fill("secret_sauce");
  17 |     await page.locator("[data-test=login-button]").click();
  18 |     await expect(page.locator("[data-test=error]")).toHaveText(
  19 |       "Epic sadface: Sorry, this user has been locked out.",
  20 |     );
  21 |   });
  22 | 
  23 |   test("intentionally wrong assertion for failure sample", async ({ page }) => {
  24 |     await page.goto("https://www.saucedemo.com/");
  25 |     await page.locator("[data-test=username]").fill("standard_user");
  26 |     await page.locator("[data-test=password]").fill("secret_sauce");
  27 |     await page.locator("[data-test=login-button]").click();
  28 |     // Real failure for importer testing
> 29 |     await expect(page.locator(".title")).toHaveText("Inventory");
     |                                          ^ Error: expect(locator).toHaveText(expected) failed
  30 |   });
  31 | 
  32 |   test.skip("checkout flow not covered in smoke pack", async () => {
  33 |     // skipped on purpose
  34 |   });
  35 | });
  36 | 
```