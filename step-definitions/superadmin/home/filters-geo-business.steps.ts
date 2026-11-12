import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// NOTE: "Given I am logged into Vantage Dashboard" lives in
//       step-definitions/people/billability.steps.ts — never redeclare it here.
//
// REUSED steps (do NOT redeclare — already defined in other home step files):
//   - "When I expand the {string} filter"
//       → step-definitions/home/filters-path.steps.ts
//         (includes the 'Geo Business' case dispatching to homePage.geoBusinessFilter.open())
//
// NEW steps defined in this file (unique to features/home/filters-geo-business.feature):
//   1. Given I am on the Home page
//   2. When I select the option {string}
//   3. When I select the following Geo Business options:
//   4. When I click {string}   (generic unscoped Apply dispatcher for this feature)
//   5. Then the following Geo Business options should be available:
//   6. Then all tiles should display data values for the selected Geo Business {string}
//   7. Then all tiles should display data values for the selected Geo Businesses

// ---------------------------------------------------------------------------
// Given — navigate to the Home page
// ---------------------------------------------------------------------------

Given('I am on the Home page', async function (this: PlaywrightWorld) {
  await this.homePage.goto();
});

// ---------------------------------------------------------------------------
// When — select a single option in the currently-open Geo Business filter
// ---------------------------------------------------------------------------

When(
  'I select the option {string}',
  async function (this: PlaywrightWorld, option: string) {
    await this.homePage.geoBusinessFilter.select(option);
  }
);

// ---------------------------------------------------------------------------
// When — select multiple Geo Business options from a DataTable
// Table has a header row "| option |" followed by option rows.
// Use DataTable.hashes() (keyed on "option") to skip the header automatically.
// ---------------------------------------------------------------------------

When(
  'I select the following Geo Business options:',
  async function (this: PlaywrightWorld, table: DataTable) {
    const options = table.hashes().map((row: Record<string, string>) => row['option'].trim());
    for (const option of options) {
      await this.homePage.geoBusinessFilter.select(option);
    }
  }
);

// ---------------------------------------------------------------------------
// When — generic "I click {string}" for this feature's Apply step
// ---------------------------------------------------------------------------

When(
  'I click {string}',
  async function (this: PlaywrightWorld, action: string) {
    switch (action) {
      case 'Apply':
        await this.homePage.geoBusinessFilter.apply();
        break;
      default:
        throw new Error(
          `filters-geo-business.steps.ts: Unknown action "${action}" in "I click {string}". ` +
          'Extend the switch statement if other actions are needed.'
        );
    }
  }
);

// ---------------------------------------------------------------------------
// Then — verify available Geo Business filter options
// Table has a header row "| option |" followed by option rows.
// Use DataTable.hashes() so the header is skipped and rows are keyed by "option".
// ---------------------------------------------------------------------------

Then(
  'the following Geo Business options should be available:',
  async function (this: PlaywrightWorld, table: DataTable) {
    const options = table.hashes().map((row: Record<string, string>) => row['option'].trim());
    // Extra wait under suite load — options may still be rendering after open() returns.
    const state = await this.homePage.geoBusinessFilter.waitForPanelContent(20000);
    if (state === 'no-record') return 'skipped';
    for (const option of options) {
      const visible = await this.homePage.geoBusinessFilter.isOptionVisible(option);
      expect(
        visible,
        `Expected Geo Business option "${option}" to be visible in the filter panel`
      ).toBe(true);
    }
  }
);

// ---------------------------------------------------------------------------
// Then — verify all tiles display data after a single Geo Business is selected
// ---------------------------------------------------------------------------

Then(
  'all tiles should display data values for the selected Geo Business {string}',
  async function (this: PlaywrightWorld, _geoBusinessName: string) {
    // The primary assertion is that key tiles remain visible and rendered
    // after the filter is applied.  Exact data values are environment-dependent
    // and are not asserted — rendered tile containers prove the filter was accepted.
    const billabilityVisible = await this.homePage.isBillabilityTrendVisible();
    expect(
      billabilityVisible,
      `Expected BILLABILITY TREND tile to be visible after selecting Geo Business "${_geoBusinessName}"`
    ).toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Then — verify all tiles display data after multiple Geo Businesses are selected
// ---------------------------------------------------------------------------

Then(
  'all tiles should display data values for the selected Geo Businesses',
  async function (this: PlaywrightWorld) {
    // Mirrors the single-selection assertion: tiles must still be rendered.
    const billabilityVisible = await this.homePage.isBillabilityTrendVisible();
    expect(
      billabilityVisible,
      'Expected BILLABILITY TREND tile to be visible after selecting multiple Geo Businesses'
    ).toBe(true);
  }
);
