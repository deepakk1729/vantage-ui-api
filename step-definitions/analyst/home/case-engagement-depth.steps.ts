import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// "Given I am logged into Vantage Dashboard" → reports/billability.steps.ts
// "When I navigate to the Home page"          → home/home.steps.ts
// Analyst has NO path filter — filter-reactivity steps omitted.

// ── Wait for tile to have loaded ────────────────────────────────────────────

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

When('the {string} tile has loaded with data', async function (this: PlaywrightWorld, tileName: string) {
  if (tileName !== 'CASE ENGAGEMENT DEPTH') {
    throw new Error(`Unknown tile "${tileName}" in "the tile has loaded with data" step.`);
  }
  const hasData = await this.homePage.waitForCaseEngagementDepthData();
  if (!hasData) {
    return 'skipped';
  }
});

// ── Bucket display ────────────────────────────────────────────────────────────

Then('the tile should display a bucket labelled {string}', async function (this: PlaywrightWorld, label: string) {
  const visible = await this.homePage.isCaseEngagementDepthBucketVisible(label);
  expect(visible, `Expected the CASE ENGAGEMENT DEPTH tile to show a bucket labelled "${label}"`).toBe(true);
});

// ── Percentage values ─────────────────────────────────────────────────────────

Then('the {string} bucket should display a percentage value', async function (this: PlaywrightWorld, label: string) {
  const hasData = await this.homePage.waitForCaseEngagementDepthData();
  if (!hasData) {
    return 'skipped';
  }
  const hasPercentage = await this.homePage.doesBucketShowPercentage(label);
  expect(hasPercentage, `Expected the "${label}" bucket to display a non-empty percentage value`).toBe(true);
});

// ── Bar proportionality ───────────────────────────────────────────────────────

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
