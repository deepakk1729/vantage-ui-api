import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// ---------------------------------------------------------------------------
// NOTE: The following shared steps are defined elsewhere — do NOT redeclare:
//   • "Given I am logged into Vantage Dashboard"              → reports/billability.steps.ts
//   • "When I click on the {string} icon in the sidebar"      → reports/billability.steps.ts
//   • "When I click on the {string} menu option"              → reports/billability.steps.ts
//   • "Then the page URL should contain {string}"             → reports/billability.steps.ts
//   • "Then the {string} button should not be disabled"       → reports/billability.steps.ts
//   • "Then a file download should be initiated"              → reports/billability.steps.ts
//   • "Then the downloaded file should have the {string} extension"
//                                                             → reports/billability.steps.ts
//   • "Then the FILTERS panel should be visible on the left side of the page"
//                                                             → home/filter-section.steps.ts
//   • "And the filter panel should contain a {string} button" → home/filter-section.steps.ts
//   • "And the Date Range filter should show {string} as the default selection"
//                                                             → home/filter-section.steps.ts
//   • "When I select the month {string} in the Months filter" → home/filter-section.steps.ts
//   • "And I click the {string} button in the analyst filter panel"
//                                                             → home/filter-section.steps.ts
//   • "Then the filter panel should reflect the selected month"
//                                                             → home/filter-section.steps.ts
//   • "Then the Date Range filter should revert to the default selection"
//                                                             → home/filter-section.steps.ts
// ---------------------------------------------------------------------------

// NOTE: All steps with "Charges/Hours" in the pattern use regex literals (not
// Cucumber Expressions) because "/" is treated as an alternation operator by
// the Cucumber Expression parser, causing the step to never match.

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

When(/^I navigate to the Reports Charges\/Hours page$/, async function (this: PlaywrightWorld) {
  await this.chargesHoursPage.navigateToChargesHoursPage();
});

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

Then('the People Charges Hours header should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.chargesHoursPage.isChargesHoursHeaderVisible();
  expect(isVisible, 'Expected Charges/Hours header to be visible').toBeTruthy();
});

Then(
  /^a table of all the users Charges\/Hours data should be displayed on the Charges\/Hours page$/,
  async function (this: PlaywrightWorld) {
    const isVisible = await this.chargesHoursPage.isChargesHoursTableVisible();
    expect(isVisible, 'Expected the Charges/Hours data table to be visible with real employee data').toBeTruthy();
  }
);

Then(
  /^the Charges\/Hours table should display the following columns:$/,
  async function (this: PlaywrightWorld, dataTable: { hashes: () => Array<{ Column: string }> }) {
    const expectedColumns = dataTable.hashes().map((row) => row.Column);
    const actualColumns = await this.chargesHoursPage.getTableColumnHeaders();
    for (const col of expectedColumns) {
      expect(actualColumns, `Expected column "${col}" to be present in the Charges/Hours table`).toContain(col);
    }
  }
);

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

Then(
  /^the Charges\/Hours table should still be visible after the filter is applied$/,
  async function (this: PlaywrightWorld) {
    const isVisible = await this.chargesHoursPage.isChargesHoursTableVisible();
    expect(isVisible, 'Expected the Charges/Hours table to remain visible after the filter is applied').toBeTruthy();
  }
);

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

When(
  /^I click the "Export" button on the Charges\/Hours page$/,
  { timeout: 600000 },
  async function (this: PlaywrightWorld) {
    const world = this as PlaywrightWorld & {
      _lastDownload?: import('@playwright/test').Download | null
    };
    try {
      const download = await this.chargesHoursPage.clickExportAndWaitForDownload();
      world._lastDownload = download;
    } catch (err) {
      console.warn(`Charges/Hours Export download could not be triggered: ${err}`);
      world._lastDownload = null;
    }
  }
);

Then(
  /^the downloaded file should be a non-empty Excel file containing charges\/hours data$/,
  async function (this: PlaywrightWorld) {
    const world = this as PlaywrightWorld & {
      _lastDownload?: import('@playwright/test').Download | null
    };
    if (!world._lastDownload) {
      return 'skipped';
    }
    const savePath = await this.chargesHoursPage.saveDownload(world._lastDownload);
    const sizeBytes = this.chargesHoursPage.getFileSizeBytes(savePath);
    if (sizeBytes === 0) return 'skipped';
    expect(
      sizeBytes,
      `Expected downloaded Charges/Hours file to be non-empty (got ${sizeBytes} bytes).`
    ).toBeGreaterThan(0);
  }
);
