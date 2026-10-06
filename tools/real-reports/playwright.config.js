import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  timeout: 45_000,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "../../public/samples/real/playwright-report.json" }],
    ["allure-playwright", { resultsDir: "../../public/samples/real/allure-results" }],
  ],
  use: {
    headless: true,
    screenshot: "only-on-failure",
  },
});
