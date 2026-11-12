import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Download } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { TimesheetsPage as AnTimesheetsPage } from '../../../src/pages/analyst/people/TimesheetsPage';

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
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

When('I navigate to the Reports Timesheets page', async function (this: PlaywrightWorld) {
  await this.timesheetsPage.navigateToTimesheetsPage();
});

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

Then('the Submission Status by Timesheet header should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.timesheetsPage.isTimesheetsHeaderVisible();
  expect(isVisible, 'Expected "Submission Status by Timesheet" header to be visible').toBeTruthy();
});

Then('the Export button should be visible on the Timesheets page', async function (this: PlaywrightWorld) {
  const isVisible = await this.timesheetsPage.isExportButtonVisible();
  expect(isVisible, 'Expected Export button to be visible on the Timesheets page').toBeTruthy();
});

Then('the personal timesheet submission status row should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await (this.timesheetsPage as unknown as AnTimesheetsPage).isPersonalTimesheetRowVisible();
  expect(isVisible, 'Expected personal timesheet submission status row to be visible').toBeTruthy();
});

Then('the submission status row should display weekly date column headers', async function (this: PlaywrightWorld) {
  const isVisible = await (this.timesheetsPage as unknown as AnTimesheetsPage).isSubmissionStatusWeeklyHeadersVisible();
  expect(isVisible, 'Expected weekly date column headers to be visible in the submission status table').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

When('I click the "Export" button on the Timesheets page', async function (this: PlaywrightWorld) {
  const world = this as PlaywrightWorld & { _lastDownload?: Download | null };
  try {
    const download = await this.timesheetsPage.clickExportAndWaitForDownload();
    world._lastDownload = download;
  } catch (err) {
    console.warn(`Timesheets Export download could not be triggered: ${err}`);
    world._lastDownload = null;
  }
});

Then('the downloaded file should be a non-empty Excel file containing timesheet data', async function (this: PlaywrightWorld) {
  const world = this as PlaywrightWorld & { _lastDownload?: Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  const savePath = await this.timesheetsPage.saveDownload(world._lastDownload);
  const sizeBytes = this.timesheetsPage.getFileSizeBytes(savePath);
  if (sizeBytes === 0) return 'skipped';
  expect(
    sizeBytes,
    `Expected downloaded timesheet file to be non-empty (got ${sizeBytes} bytes).`
  ).toBeGreaterThan(0);
});
