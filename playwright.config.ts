import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });

const IS_CI = !!process.env.CI;
const IS_HEADED = process.env.HEADED === '1' || process.env.HEADED === 'true';
const SLOW_MO = Number(process.env.SLOW_MO || 0);
const BROWSER_CHANNEL = process.env.BROWSER_CHANNEL;

// Only attach storageState if the file exists. This prevents Playwright from
// throwing during config load on CI/fresh checkouts where auth has not run.
const STORAGE_STATE_PATH = path.resolve(__dirname, 'src/auth/storageSession.json');
const STORAGE_STATE = fs.existsSync(STORAGE_STATE_PATH) ? STORAGE_STATE_PATH : undefined;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: './src/utils/globalSetup',
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: IS_CI,
  /* Retry on CI only */
  retries: IS_CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: IS_CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never' }], ['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.BASE_URL || 'https://vantagedashboard-stg.bcg.com/',
    storageState: STORAGE_STATE,
    browserName: 'chromium',
    headless: process.env.HEADLESS === '1' ? true : IS_HEADED ? false : IS_CI,
    ignoreHTTPSErrors: true,
    launchOptions: {
      slowMo: SLOW_MO,
      args: [
        // Suppress Chrome's "site wants to access other devices on your
        // system" Local Network Access prompt that otherwise blocks the
        // dashboard from loading.
        '--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWarning,PrivateNetworkAccessRespectPreflightResults'
      ]
    },
    ...(BROWSER_CHANNEL ? { channel: BROWSER_CHANNEL } : {}),

    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },


  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },


});
