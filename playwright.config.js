import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "pixel",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "pnpm exec vite --config e2e/fixtures/vite.config.js",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
  },
});
