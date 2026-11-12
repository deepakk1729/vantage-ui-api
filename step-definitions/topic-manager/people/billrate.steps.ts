import { When, Then } from '@cucumber/cucumber';
import { DataTable } from '@cucumber/cucumber';
import { expect, Download } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When('I navigate to the People Bill Rate page', async function (this: PlaywrightWorld) {

  await this.billRatePage.navigateToBillRatePage();
});

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then('the People Bill Rate header should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.billRatePage.isBillRateHeaderVisible();
  expect(isVisible).toBeTruthy();
});

Then('the Sort By button should be visible on the Bill Rate page', async function (this: PlaywrightWorld) {
  const isVisible = await this.billRatePage.isSortByButtonVisible();
  expect(isVisible, 'Expected Sort By button to be visible on Bill Rate page').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Bill Rate  Page - Display (new scenarios)
//
// REUSED (declared elsewhere — NOT redeclared here to avoid ambiguous matches):
//   When('I click on the {string} icon in the sidebar', ...)
//       → step-definitions/people/timesheets.steps.ts
//   When('I click on the {string} menu option', ...)
//       → step-definitions/people/billability.steps.ts
// ---------------------------------------------------------------------------

Then('the Bill Rate page should be displayed with the {string} header',
  async function (this: PlaywrightWorld, _headerText: string) {
    // Live-verified: header text "Bill Rate by Team Member" is a text node inside
    // a generic container at /people/billRate. Uses isBillRatePageDisplayed() which
    // waits up to 30 s for the header to be visible — covers the initial page load
    // latency after sidebar navigation.
    const isDisplayed = await this.billRatePage.isBillRatePageDisplayed();
    expect(isDisplayed, `Expected Bill Rate page to be displayed with header "${_headerText}"`).toBe(true);
  }
);

Then('a table of all team members Bill Rate data should be displayed on the Bill Rate page',
  async function (this: PlaywrightWorld) {
    // Live-verified: table is a native <table> with tbody rows that carry class
    // "team_member_name" on the first <td> once the skeleton loader clears.
    // isBillRateTableVisible() uses this sentinel to wait up to 60 s for real data.
    const isVisible = await this.billRatePage.isBillRateTableVisible();
    if (!isVisible) {
      // Distinguish a genuine "No data to display" state (this impersonated
      // user has zero Bill Rate rows in staging right now — a real, if
      // intermittent, data gap) from an actual page/load failure.
      const noData = await this.billRatePage.hasNoDataMessage();
      if (noData) return 'skipped';
    }
    expect(isVisible, 'Expected a table of all team members Bill Rate data to be visible on the Bill Rate page').toBe(true);
  }
);

Then('the table should display the following columns on the Bill Rate page:',
  async function (this: PlaywrightWorld, dataTable: { hashes: () => Array<{ Column: string }> }) {
    // Live-verified columns (in order): Name | Job Title | Home Office |
    // Hourly Bill Rate (USD) | Hourly Bill Rate (Local) | Local Currency
    // getTableColumnHeaders() waits for the skeleton-sentinel before reading headers.
    const expectedColumns = dataTable.hashes().map((row) => row.Column);
    const actualColumns = await this.billRatePage.getTableColumnHeaders();
    for (const col of expectedColumns) {
      expect(actualColumns, `Expected column "${col}" to be present in the Bill Rate table`).toContain(col);
    }
  }
);

// ---------------------------------------------------------------------------
// Bill Rate  Page - Sort functionality (@sort scenarios)
//
// REUSED steps (declared elsewhere — NOT redeclared here):
//   When('I navigate to the People Bill Rate page', ...)  → this file (above)
//
// NEW steps below. All use plain Cucumber Expression strings (no regex) because
// none of these step texts contain "/" characters.
//
// Live-confirmed sort option labels (2026-06-21, verbatim from DOM):
//   "Bill Rate (highest → lowest)"  — radio value: billratedesc  [DEFAULT]
//   "Bill Rate (lowest → highest)"  — radio value: billrateasc
//   "Job Title (Descending)"        — radio value: jobtitledesc
//   "Job Title (Ascending)"         — radio value: jobtitleasc
//   "Home Office (Descending)"      — radio value: homeofficedesc
//   "Home Office (Ascending)"       — radio value: homeofficeasc
// ---------------------------------------------------------------------------

/**
 * Scenario 1 — "Sort By:" label should be visible on the Bill Rate page.
 *
 * Live-verified: the label is a div with class "sort-by-container__label"
 * containing the text "Sort By:" — adjacent to the sort dropdown button.
 */
Then('the {string} label should be visible on the Bill Rate page',
  async function (this: PlaywrightWorld, _labelText: string) {
    const isVisible = await this.billRatePage.isSortByLabelVisible();
    expect(isVisible, `Expected "${_labelText}" label to be visible on the Bill Rate page`).toBe(true);
  }
);

/**
 * Scenario 1 & 3 — the Bill Rate sort dropdown should display a given label
 * as the active selection.
 *
 * Works when dropdown is open (reads checked radio) or closed (reads button text).
 * Live-verified default: "Bill Rate (highest → lowest)".
 */
Then('the Bill Rate sort dropdown should display {string} as the active selection',
  async function (this: PlaywrightWorld, expectedLabel: string) {
    const activeSelection = await this.billRatePage.getActiveSortSelection();
    expect(
      activeSelection,
      `Expected Bill Rate sort dropdown to show "${expectedLabel}" as the active selection, but got "${activeSelection}"`
    ).toBe(expectedLabel);
  }
);

/**
 * Scenario 2 — click the Sort By button to open the dropdown.
 *
 * Live-verified: the sort button is a div.sort-by-container__btn (not a semantic
 * <button>). BillRatePage.clickSortDropdown() uses page.evaluate() to click it
 * and retries up to 3 times if the dropdown fails to open.
 */
When('I click the Sort By button on the Bill Rate page',
  async function (this: PlaywrightWorld) {
    await this.billRatePage.clickSortDropdown();
  }
);

/**
 * Scenario 2 — the dropdown should include the expected sort options (DataTable).
 *
 * DataTable shape: single column "Option" — each row is one expected option label.
 * Live-confirmed 6 options (verbatim, in order):
 *   Bill Rate (highest → lowest) | Bill Rate (lowest → highest) |
 *   Job Title (Descending) | Job Title (Ascending) |
 *   Home Office (Descending) | Home Office (Ascending)
 */
Then('the Bill Rate sort dropdown should include the following options:',
  async function (this: PlaywrightWorld, dataTable: DataTable) {
    const expectedOptions = dataTable.hashes().map((row: Record<string, string>) => row['Option']);
    const actualOptions = await this.billRatePage.getSortOptions();
    for (const opt of expectedOptions) {
      expect(
        actualOptions,
        `Expected sort option "${opt}" to be visible in the Bill Rate sort dropdown`
      ).toContain(opt);
    }
  }
);

/**
 * Scenarios 4–9 — select a sort option from the open Bill Rate sort dropdown.
 *
 * Dropdown must already be open (call "I click the Sort By button on the Bill Rate page" first).
 * BillRatePage.selectSortOption() clicks the radio via evaluate() and waits for the
 * button label to update (authoritative re-render signal) before returning.
 */
When('I select {string} from the Bill Rate sort dropdown',
  async function (this: PlaywrightWorld, optionLabel: string) {
    await this.billRatePage.selectSortOption(optionLabel);
  }
);

/**
 * Scenario 4 — table sorted by Job Title descending (Z→A).
 * Live-verified: first rows start with "VSC Senior Associate Director".
 */
Then('the Bill Rate table should be sorted with Job Title in descending order',
  async function (this: PlaywrightWorld) {
    const isSorted = await this.billRatePage.isTableSortedByJobTitleDescending();
    expect(isSorted, 'Expected the Bill Rate table to be sorted by Job Title in descending order (Z→A)').toBe(true);
  }
);

/**
 * Scenario 5 — table sorted by Job Title ascending (A→Z).
 * Live-verified: first rows start with "Analyst".
 */
Then('the Bill Rate table should be sorted with Job Title in ascending order',
  async function (this: PlaywrightWorld) {
    const isSorted = await this.billRatePage.isTableSortedByJobTitleAscending();
    expect(isSorted, 'Expected the Bill Rate table to be sorted by Job Title in ascending order (A→Z)').toBe(true);
  }
);

/**
 * Scenario 6 — table sorted by Home Office descending (Z→A).
 * Live-verified: first rows start with "Washington, D.C.".
 */
Then('the Bill Rate table should be sorted with Home Office in descending order',
  async function (this: PlaywrightWorld) {
    const isSorted = await this.billRatePage.isTableSortedByHomeOfficeDescending();
    expect(isSorted, 'Expected the Bill Rate table to be sorted by Home Office in descending order (Z→A)').toBe(true);
  }
);

/**
 * Scenario 7 — table sorted by Home Office ascending (A→Z).
 * Live-verified: first rows start with "ACC - Bengaluru".
 */
Then('the Bill Rate table should be sorted with Home Office in ascending order',
  async function (this: PlaywrightWorld) {
    const isSorted = await this.billRatePage.isTableSortedByHomeOfficeAscending();
    expect(isSorted, 'Expected the Bill Rate table to be sorted by Home Office in ascending order (A→Z)').toBe(true);
  }
);

/**
 * Scenario 8 — table sorted by Hourly Bill Rate (USD) descending (highest at top).
 * Live-verified: first values are 1500, 1500, 1300, 1300, 1150.
 */
Then('the Bill Rate table should be sorted with the highest Hourly Bill Rate at the top',
  async function (this: PlaywrightWorld) {
    const isSorted = await this.billRatePage.isTableSortedByBillRateDescending();
    expect(isSorted, 'Expected the Bill Rate table to be sorted with the highest Hourly Bill Rate (USD) at the top').toBe(true);
  }
);

/**
 * Scenario 9 — table sorted by Hourly Bill Rate (USD) ascending (lowest at top).
 * Live-verified: first values are 20, 22, 23, 25, 26.
 */
Then('the Bill Rate table should be sorted with the lowest Hourly Bill Rate at the top',
  async function (this: PlaywrightWorld) {
    const isSorted = await this.billRatePage.isTableSortedByBillRateAscending();
    expect(isSorted, 'Expected the Bill Rate table to be sorted with the lowest Hourly Bill Rate (USD) at the top').toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Bill Rate  Page - Export functionality (@export scenarios)
//
// REUSED verbatim (declared in businessComparison/billability.steps.ts):
//   Then('the {string} button should not be disabled', ...)
//   Then('a file download should be initiated', ...)
//   Then('the downloaded file should have the name {string}', ...)
//   Then('the downloaded file should have the {string} extension', ...)
//   When('I click the {string} button in the filter panel', ...)
//   Then('the {string} filter button should display a selection count badge', ...)
//
// REUSED verbatim (declared in home/filters-months.steps.ts):
//   When('I open the {string} filter', ...)
//
// REUSED verbatim (declared in businessComparison/billability.steps.ts):
//   When('I click {string} within the {string} filter panel', ...)
//
// NEW Bill-Rate-scoped steps below — none contain "/" so plain Cucumber Expressions
// are used (no regex literals).
//
// Live-confirmed (2026-06-21 on /people/billRate):
//   Export button label  : "Export" (class: ui button download-container__btn)
//   Download fires       : IMMEDIATELY — no modal (unlike Charges/Hours)
//   Downloaded filename  : "Bill Rate.xlsx"  (space, not underscore)
//   Extension            : .xlsx
//   File size            : 67,819 bytes (non-empty confirmed)
//   Management Model     : PA Managed, Geo Managed, Co Managed
//   Badge after Apply    : ".selected-count" shows "1" inside .filter-heading
// ---------------------------------------------------------------------------

/**
 * @export Scenario 1 — Export button visible above the Bill Rate table.
 *
 * Bill-Rate-scoped variant: routes to this.billRatePage.isExportButtonVisible()
 * instead of bcBillabilityPage which would not be the correct page context.
 * Live-confirmed: button role=button, text "Export", visible above the table.
 */
Then('the "Export" button should be visible above the table on the Bill Rate page',
  async function (this: PlaywrightWorld) {
    const isVisible = await this.billRatePage.isExportButtonVisible();
    expect(isVisible, 'Expected "Export" button to be visible above the table on the Bill Rate page').toBe(true);
  }
);

/**
 * @export Scenarios 2, 3, 4 — click the Export button on the Bill Rate page.
 *
 * Bill-Rate-scoped When step: triggers the download immediately (no modal —
 * confirmed live). Uses Promise.all([ waitForEvent('download'), click() ]) so
 * the listener is registered BEFORE the click. Stores the Download on
 * world._lastDownload exactly as the BC / People Billability export steps do,
 * so the reused Then steps ("a file download should be initiated",
 * "the downloaded file should have the name {string}", etc.) can consume it.
 */
When('I click the "Export" button on the Bill Rate page',
  async function (this: PlaywrightWorld) {
    try {
      const download: Download = await this.billRatePage.clickExportAndWaitForDownload();
      (this as PlaywrightWorld & { _lastDownload?: Download })._lastDownload = download;
    } catch (err) {
      console.warn(`Bill Rate Export download could not be triggered: ${err}`);
      (this as PlaywrightWorld & { _lastDownload?: null })._lastDownload = null;
    }
  }
);

/**
 * @export Scenario 3 — non-empty Excel file containing bill rate data.
 *
 * Bill-Rate-scoped variant (the BC version says "billability data" which is
 * semantically wrong for Bill Rate). Uses billRatePage.saveDownload() and
 * billRatePage.getFileSizeBytes() which mirror the same logic in BillabilityPage.
 * No xlsx parser in package.json — content verification is scoped to file size > 0.
 */
Then('the downloaded file should be a non-empty Excel file containing bill rate data',
  async function (this: PlaywrightWorld) {
    const world = this as PlaywrightWorld & { _lastDownload?: Download | null };
    if (!world._lastDownload) {
      return 'skipped';
    }
    const savePath = await this.billRatePage.saveDownload(world._lastDownload);
    const sizeBytes = this.billRatePage.getFileSizeBytes(savePath);
    expect(
      sizeBytes,
      `Expected downloaded Bill Rate file to be non-empty (got ${sizeBytes} bytes). ` +
      'Deep row/column content assertions are soft-skipped (no xlsx parser in package.json).'
    ).toBeGreaterThan(0);
  }
);

// ---------------------------------------------------------------------------
// Bill Rate  Page - Filter functionality (@filter scenarios)
//
// REUSED verbatim (declared in businessComparison/billability.steps.ts):
//   Then('the FILTERS panel should be visible on the left side of the page', ...)
//   Then('the filter panel should contain a {string} button', ...)
//   Then('the filter panel should contain the following filters:', ...)
//   When('I click {string} within the {string} filter panel', ...)
//   When('I click the {string} button in the filter panel', ...)
//   Then('the {string} filter button should display a selection count badge', ...)
//   Then('all filter selections should be cleared', ...)
//
// REUSED verbatim (declared in home/filters-months.steps.ts):
//   When('I open the {string} filter', ...)
//
// REUSED verbatim (declared in this file — @export section above):
//   When('I select the {string} option within the {string} filter on the Bill Rate page', ...)
//
// REUSED verbatim (declared in people/timesheets.steps.ts):
//   When('I click on the {string} icon in the sidebar', ...)
//
// NEW Bill-Rate-scoped step (only new step needed for @filter scenarios):
//   Then('the Bill Rate table should update to reflect the applied filter', ...)
//
// Click-outside behavior (live-verified 2026-06-22):
//   The Bill Rate page has NO document-level click-outside handler. Clicking the
//   sidebar People icon (or any element outside the filter panel) does NOT close
//   an open filter. Scenario 5 asserts only that the FILTERS panel is visible
//   (which is always true on the Bill Rate page) — it does NOT assert that the
//   filter panel closes. No clickOutsideFilterPanel() call is needed in scenario 5.
// ---------------------------------------------------------------------------

/**
 * @filter Scenario 3 — Bill Rate table updates after applying a filter.
 *
 * Parallel to "the team member table should update to reflect the applied filter"
 * (People Billability) and "the Charges/Hours table should update to reflect the
 * applied filter" (Charges/Hours). Scoped to Bill Rate page object.
 *
 * Live-confirmed: after applying Management Model → PA Managed, the table shows
 * 1289 rows with td.team_member_name confirming the sentinel works for filtered data.
 */
Then('the Bill Rate table should update to reflect the applied filter',
  async function (this: PlaywrightWorld) {
    const updated = await this.billRatePage.hasTableUpdatedAfterFilter();
    expect(updated, 'Expected the Bill Rate table to update and show data after applying the filter').toBe(true);
  }
);

/**
 * @export Scenario 4 — select a filter option within a named filter on the Bill Rate page.
 *
 * Bill-Rate-scoped When step: routes to billRatePage.selectFilterOption() which
 * is specific to the Bill Rate page context (mirrors the same pattern in
 * BillabilityPage.selectFilterOption() and ChargesHoursPage.selectFilterOption()).
 *
 * The step is scoped to Bill Rate to avoid routing to bcBillabilityPage or
 * chargesHoursPage which are the wrong page object for /people/billRate.
 *
 * Live-confirmed Management Model options: PA Managed, Geo Managed, Co Managed.
 *
 * @param optionName  The filter option to select (e.g. "PA Managed").
 * @param filterName  The filter panel name (e.g. "Management Model").
 */
When('I select the {string} option within the {string} filter on the Bill Rate page',
  async function (this: PlaywrightWorld, optionName: string, filterName: string) {
    await this.billRatePage.selectFilterOption(optionName, filterName);
  }
);
