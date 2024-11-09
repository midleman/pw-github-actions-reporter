import type { GitHubActionOptions } from "./src/models/GitHubActionOptions";
import { PlaywrightTestConfig, defineConfig, devices } from "@playwright/test";

const config: PlaywrightTestConfig<{}, {}> = {
  testDir: "./tests",
  timeout: 3 * 60 * 1000,
  expect: {
    timeout: 30 * 1000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 2,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    // ["list"],
    [
      "./src/index.ts",
      <GitHubActionOptions>{
        title: "",
        useDetails: true,
        showError: true,
        showAnnotations: false,
        includeResults: ["fail", "flaky"],
      },
    ],
  ],
  use: {
    actionTimeout: 0,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: "setup.spec.ts",
    },
    {
      name: "chromium",
      // dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // {
    //   name: "firefox",
    //   // dependencies: ["setup"],
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    // },
  ],
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(config);
