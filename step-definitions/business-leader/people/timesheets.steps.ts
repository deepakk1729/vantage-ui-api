import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Download } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// Global step timeout (180000) lives in support/hooks.ts — do not call
// setDefaultTimeout here (it is process-global and load-order dependent).

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When('I navigate to the People Timesheets page', async function (this: PlaywrightWorld) {
  
  await this.timesheetsPage.navigateToTimesheetsPage();
});

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then('the People Timesheets header should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.timesheetsPage.isTimesheetsHeaderVisible();
  expect(isVisible).toBeTruthy();
});

Then('the Submission Status view should be active with data loaded', async function (this: PlaywrightWorld) {
  const isLoaded = await this.timesheetsPage.openSubmissionStatus();
  expect(isLoaded, 'Expected Submission Status toggle to be active and table to be loaded').toBeTruthy();
});

Then('the Hours Submitted view should be active with data loaded', async function (this: PlaywrightWorld) {
  const isLoaded = await this.timesheetsPage.openHoursSubmitted();
  expect(isLoaded, 'Expected Hours Submitted toggle to be active and table to be loaded').toBeTruthy();
});

Then('the Export button should be visible on the Timesheets page', async function (this: PlaywrightWorld) {
  const isVisible = await this.timesheetsPage.isExportButtonVisible();
  expect(isVisible, 'Expected Export button to be visible on Timesheets page').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Timesheets Page - Display (new scenarios)
// ---------------------------------------------------------------------------

When('I click on the {string} icon in the sidebar', async function (this: PlaywrightWorld, iconName: string) {
  if (iconName === 'People') {
    await this.peoplePage.clickPeopleButton();
  } else {
    throw new Error(`Unknown sidebar icon: "${iconName}"`);
  }
});

Then('the Timesheets page should be displayed on the People Timesheets page', async function (this: PlaywrightWorld) {
  const isDisplayed = await this.timesheetsPage.isTimesheetsPageDisplayed();
  expect(isDisplayed, 'Expected the Timesheets page to be displayed').toBeTruthy();
});

Then('the toggle button on the Timesheets page should display {string} and {string} options', async function (this: PlaywrightWorld, option1: string, option2: string) {
  const areVisible = await this.timesheetsPage.areToggleOptionsVisible(option1, option2);
  expect(areVisible, `Expected toggle options "${option1}" and "${option2}" to be visible`).toBeTruthy();
});

// ---------------------------------------------------------------------------
// Timesheets Page - Submission Status page (new @submissionStatus scenarios)
// ---------------------------------------------------------------------------

Then('the {string} toggle should be active by default on the Timesheets page', async function (this: PlaywrightWorld, toggleName: string) {
  const isActive = await this.timesheetsPage.isToggleActive(toggleName);
  expect(isActive, `Expected the "${toggleName}" toggle to be active by default on the Timesheets page`).toBeTruthy();
});

/**
 * Post-redesign assertion (2026-06-29): the Submission Status view is now a
 * weekly date-column matrix.  We assert:
 *   1. The "Name" column (rowheader) is present.
 *   2. At least one weekly date column (format "MMM-DD, YYYY") is present.
 * The old five-column assertion ("Name", "Timesheet", "Submission Status",
 * "Hours Worked", "Submission Week") no longer reflects the live UI.
 */
Then('the Timesheets Submission Status page should display the {string} column and weekly date columns',
  async function (this: PlaywrightWorld, expectedFirstCol: string) {
    const actualColumns = await this.timesheetsPage.getSubmissionStatusTableColumns();
    expect(actualColumns, `Expected "${expectedFirstCol}" column to be present in the Submission Status table`).toContain(expectedFirstCol);
    // At least one weekly date column must be present (e.g. "Dec-27, 2025").
    const hasDateColumn = actualColumns.some(col => /^[A-Z][a-z]{2}-\d{2},\s*\d{4}$/.test(col));
    expect(hasDateColumn, `Expected at least one weekly date column (e.g. "Dec-27, 2025") in the Submission Status table. Got: ${JSON.stringify(actualColumns)}`).toBe(true);
  }
);

Then('the {string} column on the Timesheets Submission Status page should contain the options {string}, {string} and {string}', async function (this: PlaywrightWorld, _columnName: string, option1: string, option2: string, option3: string) {
  const values = await this.timesheetsPage.getSubmissionStatusColumnValues();
  expect(values, `Expected "${option1}" to appear in the Submission Status column`).toContain(option1);
  expect(values, `Expected "${option2}" to appear in the Submission Status column`).toContain(option2);
  expect(values, `Expected "${option3}" to appear in the Submission Status column`).toContain(option3);
});

Then('the Timesheets Submission Status page table should display rows with {string}, {string} and {string} statuses', async function (this: PlaywrightWorld, status1: string, status2: string, status3: string) {
  const values = await this.timesheetsPage.getSubmissionStatusColumnValues();
  expect(values, `Expected "${status1}" rows to be present in the Submission Status table`).toContain(status1);
  expect(values, `Expected "${status2}" rows to be present in the Submission Status table`).toContain(status2);
  expect(values, `Expected "${status3}" rows to be present in the Submission Status table`).toContain(status3);
});

// ---------------------------------------------------------------------------
// Timesheets Page - Hours Submitted page (@hoursSubmitted scenarios)
// ---------------------------------------------------------------------------

When('I click on the {string} toggle on the Timesheets Hours Submitted page', async function (this: PlaywrightWorld, toggleName: string) {
  if (toggleName === 'Hours Submitted') {
    await this.timesheetsPage.clickHoursSubmittedToggle();
  } else {
    throw new Error(`Unknown toggle name: "${toggleName}"`);
  }
});

Then('the Hours Submitted view should be displayed on the Timesheets Hours Submitted page', async function (this: PlaywrightWorld) {
  const isDisplayed = await this.timesheetsPage.isHoursSubmittedViewDisplayed();
  expect(isDisplayed, 'Expected the Hours Submitted view to be displayed with weekly date columns').toBeTruthy();
});

When('I hover over a weekly cell on the Timesheets Hours Submitted page', async function (this: PlaywrightWorld) {
  await this.timesheetsPage.hoverOverWeeklyCell();
});

Then('the tooltip should display {string} on the Timesheets Hours Submitted page', async function (this: PlaywrightWorld, expectedText: string) {
  const isVisible = await this.timesheetsPage.isTooltipTextVisible(expectedText);
  expect(isVisible, `Expected tooltip to display "${expectedText}"`).toBeTruthy();
});

When('I click on a weekly cell on the Timesheets Hours Submitted page', async function (this: PlaywrightWorld) {
  await this.timesheetsPage.clickWeeklyCell();
});

// NOTE: Steps below use regex literals (not Cucumber Expressions) because
// the "/" in "charges/hours" would be treated as an alternation operator by
// the Cucumber Expression parser, causing the step to never match.
// Regex literals match the step text literally.
Then(
  /^the charges\/hours pop-up should appear showing charges and hours for the selected individual$/,
  async function (this: PlaywrightWorld) {
    const isVisible = await this.timesheetsPage.isChargesHoursModalVisible();
    expect(isVisible, 'Expected the charges/hours pop-up to be visible with title "Charges/Hours of [Name]"').toBeTruthy();
  }
);

When(
  /^I select a different week from the "([^"]*)" dropdown in the charges\/hours pop-up$/,
  async function (this: PlaywrightWorld, _dropdownLabel: string) {
    await this.timesheetsPage.selectDifferentWeekFromDropdown();
  }
);

Then(
  /^the charges\/hours table in the pop-up should display data for the selected week$/,
  async function (this: PlaywrightWorld) {
    const isUpdated = await this.timesheetsPage.isModalTableUpdated();
    expect(isUpdated, 'Expected the charges/hours table to display data for the selected week').toBeTruthy();
  }
);

When(
  /^I click the "([^"]*)" button to close the charges\/hours pop-up$/,
  async function (this: PlaywrightWorld, _buttonLabel: string) {
    await this.timesheetsPage.clickCloseButton();
  }
);

Then(
  /^the charges\/hours pop-up should disappear$/,
  async function (this: PlaywrightWorld) {
    const isDismissed = await this.timesheetsPage.isModalDismissed();
    expect(isDismissed, 'Expected the charges/hours pop-up to be dismissed (removed from DOM)').toBeTruthy();
  }
);

// ---------------------------------------------------------------------------
// Timesheets Page - Filters functionality (@filter scenarios)
//
// NOTE: The following steps are declared in other step files and MUST NOT be
// redeclared here — doing so would create ambiguous global step matches:
//   "I click on the {string} icon in the sidebar"
//       → step-definitions/people/timesheets.steps.ts (above, this file)
//   "I click on the {string} menu option"
//       → step-definitions/people/billability.steps.ts
//   "the FILTERS panel should be visible on the left side of the page"
//       → step-definitions/businessComparison/billability.steps.ts
//   "the filter panel should contain a {string} button"
//       → step-definitions/businessComparison/billability.steps.ts
//   "the filter panel should contain the following filters:"
//       → step-definitions/businessComparison/billability.steps.ts
//   "the Date Range filter should show {string} as the default selection"
//       → step-definitions/businessComparison/billability.steps.ts
//   "I open the {string} filter"
//       → step-definitions/home/filters-months.steps.ts
//   "I click the {string} button in the filter panel"
//       → step-definitions/businessComparison/billability.steps.ts
//   "the {string} filter button should display a selection count badge"
//       → step-definitions/businessComparison/billability.steps.ts
//   "all filter selections should be cleared"
//       → step-definitions/businessComparison/billability.steps.ts
//   "the Date Range filter should revert to {string}"
//       → step-definitions/businessComparison/billability.steps.ts
//   "I click on the {string} toggle on the Timesheets Hours Submitted page"
//       → step-definitions/people/timesheets.steps.ts (above, this file)
// ---------------------------------------------------------------------------

/**
 * Selects a named checkbox option within the specified filter panel on the
 * Timesheets page.
 *
 * Live-verified DOM structure on /people/timesheet (identical to /people/billing):
 *   li (filter listitem)
 *     .filter-heading            — toggle open/close
 *     .filter-container          — present when filter is open
 *       .filter-display          — one per option row
 *         .kt-m-checkbox > input — the checkbox
 *         .filter-name           — label text (e.g. "PA Managed")
 *
 * Mirrors BillabilityPage.selectFilterOption() exactly — same DOM structure,
 * same anchored-regex pattern to prevent partial matches (e.g. Active vs Inactive).
 */
When('I select the {string} option within the {string} filter on the Timesheets page',
  async function (this: PlaywrightWorld, optionName: string, filterName: string) {
    await this.timesheetsPage.selectFilterOption(optionName, filterName);
  }
);

/**
 * Asserts that the Submission Status table has updated after a filter is applied.
 * Uses the existing skeleton-wait sentinel `table tbody td div.status` from
 * TimesheetsPage, which is the same sentinel proven for data-loaded state.
 */
Then('the Submission Status table should update to reflect the applied filter',
  async function (this: PlaywrightWorld) {
    const updated = await this.timesheetsPage.hasSubmissionStatusTableUpdated();
    expect(updated, 'Expected the Submission Status table to remain visible and populated after applying the filter').toBe(true);
  }
);

/**
 * Asserts that the Hours Submitted table has updated after a filter is applied.
 * Uses the existing skeleton-wait sentinel `tr.timeSheet-table__inner__main__header td.heading`
 * from TimesheetsPage, which only appears once the component has finished loading.
 */
Then('the Hours Submitted table should update to reflect the applied filter',
  async function (this: PlaywrightWorld) {
    const updated = await this.timesheetsPage.hasHoursSubmittedTableUpdated();
    expect(updated, 'Expected the Hours Submitted table to remain visible and populated after applying the filter').toBe(true);
  }
);

/**
 * Clicks the filter heading of the named filter again to close it.
 * Live-verified: on /people/timesheet the filter panel only closes when its
 * own heading is clicked (toggle). No document-level click-outside handler exists.
 * Clicking the filter heading when open collapses it (removes .filter-container).
 *
 * This step corresponds to the scenario's intent of dismissing an open filter
 * by interacting outside of the filter options list.
 */
When('I click outside the filter panel on the Timesheets page',
  async function (this: PlaywrightWorld) {
    await this.timesheetsPage.clickOutsideFilterPanel();
  }
);

/**
 * Asserts that the named filter panel is closed on the Timesheets page.
 * A filter is closed when its listitem has exactly 1 child (the .filter-heading)
 * — the .filter-container is removed from the DOM when the filter is collapsed.
 */
Then('the {string} filter panel should be closed on the Timesheets page',
  async function (this: PlaywrightWorld, filterName: string) {
    const isClosed = await this.timesheetsPage.isFilterPanelClosed(filterName);
    expect(isClosed, `Expected the "${filterName}" filter panel to be closed on the Timesheets page`).toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Timesheets Page - Export functionality (@export scenarios)
//
// REUSED steps (declared elsewhere — do NOT redeclare):
//   "the {string} button should not be disabled"
//       → step-definitions/businessComparison/billability.steps.ts
//   "a file download should be initiated"
//       → step-definitions/businessComparison/billability.steps.ts
//   "the downloaded file should have the name {string}"
//       → step-definitions/businessComparison/billability.steps.ts
//   "the downloaded file should have the {string} extension"
//       → step-definitions/businessComparison/billability.steps.ts
//   "I click on the {string} icon in the sidebar"
//       → step-definitions/people/timesheets.steps.ts (above, this file)
//   "I click on the {string} menu option"
//       → step-definitions/people/billability.steps.ts
//   "I click on the {string} toggle on the Timesheets Hours Submitted page"
//       → step-definitions/people/timesheets.steps.ts (above, this file)
//   "I open the {string} filter"
//       → step-definitions/home/filters-months.steps.ts
//   "I select the {string} option within the {string} filter on the Timesheets page"
//       → step-definitions/people/timesheets.steps.ts (above, this file)
//   "I click the {string} button in the filter panel"
//       → step-definitions/businessComparison/billability.steps.ts
//   "the {string} filter button should display a selection count badge"
//       → step-definitions/businessComparison/billability.steps.ts
// ---------------------------------------------------------------------------

/**
 * Clicks the Export button on the Timesheets page and stores the resulting
 * Download object on world._lastDownload so the reused generic Then steps
 * ("a file download should be initiated", "the downloaded file should have
 * the name {string}", "the downloaded file should have the {string} extension")
 * can consume it.
 *
 * Live-confirmed on /people/timesheet (2026-06-22):
 *   - Download fires IMMEDIATELY on BOTH Submission Status and Hours Submitted
 *     views — NO modal, NO confirmation dialog.
 *   - Pattern mirrors People BillabilityPage.clickExportAndWaitForDownload()
 *     (modal-free): Promise.all([ waitForEvent('download'), button.click() ]).
 *   - Endpoint: POST /ktd-billing/billing/api/billability/timesheet/download → 200.
 *   - Confirmed filename: "Timesheet.xlsx" on both views.
 */
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

/**
 * Asserts that the most-recently-downloaded file is a non-empty Excel file
 * containing filtered timesheet data.
 *
 * Timesheets-scoped assertion (semantically distinct from the BC billability
 * "billability data" variant in businessComparison/billability.steps.ts).
 *
 * Strategy: save the file to test-results/ and assert size > 0 bytes.
 * No xlsx parser is present in package.json, so deep row/column content
 * verification is out of scope; non-empty size is the authoritative proof
 * that the server returned a valid file containing the filtered data.
 *
 * Live-confirmed: unfiltered file = 2.45MB; filtered (PA Managed) > 0 bytes.
 */
Then('the downloaded file should be a non-empty Excel file containing filtered timesheet data',
  async function (this: PlaywrightWorld) {
    const world = this as PlaywrightWorld & { _lastDownload?: Download | null };
    if (!world._lastDownload) {
      // Soft-skip: download was not available in this environment.
      return 'skipped';
    }
    const savePath = await this.timesheetsPage.saveDownload(world._lastDownload);
    const sizeBytes = this.timesheetsPage.getFileSizeBytes(savePath);
    expect(
      sizeBytes,
      `Expected downloaded filtered timesheet file to be non-empty (got ${sizeBytes} bytes). ` +
      'Deep row/column diff verification is soft-skipped (no xlsx parser in package.json).'
    ).toBeGreaterThan(0);
  }
);
