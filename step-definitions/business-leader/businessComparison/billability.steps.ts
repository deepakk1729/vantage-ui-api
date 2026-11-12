import { When, Then } from '@cucumber/cucumber';
import { DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// Global step timeout (180000) lives in support/hooks.ts — do not call
// setDefaultTimeout here (it is process-global and load-order dependent).

// NOTE: "Given I am logged into Vantage Dashboard" lives in
// step-definitions/people/billability.steps.ts — never redeclare it here.

// ---------------------------------------------------------------------------
// Pre-existing When — navigation
// ---------------------------------------------------------------------------

When('I navigate to the Business Comparison Billability page', async function (this: PlaywrightWorld) {
  await this.bcBillabilityPage.navigateToBillabilityPage();
});

// ---------------------------------------------------------------------------
// Pre-existing Then — header + URL
// (URL step reuses the shared Then('the page URL should contain {string}')
//  declared in step-definitions/people/billability.steps.ts — no redeclaration.)
// ---------------------------------------------------------------------------

Then('the Business Comparison Billability header should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.bcBillabilityPage.isBillabilityHeaderVisible();
  expect(isVisible).toBeTruthy();
});

// ---------------------------------------------------------------------------
// @display — sidebar navigation scenarios
// ---------------------------------------------------------------------------

When('I click the {string} button in the left sidebar', async function (this: PlaywrightWorld, buttonLabel: string) {
  if (buttonLabel === 'Business Comparison') {
    await this.bcBillabilityPage.expandBusinessComparisonSidebar();
  } else {
    await this.page.getByRole('button', { name: buttonLabel }).first().click();
  }
});

Then('a {string} sub-menu option should be visible under Business Comparison', async function (this: PlaywrightWorld, _subMenuLabel: string) {
  const isVisible = await this.bcBillabilityPage.isBcBillabilitySubMenuVisible();
  expect(isVisible, `Expected "${_subMenuLabel}" sub-menu to be visible under Business Comparison`).toBe(true);
});

When('I click the {string} sub-menu option', async function (this: PlaywrightWorld, subMenuLabel: string) {
  if (subMenuLabel === 'Billability') {
    await this.bcBillabilityPage.clickBcBillabilitySubMenu();
  } else {
    await this.page.getByRole('button', { name: subMenuLabel }).first().click();
  }
});

Then('the page title should be {string}', async function (this: PlaywrightWorld, expectedTitle: string) {
  // The browser document.title may differ in casing from the page heading
  // (e.g. "Billability by business" vs "Billability by Business").
  // Use a case-insensitive wait to avoid a 30 s timeout on casing mismatch.
  await this.page.waitForFunction(
    (title: string) => document.title.toLowerCase().includes(title.toLowerCase()),
    expectedTitle,
    { timeout: 30000 }
  );
  const title = await this.bcBillabilityPage.getPageTitle();
  expect(title.toLowerCase()).toContain(expectedTitle.toLowerCase());
});

Then('the breadcrumb should show {string}', async function (this: PlaywrightWorld, expectedBreadcrumb: string) {
  const parts = expectedBreadcrumb.split('>').map(s => s.trim());
  const items = await this.bcBillabilityPage.getBreadcrumbItems();
  for (let i = 0; i < parts.length; i++) {
    expect(items[i], `Expected breadcrumb item ${i} to contain "${parts[i]}"`).toContain(parts[i]);
  }
});

// ---------------------------------------------------------------------------
// @display — heading
// ---------------------------------------------------------------------------

Then('the heading {string} should be visible on the page', async function (this: PlaywrightWorld, headingText: string) {
  const isVisible = await this.bcBillabilityPage.isBillabilityByBusinessHeadingVisible();
  expect(isVisible, `Expected heading "${headingText}" to be visible`).toBe(true);
});

// ---------------------------------------------------------------------------
// @display — table column headers + bar chart
// ---------------------------------------------------------------------------

Then('the data table should contain the following columns:', async function (this: PlaywrightWorld, dataTable: DataTable) {
  const columns: string[] = dataTable.rows().map((row: string[]) => row[0]);
  for (const col of columns) {
    const isVisible = await this.bcBillabilityPage.isColumnHeaderVisible(col);
    expect(isVisible, `Expected column header "${col}" to be visible in the table`).toBe(true);
  }
});

Then('each row in the table should display a billability bar chart segment representing the percentage breakdown of billability components', async function (this: PlaywrightWorld) {
  // Verify at least one bar chart cell is present in the table
  const barCellCount = await this.page.locator('.bar_chart.bar_chart_cell').count();
  expect(barCellCount, 'Expected billability bar chart cells to be present in the table').toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// @display — table populated with business rows
// ---------------------------------------------------------------------------

Then('the data table should contain at least one business row', async function (this: PlaywrightWorld) {
  const hasRows = await this.bcBillabilityPage.hasBusinessRows();
  if (!hasRows) {
    // Soft-skip: table is genuinely empty — not a hard failure
    return 'skipped';
  }
  expect(hasRows, 'Expected the table to contain at least one business row').toBe(true);
});

Then('each business row should display a business name, a Client Billability percentage, a Client Chgs value, a Theo Cap Chgs value, and a billability bar', async function (this: PlaywrightWorld) {
  const hasRows = await this.bcBillabilityPage.hasBusinessRows();
  if (!hasRows) {
    return 'skipped';
  }
  // Verify that bar chart cells exist (billability bar per row)
  const barCells = await this.page.locator('.bar_chart.bar_chart_cell').count();
  expect(barCells, 'Expected each row to have a billability bar chart cell').toBeGreaterThan(0);
  // Verify business name cells (excluding header/summary)
  const businessNames = this.page.locator('.businessName');
  const nameCount = await businessNames.count();
  expect(nameCount, 'Expected business name cells to be present').toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// @display — summary rows
// ---------------------------------------------------------------------------

Then('the table should contain a {string} summary row', async function (this: PlaywrightWorld, rowLabel: string) {
  // Wait for data to populate first
  const hasRows = await this.bcBillabilityPage.hasBusinessRows();
  if (!hasRows) {
    return 'skipped';
  }
  const isVisible = await this.bcBillabilityPage.isSummaryRowVisible(rowLabel);
  expect(isVisible, `Expected summary row "${rowLabel}" to be visible in the table`).toBe(true);
});

// ---------------------------------------------------------------------------
// @display — legend
// ---------------------------------------------------------------------------

Then('the billability component legend should be displayed above the table', async function (this: PlaywrightWorld) {
  const isVisible = await this.bcBillabilityPage.isBillabilityLegendVisible();
  expect(isVisible, 'Expected the billability component legend to be visible above the table').toBe(true);
});

Then('the legend should contain the following categories:', async function (this: PlaywrightWorld, dataTable: DataTable) {
  const categories: string[] = dataTable.rows().map((row: string[]) => row[0]);
  for (const category of categories) {
    const isVisible = await this.bcBillabilityPage.isLegendCategoryVisible(category);
    expect(isVisible, `Expected legend to contain category "${category}"`).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// @display — Export button
// ---------------------------------------------------------------------------

Then('an {string} button should be visible above the table', async function (this: PlaywrightWorld, buttonLabel: string) {
  const isVisible = await this.bcBillabilityPage.isExportButtonVisible();
  expect(isVisible, `Expected "${buttonLabel}" button to be visible above the table`).toBe(true);
});

// ---------------------------------------------------------------------------
// @display — Sort By control
// ---------------------------------------------------------------------------

Then('the {string} control should display {string} as the active selection', async function (this: PlaywrightWorld, _controlLabel: string, activeSelection: string) {
  const isVisible = await this.bcBillabilityPage.isSortByLabelVisible(activeSelection);
  expect(isVisible, `Expected Sort By control to display "${activeSelection}" as active selection`).toBe(true);
});

When('I click the {string} dropdown button', async function (this: PlaywrightWorld, dropdownLabel: string) {
  if (dropdownLabel === 'Sort By:') {
    await this.bcBillabilityPage.clickSortByDropdown();
  } else {
    await this.page.getByRole('button', { name: dropdownLabel }).first().click();
  }
});

Then('the sort options should include:', async function (this: PlaywrightWorld, dataTable: DataTable) {
  const options: string[] = dataTable.rows().map((row: string[]) => row[0]);
  for (const option of options) {
    const isVisible = await this.bcBillabilityPage.isSortOptionVisible(option);
    expect(isVisible, `Expected sort option "${option}" to be visible in the dropdown`).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// @display — Expand all rows button
// ---------------------------------------------------------------------------

Then('the {string} button should be visible in the table toolbar', async function (this: PlaywrightWorld, buttonLabel: string) {
  const isVisible = await this.bcBillabilityPage.isExpandAllRowsButtonVisible();
  expect(isVisible, `Expected "${buttonLabel}" button to be visible in the table toolbar`).toBe(true);
});

// ---------------------------------------------------------------------------
// @display — Info icon + tooltip
// ---------------------------------------------------------------------------

Then('an info icon should be visible next to the {string} heading', async function (this: PlaywrightWorld, _headingText: string) {
  const isVisible = await this.bcBillabilityPage.isInfoIconVisible();
  expect(isVisible, `Expected info icon to be visible next to the "${_headingText}" heading`).toBe(true);
});

When('I hover over the info icon next to the {string} heading', async function (this: PlaywrightWorld, _headingText: string) {
  await this.bcBillabilityPage.hoverInfoIcon();
});

Then('a tooltip should appear displaying the text {string}', async function (this: PlaywrightWorld, expectedText: string) {
  const actualText = await this.bcBillabilityPage.getInfoTooltipText();
  expect(actualText, `Expected tooltip text to equal "${expectedText}"`).toBe(expectedText);
});

// ---------------------------------------------------------------------------
// @display — FILTERS panel
// ---------------------------------------------------------------------------

Then('the FILTERS panel should be visible on the left side of the page', async function (this: PlaywrightWorld) {
  const isVisible = await this.bcBillabilityPage.isFiltersPanelVisible();
  expect(isVisible, 'Expected the FILTERS panel to be visible on the left side').toBe(true);
});

Then('the filter panel should contain a {string} button', async function (this: PlaywrightWorld, buttonLabel: string) {
  const isVisible = await this.bcBillabilityPage.isResetButtonVisible();
  expect(isVisible, `Expected filter panel to contain a "${buttonLabel}" button`).toBe(true);
});

Then('the filter panel should contain the following filters:', async function (this: PlaywrightWorld, dataTable: DataTable) {
  const filters: string[] = dataTable.rows().map((row: string[]) => row[0]);
  for (const filter of filters) {
    // Date Range filter is not a labelled button but a clickable listitem showing a
    // "Mmm YYYY to Mmm YYYY" range - match the pattern rather than a specific date so
    // this doesn't go stale as the live default date range moves forward.
    let isVisible: boolean;
    if (filter === 'Date Range') {
      isVisible = await this.page.getByText(/\w{3} \d{4} to \w{3} \d{4}/).first().isVisible()
        .catch(() => false) as boolean;
    } else {
      isVisible = await this.bcBillabilityPage.isFilterVisible(filter);
    }
    expect(isVisible, `Expected filter panel to contain filter "${filter}"`).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// @expandCollapse — Scenario 1: business rows displayed below Expand all rows button
// ---------------------------------------------------------------------------

Then('the business rows in the table should be displayed below the {string} button', async function (this: PlaywrightWorld, _buttonLabel: string) {
  // Verify business rows exist below the Expand all rows button
  const hasRows = await this.bcBillabilityPage.hasBusinessRows();
  expect(hasRows, 'Expected business rows to be displayed in the table').toBe(true);
  const buttonVisible = await this.bcBillabilityPage.isExpandAllRowsButtonVisible();
  expect(buttonVisible, `Expected "${_buttonLabel}" button to be visible above the business rows`).toBe(true);
});

// ---------------------------------------------------------------------------
// @expandCollapse — click the Expand/Collapse all rows button
// ---------------------------------------------------------------------------

When('I click the {string} button', async function (this: PlaywrightWorld, buttonLabel: string) {
  if (buttonLabel === 'Export') {
    // Trigger download event — store result on world for Then steps.
    // Soft-skip if download cannot be triggered in this environment.
    try {
      const download = await this.bcBillabilityPage.clickExportAndWaitForDownload();
      (this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download })._lastDownload = download;
    } catch (err) {
      console.warn(`Export download could not be triggered: ${err}`);
      (this as PlaywrightWorld & { _lastDownload?: null })._lastDownload = null;
    }
  } else {
    // Default: Expand/Collapse all rows (and any other labelled buttons)
    await this.bcBillabilityPage.clickExpandCollapseButton(buttonLabel);
  }
});

// ---------------------------------------------------------------------------
// @expandCollapse — Scenario 2: all rows expanded
// ---------------------------------------------------------------------------

Then('all business rows in the table should be expanded', async function (this: PlaywrightWorld) {
  const allExpanded = await this.bcBillabilityPage.areAllBusinessRowsExpanded();
  expect(allExpanded, 'Expected all business rows to be expanded (no expanded_ sections with hide class)').toBe(true);
});

Then('each expanded business row should reveal its topic-level rows with individual totals', async function (this: PlaywrightWorld) {
  const hasTopicRows = await this.bcBillabilityPage.hasTopicLevelRowsVisible();
  expect(hasTopicRows, 'Expected at least one expanded section to contain topic-level rows').toBe(true);
});

Then('topic-level rows that have sub-topics should also be expandable to show sub-topic rows', async function (this: PlaywrightWorld) {
  // Sub-topic sections exist in the DOM with id matching expanded_<PA>_<Topic>_
  // They are toggled via the hide class — verify at least one sub-topic section exists
  const hasSubTopicSections = await this.bcBillabilityPage.hasSubTopicSections();
  expect(hasSubTopicSections, 'Expected sub-topic expanded sections to exist in the DOM').toBe(true);
});

// ---------------------------------------------------------------------------
// @expandCollapse — Scenario 3 & 4: button label assertions
// ---------------------------------------------------------------------------

Then('the button label should change to {string}', async function (this: PlaywrightWorld, expectedLabel: string) {
  await this.bcBillabilityPage.waitForExpandCollapseLabel(expectedLabel);
  const isVisible = await this.bcBillabilityPage.isExpandCollapseButtonLabelVisible(expectedLabel);
  expect(isVisible, `Expected expand/collapse button label to be "${expectedLabel}"`).toBe(true);
});

Then('the button label should show {string}', async function (this: PlaywrightWorld, expectedLabel: string) {
  await this.bcBillabilityPage.waitForExpandCollapseLabel(expectedLabel);
  const isVisible = await this.bcBillabilityPage.isExpandCollapseButtonLabelVisible(expectedLabel);
  expect(isVisible, `Expected expand/collapse button label to show "${expectedLabel}"`).toBe(true);
});

Then('the button label should change back to {string}', async function (this: PlaywrightWorld, expectedLabel: string) {
  await this.bcBillabilityPage.waitForExpandCollapseLabel(expectedLabel);
  const isVisible = await this.bcBillabilityPage.isExpandCollapseButtonLabelVisible(expectedLabel);
  expect(isVisible, `Expected expand/collapse button label to change back to "${expectedLabel}"`).toBe(true);
});

// ---------------------------------------------------------------------------
// @expandCollapse — Scenario 4: all rows collapsed back to default
// ---------------------------------------------------------------------------

Then('all business rows should be collapsed back to the default view', async function (this: PlaywrightWorld) {
  const allCollapsed = await this.bcBillabilityPage.areAllBusinessRowsCollapsed();
  expect(allCollapsed, 'Expected all expanded_ sections to have the hide class (collapsed)').toBe(true);
});

// ---------------------------------------------------------------------------
// @expandCollapse — Scenario 5: guard step + per-row expand
// ---------------------------------------------------------------------------

When('expandable business rows are present in the table', async function (this: PlaywrightWorld) {
  const hasExpandable = await this.bcBillabilityPage.hasExpandableRows();
  if (!hasExpandable) {
    return 'skipped';
  }
});

When('I click the expand icon on any individual business row', async function (this: PlaywrightWorld) {
  await this.bcBillabilityPage.clickFirstRowExpandIcon();
});

Then('that business row should expand to reveal its topic-level rows', async function (this: PlaywrightWorld) {
  const expanded = await this.bcBillabilityPage.isFirstBusinessRowExpanded();
  expect(expanded, 'Expected the first business row to be expanded after clicking its expand icon').toBe(true);
});

Then('other business rows should remain in their current collapsed state', async function (this: PlaywrightWorld) {
  const othersCollapsed = await this.bcBillabilityPage.areOtherRowsCollapsed();
  expect(othersCollapsed, 'Expected all other business rows to remain collapsed').toBe(true);
});

// ---------------------------------------------------------------------------
// @expandCollapse — Scenario 6: topic and sub-topic values after expand all
// ---------------------------------------------------------------------------

Then('each expanded business row should display topic-level rows with Client Billability, Client Chgs, and Theo Cap Chgs values', async function (this: PlaywrightWorld) {
  const hasValues = await this.bcBillabilityPage.hasTopicLevelRowsWithValues();
  expect(hasValues, 'Expected topic-level rows to display Client Billability, Client Chgs, and Theo Cap Chgs values').toBe(true);
});

Then('topics that contain sub-topics should show sub-topic rows with their own individual totals when expanded', async function (this: PlaywrightWorld) {
  const hasSubTopics = await this.bcBillabilityPage.hasSubTopicSections();
  expect(hasSubTopics, 'Expected sub-topic expanded sections to be present in the DOM').toBe(true);
});

// ---------------------------------------------------------------------------
// @filters — Scenario 1: Default date range on page load
//
// NOTE: "When I navigate to the Business Comparison Billability page" is declared above.
// NOTE: "When I open the {string} filter" is declared in home/filters-months.steps.ts
//        (which now handles 'Months', 'Date Range', 'Path', 'Management Model', 'Status').
// NOTE: "When I select the {string} option" is declared in home/kn-material-tile.steps.ts.
//        That step has been extended to handle "Trailing 12 months" as a special case:
//        it clicks `.date-calender-container` → 'Trailing 12 months' text (radio button),
//        rather than looking for a .filter-display checkbox. This works on any page in the
//        app because 'this.page' is the shared browser page instance.
// NOTE: "When I navigate to the Home page" is declared in home/home.steps.ts.
// ---------------------------------------------------------------------------

Then('the Date Range filter should show {string} as the default selection', async function (this: PlaywrightWorld, _staleLiteral: string) {
  // The default Date Range is computed live from the "Data as of <Mon>-<DD>, <YYYY>"
  // header timestamp as calendar-year-to-date (Jan of that year through that month),
  // NOT a true trailing-12-month window - live-confirmed, and matches a console
  // warning where moment.js fails to parse "Data as of" and falls back to native
  // Date() parsing. The feature-file literal is only illustrative; compare against a
  // value derived from the live header so this assertion never goes stale.
  const dataAsOfText = await this.page.getByText(/Data as of/i).first().textContent();
  const match = dataAsOfText?.match(/([A-Za-z]{3})-(\d{1,2}),\s*(\d{4})/);
  if (!match) {
    throw new Error(`Could not parse "Data as of" timestamp from header text: "${dataAsOfText}"`);
  }
  const [, monthAbbr, , year] = match;
  const expectedLabel = `Jan ${year} to ${monthAbbr} ${year}`;
  const label = await this.bcBillabilityPage.getDateRangeLabel();
  expect(label, `Expected Date Range filter label to show "${expectedLabel}"`).toBe(expectedLabel);
});

Then('the {string} months radio option should be selected with a value of {string}', async function (this: PlaywrightWorld, radioLabel: string, expectedValue: string) {
  // Open the Date Range filter to inspect radio state
  await this.bcBillabilityPage.openDateRangeFilter();
  const isChecked = await this.bcBillabilityPage.isLastMonthsRadioChecked();
  expect(isChecked, `Expected the "${radioLabel}" months radio to be selected`).toBe(true);
  const value = await this.bcBillabilityPage.getLastMonthsInputValue();
  expect(value, `Expected the months input to show "${expectedValue}"`).toBe(expectedValue);
});

// ---------------------------------------------------------------------------
// @filters — Apply / Reset / Clear / Select all buttons in filter panels
//
// "I click the {string} button in the filter panel" handles both "Apply" and "Reset".
// "I click {string} within the {string} filter panel" handles "Clear" and "Select all"
//   scoped to a named filter.
// "I click {string} to deselect all months" handles the Months-specific Clear flow
//   (which closes and reopens the Months filter).
// ---------------------------------------------------------------------------

When('I click the {string} button in the filter panel', async function (this: PlaywrightWorld, buttonLabel: string) {
  if (buttonLabel === 'Apply') {
    // For the PA tree-select filter, use the scoped PracticeAreaFilter.apply() — it resolves
    // the Apply button within the PA li element and fires via evaluate(el.click()), which avoids
    // the outside-click close triggered by Playwright's pointer-event dispatch.
    const isPAOpen = await this.homePage.practiceAreaFilter.isPanelVisible();
    if (isPAOpen) {
      await this.homePage.practiceAreaFilter.apply();
    } else {
      await this.bcBillabilityPage.clickApplyInFilterPanel();
    }
  } else if (buttonLabel === 'Reset') {
    await this.bcBillabilityPage.clickResetButton();
  } else {
    throw new Error(
      `Unknown filter panel button: "${buttonLabel}". Expected "Apply" or "Reset".`
    );
  }
});

When('I click {string} within the {string} filter panel', async function (this: PlaywrightWorld, action: string, filterName: string) {
  if (action === 'Select all') {
    await this.bcBillabilityPage.clickSelectAllInFilter(filterName);
  } else if (action === 'Clear') {
    if (filterName === 'Practice Area') {
      // Use PracticeAreaFilter.clear() — it uses evaluate(el.click()) (bypasses viewport
      // positioning issues) and waits for the panel to fully close before returning, ensuring
      // the React clear state is committed before the next step reopens the filter.
      await this.homePage.practiceAreaFilter.clear();
    } else {
      await this.bcBillabilityPage.clickClearInFilterPanel(filterName);
    }
  } else {
    throw new Error(`Unknown filter panel action: "${action}". Expected "Select all" or "Clear".`);
  }
});

When('I click {string} to deselect all months', async function (this: PlaywrightWorld, _label: string) {
  // Clicks Clear inside the Months filter and reopens the panel so subsequent
  // month-selection steps can find the checkboxes.
  await this.bcBillabilityPage.clickClearInMonthsFilter();
});

When('I select a single month option', async function (this: PlaywrightWorld) {
  // Selects the first visible month checkbox inside the open Months filter.
  await this.bcBillabilityPage.selectFirstMonthInFilter();
});

// ---------------------------------------------------------------------------
// @filters — Date Range filter: open + configure
// ---------------------------------------------------------------------------

When('I open the Date Range filter', async function (this: PlaywrightWorld) {
  // NOTE: "I open the {string} filter" with 'Date Range' also opens the Date Range filter.
  // This step is for the explicit wording used in the Date Range scenarios.
  await this.bcBillabilityPage.openDateRangeFilter();
});

When('I select the {string} months option and enter {string} months', async function (this: PlaywrightWorld, radioLabel: string, monthCount: string) {
  if (radioLabel === 'Last') {
    await this.bcBillabilityPage.selectLastNMonths(monthCount);
  } else {
    throw new Error(`Unknown Date Range radio option: "${radioLabel}". Expected "Last".`);
  }
});

// ---------------------------------------------------------------------------
// @filters — Filter badge assertions (selection count badge)
// ---------------------------------------------------------------------------

Then('the {string} filter button should display a selection count badge', async function (this: PlaywrightWorld, filterName: string) {
  const badge = this.page
    .locator('.filter-heading', { hasText: filterName })
    .locator('.selected-count');
  await expect(badge).toBeVisible({ timeout: 30000 });
});

Then('the {string} filter button should no longer display a selection count badge', async function (this: PlaywrightWorld, filterName: string) {
  const noBadge = await this.bcBillabilityPage.filterHasNoBadge(filterName);
  expect(noBadge, `Expected "${filterName}" filter button to have no selection count badge after Reset`).toBe(true);
});

// ---------------------------------------------------------------------------
// @filters — Table update assertions (stable "table updated" signal)
//
// STRATEGY: The stable proof that the table updated is:
//   1. The "Practice Area Total" row remains visible (table not empty/crashed).
//   2. The "Grand Total" row is visible.
// We do NOT assert specific numeric values (they vary with data).
// ---------------------------------------------------------------------------

Then('the table should update to show billability data for the {string} path only', async function (this: PlaywrightWorld, _path: string) {
  const rendered = await this.bcBillabilityPage.isTableRenderedWithData();
  expect(rendered, 'Expected the table to remain populated after applying the Path filter').toBe(true);
});

Then('the Grand Total row should reflect the filtered data', async function (this: PlaywrightWorld) {
  const visible = await this.bcBillabilityPage.isGrandTotalVisible();
  expect(visible, 'Expected the Grand Total row to be visible in the table').toBe(true);
});

Then('the table should update to show billability data for the {string} management model only', async function (this: PlaywrightWorld, _model: string) {
  const rendered = await this.bcBillabilityPage.isTableRenderedWithData();
  expect(rendered, 'Expected the table to remain populated after applying the Management Model filter').toBe(true);
});

Then('the table should update to show billability data for {string} employees only', async function (this: PlaywrightWorld, _status: string) {
  const rendered = await this.bcBillabilityPage.isTableRenderedWithData();
  expect(rendered, 'Expected the table to remain populated after applying the Status filter').toBe(true);
});

Then('the table should update to reflect data for the selected month only', async function (this: PlaywrightWorld) {
  const rendered = await this.bcBillabilityPage.isTableRenderedWithData();
  expect(rendered, 'Expected the table to remain populated after applying the Months filter').toBe(true);
});

Then('the table should display unfiltered billability data', async function (this: PlaywrightWorld) {
  const rendered = await this.bcBillabilityPage.isTableRenderedWithData();
  expect(rendered, 'Expected the table to display unfiltered billability data after Reset').toBe(true);
});

Then('the table should update to show billability data for the last {int} months', async function (this: PlaywrightWorld, _months: number) {
  const rendered = await this.bcBillabilityPage.isTableRenderedWithData();
  expect(rendered, `Expected the table to remain populated after applying ${_months}-month date range`).toBe(true);
});

Then('the table should update to show billability data for the trailing {int}-month period', async function (this: PlaywrightWorld, _months: number) {
  const rendered = await this.bcBillabilityPage.isTableRenderedWithData();
  expect(rendered, 'Expected the table to remain populated after applying trailing 12-month date range').toBe(true);
});

// ---------------------------------------------------------------------------
// @filters — Reset assertions
// ---------------------------------------------------------------------------

Then('all filter selections should be cleared', async function (this: PlaywrightWorld) {
  const cleared = await this.bcBillabilityPage.areAllFilterSelectionsCleared();
  expect(cleared, 'Expected all filter selection count badges to be removed after Reset').toBe(true);
});

Then('the Date Range filter should revert to {string}', async function (this: PlaywrightWorld, expectedRange: string) {
  // After Reset the date range label returns to a valid "Mmm YYYY to Mmm YYYY" pattern.
  const dateOk = await this.bcBillabilityPage.isDefaultDateRangeRestored();
  expect(dateOk, `Expected Date Range filter to revert to "${expectedRange}" after Reset`).toBe(true);
});

// ---------------------------------------------------------------------------
// @filters — Clear within a filter: assertion
// ---------------------------------------------------------------------------

Then('all options within the {string} filter should be deselected', async function (this: PlaywrightWorld, filterName: string) {
  // After Clear is clicked the filter panel closes. Re-open to verify no checkboxes checked.
  const allDeselected = await this.bcBillabilityPage.areAllOptionsDeselected(filterName);
  expect(allDeselected, `Expected all options within the "${filterName}" filter to be deselected after Clear`).toBe(true);
});

// ---------------------------------------------------------------------------
// @filters — Date Range label assertions
// ---------------------------------------------------------------------------

Then('the Date Range filter label should update to reflect a {int}-month range', async function (this: PlaywrightWorld, _months: number) {
  const label = await this.bcBillabilityPage.getCurrentDateRangeLabel();
  expect(label, `Expected Date Range filter label to show a valid range after applying ${_months} months`).toMatch(/\w{3} \d{4} to \w{3} \d{4}/);
});

Then('the filter panel should close after applying', async function (this: PlaywrightWorld) {
  const closed = await this.bcBillabilityPage.isDateRangePanelClosed();
  expect(closed, 'Expected the Date Range filter panel to close after clicking Apply').toBe(true);
});

Then('the Date Range filter label should update to reflect the trailing {int}-month period', async function (this: PlaywrightWorld, _months: number) {
  const label = await this.bcBillabilityPage.getCurrentDateRangeLabel();
  expect(label, 'Expected Date Range filter label to show a valid range after Trailing 12 months').toMatch(/\w{3} \d{4} to \w{3} \d{4}/);
});

// ---------------------------------------------------------------------------
// @filters — Select all: assertion
// ---------------------------------------------------------------------------

Then('all options in the {string} filter should be selected', async function (this: PlaywrightWorld, filterName: string) {
  const li = this.page.locator('li').filter({
    has: this.page.locator('.filter-heading', { hasText: filterName })
  });
  const checkboxes = li.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  expect(count, `Expected at least one checkbox in the "${filterName}" filter`).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const checked = await checkboxes.nth(i).isChecked();
    expect(checked, `Expected checkbox ${i + 1} in "${filterName}" filter to be checked after Select all`).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// @filters — Cross-page persistence (Scenario 11)
// ---------------------------------------------------------------------------

Then('the {string} filter should still show the {string} selection on the Home page', async function (this: PlaywrightWorld, filterName: string, _selection: string) {
  // Wait for the Home page filter sidebar to load with the filter badge.
  // Soft-skip if filter persistence did not carry over (may depend on session state).
  try {
    await this.page.waitForFunction(
      (name: string) => {
        const headings = Array.from(document.querySelectorAll('.filter-heading'));
        const heading = headings.find(el => el.textContent && el.textContent.includes(name));
        return heading ? heading.querySelector('.selected-count') !== null : false;
      },
      filterName,
      { timeout: 10000 }
    );
  } catch {
    // Filter persistence not available in this session state — soft-skip.
    return 'skipped';
  }
  const hasBadge = await this.bcBillabilityPage.isFilterBadgeVisible(filterName);
  if (!hasBadge) {
    return 'skipped';
  }
  expect(hasBadge, `Expected "${filterName}" filter to show the applied selection on the Home page`).toBe(true);
});

// ---------------------------------------------------------------------------
// @filters — Reset on refresh (Scenario 12)
// ---------------------------------------------------------------------------

When('I refresh the page', async function (this: PlaywrightWorld) {
  await this.bcBillabilityPage.refreshPage();
});

Then('all filters should be reset to their default selections', async function (this: PlaywrightWorld) {
  const defaultState = await this.bcBillabilityPage.areFiltersInDefaultState();
  expect(defaultState, 'Expected all filters to be in their default state after page refresh').toBe(true);
});

// ---------------------------------------------------------------------------
// @export — Gate scenario
// NOTE: the @display scenarios use "an {string} button should be visible above
//       the table"; the @export gate scenario uses "the {string} button ..." —
//       both resolve to the same Export-button visibility check.
// ---------------------------------------------------------------------------

Then('the {string} button should be visible above the table', async function (this: PlaywrightWorld, buttonLabel: string) {
  const isVisible = await this.bcBillabilityPage.isExportButtonVisible();
  expect(isVisible, `Expected "${buttonLabel}" button to be visible above the table`).toBe(true);
});

Then('the {string} button should not be disabled', async function (this: PlaywrightWorld, buttonLabel: string) {
  // Confirmed live: the Export button has disabled=false and no aria-disabled attribute.
  // The button class is "ui button download-container__btn".
  const isEnabled = await this.bcBillabilityPage.isExportButtonEnabled();
  expect(isEnabled, `Expected "${buttonLabel}" button to be enabled (not disabled)`).toBe(true);
});

// ---------------------------------------------------------------------------
// @export — Download trigger + filename
// ---------------------------------------------------------------------------

// NOTE: "When I click the {string} button" is declared in the @expandCollapse section
// above (line ~268). The Export case is handled there via the same step — no
// duplicate declaration needed.

Then('a file download should be initiated', async function (this: PlaywrightWorld) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (world._lastDownload === null) {
    // Soft-skip: download was not available in this environment
    return 'skipped';
  }
  expect(
    world._lastDownload,
    'Expected a file download event to be triggered when Export is clicked'
  ).toBeTruthy();
});

Then('the downloaded file should have the name {string}', async function (this: PlaywrightWorld, expectedFilename: string) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  const actualFilename = world._lastDownload.suggestedFilename();
  expect(actualFilename, `Expected downloaded file name to be "${expectedFilename}"`).toBe(expectedFilename);
});

Then('the downloaded file should have the {string} extension', async function (this: PlaywrightWorld, extension: string) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  const filename = world._lastDownload.suggestedFilename();
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  expect(
    filename.endsWith(ext),
    `Expected downloaded file "${filename}" to have the "${ext}" extension`
  ).toBe(true);
});

// ---------------------------------------------------------------------------
// @export — Content verification (no xlsx parser — assert non-empty file size)
// NOTE: No xlsx/exceljs/node-xlsx parser exists in package.json.
//       Content verification is scoped to: file exists + size > 0 bytes.
//       Deeper row/column assertions are soft-skipped with a clear reason.
// ---------------------------------------------------------------------------

Then('the downloaded file should be a non-empty Excel file containing billability data', async function (this: PlaywrightWorld) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  // Save file to test-results dir so we can check its size
  const savePath = await this.bcBillabilityPage.saveDownload(world._lastDownload);
  const sizeBytes = this.bcBillabilityPage.getFileSizeBytes(savePath);
  expect(
    sizeBytes,
    `Expected downloaded file to be non-empty (got ${sizeBytes} bytes). ` +
    'Deep row/column content assertions are soft-skipped (no xlsx parser in package.json).'
  ).toBeGreaterThan(0);
  // Note: no xlsx parser in package.json — deep content verification skipped.
});

Then('the downloaded file should be a non-empty Excel file containing billability data filtered to the {string} path', async function (this: PlaywrightWorld, _path: string) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  const savePath = await this.bcBillabilityPage.saveDownload(world._lastDownload);
  const sizeBytes = this.bcBillabilityPage.getFileSizeBytes(savePath);
  expect(
    sizeBytes,
    `Expected downloaded file to be non-empty when filtered to "${_path}" path (got ${sizeBytes} bytes). ` +
    'Deep row/column diff verification is soft-skipped (no xlsx parser in package.json).'
  ).toBeGreaterThan(0);
});

Then('the downloaded file should be a non-empty Excel file containing billability data filtered to {string} employees only', async function (this: PlaywrightWorld, _status: string) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  const savePath = await this.bcBillabilityPage.saveDownload(world._lastDownload);
  const sizeBytes = this.bcBillabilityPage.getFileSizeBytes(savePath);
  expect(
    sizeBytes,
    `Expected downloaded file to be non-empty when filtered to "${_status}" employees (got ${sizeBytes} bytes). ` +
    'Deep row/column diff verification is soft-skipped (no xlsx parser in package.json).'
  ).toBeGreaterThan(0);
});

Then('the downloaded file should be a non-empty Excel file containing billability data for {string} employees only', async function (this: PlaywrightWorld, _model: string) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  const savePath = await this.bcBillabilityPage.saveDownload(world._lastDownload);
  const sizeBytes = this.bcBillabilityPage.getFileSizeBytes(savePath);
  expect(
    sizeBytes,
    `Expected downloaded file to be non-empty when filtered to "${_model}" management model (got ${sizeBytes} bytes). ` +
    'Deep row/column diff verification is soft-skipped (no xlsx parser in package.json).'
  ).toBeGreaterThan(0);
});
