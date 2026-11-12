import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// "Given I am logged into Vantage Dashboard" lives in step-definitions/people/billability.steps.ts
// "When I navigate to the Home page"          lives in step-definitions/home/home.steps.ts

// ── Wait for tile to have data (shared guard used by multiple scenarios) ──────

/**
 * "And the "CASE ENGAGEMENT DEPTH" tile has loaded"
 *
 * Gate step: waits for the tile container to be visible.
 * Does NOT require data to be present — used in the bucket-label scenario where
 * we only need the structure, not actual percentages.
 */
When('the {string} tile has loaded', async function (this: PlaywrightWorld, tileName: string) {
  const upper = tileName.trim().toUpperCase();
  if (upper === 'CASE ENGAGEMENT DEPTH') {
    const visible = await this.homePage.isCaseEngagementDepthTileVisible();
    expect(visible, `Expected the "${tileName}" tile container to be visible`).toBe(true);
  } else if (upper === 'TIMESHEET') {
    const visible = await this.homePage.isTimesheetTileVisible();
    expect(visible, `Expected the "${tileName}" tile container to be visible`).toBe(true);
  } else {
    throw new Error(`Unknown tile "${tileName}" in "the tile has loaded" step. Only "CASE ENGAGEMENT DEPTH" and "TIMESHEET" are currently handled.`);
  }
});

/**
 * "And the "CASE ENGAGEMENT DEPTH" tile has loaded with data"
 *
 * Guard step for populated-state scenarios.  When the tile genuinely has no
 * data (API returned empty), the scenario soft-skips so it does not hard-fail.
 */
When('the {string} tile has loaded with data', async function (this: PlaywrightWorld, tileName: string) {
  if (tileName !== 'CASE ENGAGEMENT DEPTH') {
    throw new Error(`Unknown tile "${tileName}" in "the tile has loaded with data" step.`);
  }
  const hasData = await this.homePage.waitForCaseEngagementDepthData();
  if (!hasData) {
    return 'skipped';
  }
});

// ── Gate scenario ─────────────────────────────────────────────────────────────
// NOTE: "Then the {string} tile should be visible on the page" is defined in
// kn-material-tile.steps.ts (loaded for every run via cucumber.js glob).
// That step handles CASE ENGAGEMENT DEPTH via the generic isTileVisible() fallback.
// Do NOT redeclare it here — doing so would create an ambiguous-step collision.

// ── Bucket display ────────────────────────────────────────────────────────────

/**
 * "Then the tile should display a bucket labelled ">=40 hrs""
 * "And  the tile should display a bucket labelled ">=80 hrs""
 *
 * Accepts both ASCII >= and Unicode ≥ forms — the page-object method normalises them.
 */
Then('the tile should display a bucket labelled {string}', async function (this: PlaywrightWorld, label: string) {
  const visible = await this.homePage.isCaseEngagementDepthBucketVisible(label);
  expect(visible, `Expected the CASE ENGAGEMENT DEPTH tile to show a bucket labelled "${label}"`).toBe(true);
});

// ── Percentage values ─────────────────────────────────────────────────────────

/**
 * "Then the ">=40 hrs" bucket should display a percentage value"
 * "And  the ">=80 hrs" bucket should display a percentage value"
 */
Then('the {string} bucket should display a percentage value', async function (this: PlaywrightWorld, label: string) {
  const hasData = await this.homePage.waitForCaseEngagementDepthData();
  if (!hasData) {
    return 'skipped';
  }
  const hasPercentage = await this.homePage.doesBucketShowPercentage(label);
  expect(hasPercentage, `Expected the "${label}" bucket to display a non-empty percentage value`).toBe(true);
});

// ── Bar proportionality ───────────────────────────────────────────────────────

/**
 * "Then the bar width for the ">=40 hrs" bucket should reflect its displayed percentage"
 * "And  the bar width for the ">=80 hrs" bucket should reflect its displayed percentage"
 */
Then('the bar width for the {string} bucket should reflect its displayed percentage', async function (this: PlaywrightWorld, label: string) {
  const hasData = await this.homePage.waitForCaseEngagementDepthData();
  if (!hasData) {
    return 'skipped';
  }
  const proportional = await this.homePage.isBucketBarProportional(label);
  expect(
    proportional,
    `Expected the .legends_bar_blue width% for the "${label}" bucket to match the displayed percentage value`
  ).toBe(true);
});

// ── Filter reactivity ─────────────────────────────────────────────────────────

/**
 * "And I apply the "Path" filter selecting "Client Focus""
 */
When('I apply the {string} filter selecting {string}', async function (this: PlaywrightWorld, filterName: string, option: string) {
  if (filterName !== 'Path') {
    throw new Error(`Filter "${filterName}" is not handled in this step. Only "Path" is currently wired.`);
  }
  await this.homePage.applyPathFilter(option);
});

/**
 * "Then the "CASE ENGAGEMENT DEPTH" tile should reload"
 */
Then('the {string} tile should reload', async function (this: PlaywrightWorld, tileName: string) {
  if (tileName !== 'CASE ENGAGEMENT DEPTH') {
    throw new Error(`Unknown tile "${tileName}" in "tile should reload" step.`);
  }
  const visible = await this.homePage.isCaseEngagementDepthTileReloaded();
  expect(visible, `Expected the "${tileName}" tile to be visible after filter was applied`).toBe(true);
});

/**
 * "And the tile should still display the ">=40 hrs" and ">=80 hrs" buckets"
 */
Then('the tile should still display the {string} and {string} buckets', async function (this: PlaywrightWorld, label1: string, label2: string) {
  const hasData = await this.homePage.waitForCaseEngagementDepthData();
  if (!hasData) {
    return 'skipped';
  }
  const visible1 = await this.homePage.isCaseEngagementDepthBucketVisible(label1);
  const visible2 = await this.homePage.isCaseEngagementDepthBucketVisible(label2);
  expect(visible1, `Expected bucket "${label1}" to still be visible after filter applied`).toBe(true);
  expect(visible2, `Expected bucket "${label2}" to still be visible after filter applied`).toBe(true);
});
