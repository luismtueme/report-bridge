const {
  Given,
  When,
  Then,
  After,
  setDefaultTimeout,
} = require("@cucumber/cucumber");
const { chromium } = require("playwright");
const assert = require("node:assert/strict");

setDefaultTimeout(60_000);

let browser;
let page;

After(async function () {
  if (browser) {
    await browser.close().catch(() => undefined);
    browser = undefined;
    page = undefined;
  }
});

Given("the shopper opens Sauce Demo", async function () {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
  await page.goto("https://www.saucedemo.com/");
});

When("they sign in as {string}", async function (username) {
  await page.locator("[data-test=username]").fill(username);
  await page.locator("[data-test=password]").fill("secret_sauce");
  await page.locator("[data-test=login-button]").click();
});

Then("the products title is shown", async function () {
  const text = await page.locator(".title").innerText();
  assert.equal(text, "Products");
});

Then("a lockout error is shown", async function () {
  const text = await page.locator("[data-test=error]").innerText();
  assert.match(text, /locked out/i);
});

Then("the title is {string}", async function (expected) {
  const text = await page.locator(".title").innerText();
  assert.equal(text, expected);
});
