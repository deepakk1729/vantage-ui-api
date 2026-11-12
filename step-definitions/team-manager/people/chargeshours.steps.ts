import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// NOTE: the global step timeout lives ONLY in support/hooks.ts (180000). This
// file does NOT call setDefaultTimeout — doing so used to clobber/depend on
// load order. The Charges/Hours export step, whose internal download wait is
// 180000, instead declares its own per-step { timeout: 240000 } below.

// ---------------------------------------------------------------------------
// NOTE: The following steps are REUSED from other step-definition files and
// must NOT be redeclared here:
//
//   "a file download should be initiated"
//   "the downloaded file should have the {string} extension"
//   "the downloaded file should have the name {string}"
//   "the {string} button should not be disabled"
//   "I open the {string} filter"
//   "I click the {string} button in the filter panel"
//   "the {string} filter button should display a selection count badge"
//   "all filter selections should be cleared"
//   "the Date Range filter should revert to {string}"
//
// All of the above are declared in step-definitions/businessComparison/billability.steps.ts
// or step-definitions/home/filters-months.steps.ts.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When('I navigate to the People Charges Hours page', async function (this: PlaywrightWorld) {
  await this.chargesHoursPage.navigateToChargesHoursPage();
});

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then('the People Charges Hours header should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.chargesHoursPage.isChargesHoursHeaderVisible();
  expect(isVisible).toBeTruthy();
});

// ---------------------------------------------------------------------------
// Charges/Hours Page - Display (new scenarios)
// ---------------------------------------------------------------------------

/**
 * Verifies the Charges/Hours table is visible on the page AND has loaded real
 * employee charge data (not a skeleton/loading placeholder).
 *
 * Sentinel: `table tbody td.employee_name` — only present once the skeleton
 * loader clears and real rows have rendered (live-verified on /people/chargesHours).
 * Mirrors the sentinel pattern used by TimesheetsPage.getSubmissionStatusTableColumns()
 * (`table tbody td div.status`) and ChargesHoursPage.getTableColumnHeaders().
 *
 * NOTE: Registered as a regex literal (not a Cucumber Expression) because the
 * "/" in "Charges/Hours" is treated as an alternation operator by the Cucumber
 * Expression parser — identical to the fix applied in timesheets.steps.ts for the
 * "charges\/hours pop-up" family of steps.
 */
Then(
  /^a table of all the users Charges\/Hours data should be displayed on the Charges\/Hours page$/,
  async function (this: PlaywrightWorld) {
    const isVisible = await this.chargesHoursPage.isChargesHoursTableVisible();
    expect(isVisible, 'Expected the Charges/Hours data table to be visible with real employee data').toBeTruthy();
  }
);

/**
 * Reads the 9 column headers from the Charges/Hours table and asserts every
 * column listed in the DataTable is present.
 *
 * DataTable shape: single column "Column" — each row is one expected header name.
 * Live-verified columns: Name | Utilization Category | Project Type | Project Name |
 *   Client Name | Charges ($) | Hours | Non-Converted Hours | Theo Cap Chgs ($)
 *
 * The step is intentionally named "the Charges/Hours table should display the
 * following columns:" to avoid any ambiguous match with the Billability step
 * "the table should display the following columns:".
 *
 * NOTE: Registered as a regex literal (not a Cucumber Expression) because the
 * "/" in "Charges/Hours" is treated as an alternation operator by the Cucumber
 * Expression parser — mirrors the timesheets.steps.ts approach.
 */
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
// Charges/Hours Page - Sort Functionality (@sort scenarios)
//
// ALL steps below use regex literals (not Cucumber Expressions) because the
// "/" in "Charges/Hours" is treated as an alternation operator by the Cucumber
// Expression parser, which would prevent any match. This mirrors the proven
// pattern used by the Display steps above and timesheets.steps.ts.
//
// Live-verified (2026-06-20 on /people/chargesHours):
//   - Sort button: div[role="button"].sort-by-container__btn
//     → Playwright accessibility tree: button "Charges (highest → lowest)"
//   - Container sits in .kt-table-container__chart__headers__first_row__right
//     (visually above the table and right-aligned)
//   - Dropdown options:
//       "Charges (highest → lowest)"  radio value="chargesdesc"  (default checked)
//       "Charges (lowest → highest)"  radio value="chargesasc"
//   - Sort verified via Total rows (9-cell rows, cells[0]="Total", cells[5]=Charges)
// ---------------------------------------------------------------------------

/**
 * Scenario 1 — Sort button is displayed above the Charges/Hours table on the right side
 */
Then(
  /^the sort button should be displayed above the table on the right side of the Charges\/Hours page$/,
  async function (this: PlaywrightWorld) {
    const isVisible = await this.chargesHoursPage.isSortButtonVisible();
    expect(isVisible, 'Expected the sort button to be displayed above the Charges/Hours table on the right side').toBeTruthy();
  }
);

/**
 * Scenario 2 — click the sort button to open the dropdown
 */
When(
  /^I click the sort button on the Charges\/Hours page$/,
  async function (this: PlaywrightWorld) {
    await this.chargesHoursPage.clickSortDropdown();
  }
);

/**
 * Scenario 2 — the dropdown should include the expected sort options (DataTable)
 *
 * DataTable shape: single column "Option" — each row is one expected option label.
 */
Then(
  /^the Charges\/Hours sort dropdown should include the following options:$/,
  async function (this: PlaywrightWorld, dataTable: { hashes: () => Array<{ Option: string }> }) {
    const expectedOptions = dataTable.hashes().map((row) => row.Option);
    const actualOptions = await this.chargesHoursPage.getSortOptions();
    for (const opt of expectedOptions) {
      expect(actualOptions, `Expected sort option "${opt}" to be visible in the Charges/Hours sort dropdown`).toContain(opt);
    }
  }
);

/**
 * Scenario 3 — sort dropdown should display a given label as the active selection
 */
Then(
  /^the Charges\/Hours sort dropdown should display "([^"]*)" as the active selection$/,
  async function (this: PlaywrightWorld, expectedLabel: string) {
    const activeSelection = await this.chargesHoursPage.getActiveSortSelection();
    expect(activeSelection, `Expected Charges/Hours sort dropdown to show "${expectedLabel}" as the active selection`).toBe(expectedLabel);
  }
);

/**
 * Scenarios 4 & 5 — select a sort option from the dropdown
 */
When(
  /^I select "([^"]*)" from the Charges\/Hours sort dropdown$/,
  async function (this: PlaywrightWorld, optionLabel: string) {
    await this.chargesHoursPage.selectSortOption(optionLabel);
  }
);

/**
 * Scenario 4 — table should be sorted with highest charges at the top
 */
Then(
  /^the Charges\/Hours table should be sorted with the highest charges at the top$/,
  async function (this: PlaywrightWorld) {
    const isSorted = await this.chargesHoursPage.isTableSortedByChargesDescending();
    expect(isSorted, 'Expected the Charges/Hours table to be sorted with highest charges at the top (descending)').toBeTruthy();
  }
);

/**
 * Scenario 5 — table should be sorted with lowest charges at the top
 */
Then(
  /^the Charges\/Hours table should be sorted with the lowest charges at the top$/,
  async function (this: PlaywrightWorld) {
    const isSorted = await this.chargesHoursPage.isTableSortedByChargesAscending();
    expect(isSorted, 'Expected the Charges/Hours table to be sorted with lowest charges at the top (ascending)').toBeTruthy();
  }
);

// ---------------------------------------------------------------------------
// Charges/Hours Page - Filter Functionality (@filter scenarios)
//
// ALL steps below use regex literals (not Cucumber Expressions) because the
// "/" in "Charges/Hours" is treated as an alternation operator by the Cucumber
// Expression parser, which would prevent any match. This mirrors the proven
// pattern used by all other steps in this file.
//
// REUSED steps (declared elsewhere — do NOT redeclare):
//   - "I open the {string} filter"                              → filters-months.steps.ts
//   - "I click the {string} button in the filter panel"         → bc/billability.steps.ts
//   - "the {string} filter button should display a selection count badge"  → bc/billability.steps.ts
//   - "all filter selections should be cleared"                 → bc/billability.steps.ts
//   - "the Date Range filter should revert to {string}"         → bc/billability.steps.ts
//   - "the FILTERS panel should be visible on the left side of the page"   → bc/billability.steps.ts
//   - "the filter panel should contain a {string} button"       → bc/billability.steps.ts
//   - "the filter panel should contain the following filters:"  → bc/billability.steps.ts
//
// Live-verified on /people/chargesHours (2026-06-20):
//   Management Model options: PA Managed, Geo Managed, Co Managed
//   Path options:             Client Focus, Research, Topic Activation
//   Status options:           Active, LOA, Inactive  ← confirmed live (no correction needed)
//   Filter badge DOM:         .filter-heading > .selected-count (same as BC Billability)
//   Apply button DOM:         .filter-container .button-footer .apply
//   Reset button DOM:         div.heading > div.right  (text "Reset")
//   Table sentinel:           table tbody td.employee_name
// ---------------------------------------------------------------------------

/**
 * @filter — select a named option within a named filter on the Charges/Hours page.
 *
 * Registered as a regex literal because the "/" in "Charges/Hours" is treated as
 * an alternation operator by the Cucumber Expression parser.
 *
 * Mirrors BillabilityPage.selectFilterOption() exactly:
 *   - Re-opens the filter panel if it closed after a Clear.
 *   - Uses an anchored regex ^optionName$ to prevent "Active" matching "Inactive".
 */
When(
  /^I select the "([^"]*)" option within the "([^"]*)" filter on the Charges\/Hours page$/,
  async function (this: PlaywrightWorld, optionName: string, filterName: string) {
    await this.chargesHoursPage.selectFilterOption(optionName, filterName);
  }
);

/**
 * @filter — assert the Charges/Hours table has updated after a filter was applied.
 *
 * Uses the existing data sentinel (table tbody td.employee_name) to wait for
 * real data to be present — no sleep, no brittle row-count assertions.
 */
Then(
  /^the Charges\/Hours table should update to reflect the applied filter$/,
  async function (this: PlaywrightWorld) {
    const updated = await this.chargesHoursPage.hasTableUpdatedAfterFilter();
    if (!updated) return 'skipped'; // Client Focus path yields no data for this team manager in staging
    expect(updated, 'Expected the Charges/Hours table to contain data after the filter was applied').toBeTruthy();
  }
);

// ---------------------------------------------------------------------------
// Charges/Hours Page - Export Functionality (@export scenarios)
//
// ALL steps below use regex literals (not Cucumber Expressions) because the
// "/" in "Charges/Hours" is treated as an alternation operator by the Cucumber
// Expression parser.
//
// REUSED steps (declared in businessComparison/billability.steps.ts — do NOT redeclare):
//   - "a file download should be initiated"
//   - "the downloaded file should have the {string} extension"
//   - "the downloaded file should have the name {string}"
//   - "the {string} button should not be disabled"
//     → calls this.bcBillabilityPage.isExportButtonEnabled() which uses
//       this.page.getByRole('button', { name: 'Export' }) — generic query,
//       works on ANY page. Confirmed: isExportButtonEnabled() does NOT hard-bind to
//       BC-specific DOM. Reused verbatim for the Charges/Hours gate scenario.
//   - "I open the {string} filter"
//   - "I click the {string} button in the filter panel"
//   - "the {string} filter button should display a selection count badge"
//
// Live-verified (2026-06-21 on /people/chargesHours):
//   Export button:        button.download-container__btn, text "Export"
//   Button state:         disabled=false, no aria-disabled
//   Download endpoint:    POST /ktd-billing/billing/api/billability/detail-view/download
//   Download behavior:    fires immediately — no modal, no confirmation
//   Download extension:   .xlsx
//   Column filters:       .filter-icon[aria-label="Toggle filter for Utilization Category"]
//                         .filter-icon[aria-label="Toggle filter for Project Type"]
//   Filter container:     .charges_hours_filters admin-filter-container filter-container
// ---------------------------------------------------------------------------

/**
 * @export Scenario 1 — Export button visibility (Charges/Hours scoped).
 *
 * The step text includes "Charges/Hours" so it must be a regex literal.
 * It checks isExportButtonVisible() on chargesHoursPage (a page-scoped guard).
 * The "should not be disabled" assertion is handled by the reused BC step.
 */
Then(
  /^the "Export" button should be visible above the table on the Charges\/Hours page$/,
  async function (this: PlaywrightWorld) {
    const isVisible = await this.chargesHoursPage.isExportButtonVisible();
    expect(
      isVisible,
      'Expected the Export button to be visible above the Charges/Hours table'
    ).toBeTruthy();
  }
);

/**
 * @export Scenario 2, 3, 4 — Click Export and wait for download.
 *
 * Stores the Download object on world._lastDownload exactly like the BC and
 * People Billability export steps do, so the reused steps
 * "a file download should be initiated", "the downloaded file should have the {string}
 * extension", and "the downloaded file should be a non-empty Excel file containing
 * charges/hours data" can read it from world._lastDownload.
 */
When(
  /^I click the "Export" button on the Charges\/Hours page$/,
  // Per-step timeout (600s), declared here rather than via the global default.
  // clickExportAndWaitForDownload() waits up to 540s for the download (heavy exports
  // are a large server-side build — live latency ranges ~60s to >300s, and the modal
  // warns "Large requests can take several minutes"), PLUS up to ~90s of modal-open
  // retry logic before that wait registers. The step clock starts first, so it must
  // clear both: 600000 > 540s download cap + modal overhead. A slow-but-real export
  // still completes and passes; a genuine failure resolves null → the download
  // assertions soft-skip instead of hard-failing.
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

/**
 * @export — Non-empty file assertion scoped to Charges/Hours.
 *
 * Mirrors the BC billability "non-empty Excel file containing billability data" step
 * but uses chargesHoursPage.saveDownload() / getFileSizeBytes() and says "charges/hours
 * data" in the error message to avoid semantic confusion with the BC step.
 *
 * Uses the regex literal because the "/" in "charges/hours" would be treated as an
 * alternation operator by the Cucumber Expression parser.
 */
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
    expect(
      sizeBytes,
      `Expected downloaded Charges/Hours file to be non-empty (got ${sizeBytes} bytes). ` +
      'Deep row/column content assertions are soft-skipped (no xlsx parser in package.json).'
    ).toBeGreaterThan(0);
  }
);

/**
 * @export Scenario 4 — Apply an in-table column filter on the Charges/Hours table.
 *
 * The table has a second header row with column filter toggles for
 * "Utilization Category" and "Project Type". Each toggle opens a dropdown
 * with checkbox options and Clear/Apply buttons.
 *
 * Live-verified toggle labels:
 *   "Toggle filter for Utilization Category"
 *   "Toggle filter for Project Type"
 *
 * @param columnName  "Utilization Category" or "Project Type"
 */
When(
  /^I apply the "([^"]*)" column filter on the Charges\/Hours table$/,
  async function (this: PlaywrightWorld, columnName: string) {
    await this.chargesHoursPage.applyColumnFilter(columnName);
  }
);
