import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// ---------------------------------------------------------------------------
// NOTE: "Given I am logged into Vantage Dashboard" is declared in
//       step-definitions/analyst/reports/billability.steps.ts (one place only).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When('I navigate to the Home page', async function (this: PlaywrightWorld) {
  await this.homePage.goto();
});

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then('the Billability Trend widget should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.homePage.isBillabilityTrendVisible();
  expect(isVisible).toBeTruthy();
});

Then('the Top Projects widget should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.homePage.isTopProjectsVisible();
  expect(isVisible).toBeTruthy();
});

Then('the Vantage Averages widget should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.homePage.isVantageAveragesVisible();
  expect(isVisible).toBeTruthy();
});

Then('the Filters panel should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.homePage.isFiltersPanelVisible();
  expect(isVisible).toBeTruthy();
});

Then('the Reset button should be visible in the filter panel', async function (this: PlaywrightWorld) {
  const isVisible = await this.homePage.isResetButtonVisible();
  expect(isVisible).toBeTruthy();
});

// ---------------------------------------------------------------------------
// Home Page Login
// ---------------------------------------------------------------------------

Then('I should land on the Home page of the Vantage Dashboard', async function (this: PlaywrightWorld) {
  const isOnHome = await this.homePage.isOnHomePage();
  expect(isOnHome).toBeTruthy();
});

Then('the BCG Vantage Dashboard logo should be visible on the top left of the page header', async function (this: PlaywrightWorld) {
  const isVisible = await this.homePage.isLogoVisible();
  expect(isVisible).toBeTruthy();
});

Then('the User Validation Select dropdown should be visible on the top right of the page header', async function (this: PlaywrightWorld) {
  const isVisible = await this.homePage.isUserValidationDropdownVisible();
  expect(isVisible).toBeTruthy();
});

Then('the refreshed data timestamp should be visible on the page header after the User Validation Select dropdown', async function (this: PlaywrightWorld) {
  const isVisible = await this.homePage.isRefreshedTimestampVisible();
  expect(isVisible).toBeTruthy();
});

// ---------------------------------------------------------------------------
// Home Page Tiles Validation
// ---------------------------------------------------------------------------

Then('the following tiles should be displayed on the Home page:', async function (this: PlaywrightWorld, table: DataTable) {
  const tiles = table.raw().map(row => row[0].trim());
  for (const tile of tiles) {
    const visible = await this.homePage.isTileVisible(tile);
    expect(visible, `Expected tile "${tile}" to be visible`).toBeTruthy();
  }
});

Then('the Billability Trend tile should display months within the default Last 12 Months range', async function (this: PlaywrightWorld) {
  const ok = await this.homePage.tileShowsMonthsInLastTwelveMonths('Billability Trend');
  expect(ok).toBeTruthy();
});

Then('the Vantage Averages tile should reflect the default utilization category {string}', async function (this: PlaywrightWorld, category: string) {
  const ok = await this.homePage.tileReflectsUtilizationCategory('Vantage Averages', category);
  expect(ok).toBeTruthy();
});

Then('the Top Projects tile should reflect the default utilization category {string}', async function (this: PlaywrightWorld, category: string) {
  const ok = await this.homePage.tileReflectsUtilizationCategory('Top Projects', category);
  expect(ok).toBeTruthy();
});

Then('the following page options should be available on the left side of the page:', async function (this: PlaywrightWorld, table: DataTable) {
  const options = table.raw().map(row => row[0].trim());
  for (const option of options) {
    const visible = await this.homePage.isPageOptionVisible(option);
    expect(visible, `Expected page option "${option}" to be visible`).toBeTruthy();
  }
});

Then('the Filters panel should be visible on the left side of the page below the page options', async function (this: PlaywrightWorld) {
  const ok = await this.homePage.isFiltersPanelBelowPageOptions();
  expect(ok).toBeTruthy();
});
